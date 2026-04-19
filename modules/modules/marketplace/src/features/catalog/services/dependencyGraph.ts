import { type ModuleIdentifier, type ModuleInstance, RootModule } from "/hooks/module.ts";
import { compare, parse, parseRange, satisfies } from "/hooks/std/semver.ts";

const compareVersionsDesc = (leftVersion: string, rightVersion: string) => {
  try {
    return compare(parse(rightVersion), parse(leftVersion));
  } catch {
    return rightVersion.localeCompare(leftVersion, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  }
};

const matchesVersionRange = (version: string, versionRange: string) => {
  if (!versionRange) {
    return true;
  }

  try {
    return satisfies(parse(version), parseRange(versionRange));
  } catch {
    return false;
  }
};

function intersectSets<T>(left: ReadonlySet<T>, right: ReadonlySet<T>) {
  const intersection = new Set<T>();

  for (const value of left) {
    if (right.has(value)) {
      intersection.add(value);
    }
  }

  return intersection;
}

const groupByModuleIdentifier = (instances: ModuleInstance[]) => {
  const grouped = new Map<ModuleIdentifier, ModuleInstance[]>();

  for (const instance of instances) {
    const moduleIdentifier = instance.getModuleIdentifier();
    const existing = grouped.get(moduleIdentifier);
    if (existing) {
      existing.push(instance);
      continue;
    }

    grouped.set(moduleIdentifier, [instance]);
  }

  return grouped;
};

export class ReadonlyDeps
  extends Map<ModuleIdentifier, ReadonlySet<ModuleInstance>>
  implements ReadonlyMap<ModuleIdentifier, ReadonlySet<ModuleInstance>>
{
  accumulateTo(...instances: ModuleInstance[]) {
    const deps = new Deps(this);
    if (!deps.accumulate(...instances)) {
      return null;
    }

    return deps;
  }
}

export class Deps
  extends ReadonlyDeps
  implements Map<ModuleIdentifier, ReadonlySet<ModuleInstance>>
{
  accumulate(...instances: ModuleInstance[]) {
    for (const [moduleIdentifier, groupedInstances] of groupByModuleIdentifier(instances)) {
      const candidates = new Set(groupedInstances);
      const existing = this.get(moduleIdentifier) ?? candidates;
      const intersection = intersectSets(candidates, existing);

      if (!intersection.size) {
        return false;
      }

      this.set(moduleIdentifier, intersection);
    }

    return true;
  }
}

export const getEnabledDependencies = () => {
  const deps = new Deps();

  for (const module of RootModule.INSTANCE.getDescendantsByDepth()) {
    const enabledInstance = module.getEnabledInstance();
    if (!enabledInstance) {
      continue;
    }

    if (!deps.accumulate(enabledInstance)) {
      throw new Error("Failed to build enabled dependency graph.");
    }
  }

  return deps;
};

export type DependencyTree = [ModuleInstance, ...DependencyTree[]];

const walkDependencyTree = (tree: DependencyTree, collected: ModuleInstance[]) => {
  collected.push(tree[0]);

  for (const dependencyTree of tree.slice(1) as DependencyTree[]) {
    walkDependencyTree(dependencyTree, collected);
  }
};

const flattenDependencyTree = (dependencyTree: DependencyTree) => {
  const flattened: ModuleInstance[] = [];
  walkDependencyTree(dependencyTree, flattened);

  const unique = new Map<ModuleIdentifier, ModuleInstance>();
  for (const instance of flattened.reverse()) {
    unique.set(instance.getModuleIdentifier(), instance);
  }

  return Array.from(unique.values());
};

export const flattenDependencyTrees = (dependencyTrees: DependencyTree[]) => {
  const flattened: ModuleInstance[] = [];

  for (const dependencyTree of dependencyTrees) {
    walkDependencyTree(dependencyTree, flattened);
  }

  const unique = new Map<ModuleIdentifier, ModuleInstance>();
  for (const instance of flattened.reverse()) {
    unique.set(instance.getModuleIdentifier(), instance);
  }

  return Array.from(unique.values());
};

const ensureModuleInstanceMetadata = async (instance: ModuleInstance) => {
  if (instance.metadata) {
    return true;
  }

  try {
    await instance.ensureMetadata();
    return true;
  } catch {
    return false;
  }
};

const sortInstancesByPreference = (instances: ModuleInstance[]) => {
  return [...instances].sort((left, right) => {
    if (left.isEnabled() !== right.isEnabled()) {
      return left.isEnabled() ? -1 : 1;
    }

    if (left.isInstalled() !== right.isInstalled()) {
      return left.isInstalled() ? -1 : 1;
    }

    return compareVersionsDesc(left.getVersion(), right.getVersion());
  });
};

async function* getModuleInstances(
  moduleIdentifier: ModuleIdentifier,
  versionRange: string,
): AsyncGenerator<ModuleInstance> {
  const module = RootModule.INSTANCE.getDescendant(moduleIdentifier);
  if (!module) {
    return;
  }

  const candidates = sortInstancesByPreference(
    Array.from(module.instances.values()).filter((instance) =>
      matchesVersionRange(instance.getVersion(), versionRange),
    ),
  );

  for (const candidate of candidates) {
    yield candidate;
  }
}

type AsyncGeneratorFactory<T> = () => AsyncGenerator<T>;
type SharedGeneratorFactories = WeakMap<ModuleInstance, AsyncGeneratorFactory<DependencyTree>>;

async function* getInstanceGeneratorCandidates(
  instanceGenerator: AsyncGenerator<ModuleInstance>,
  accumulator: ReadonlyDeps,
  sharedGenerators: SharedGeneratorFactories,
): AsyncGenerator<DependencyTree> {
  for await (const instance of instanceGenerator) {
    yield* getInstanceDependencyCandidates(instance, accumulator, sharedGenerators);
  }
}

async function* getDependenciesTreeCandidates(
  dependencies: Record<string, string>,
  accumulator = new ReadonlyDeps(),
  sharedGenerators: SharedGeneratorFactories = new WeakMap(),
): AsyncGenerator<DependencyTree[]> {
  const instanceGenerators = Object.entries(dependencies).map(([moduleIdentifier, versionRange]) =>
    getModuleInstances(moduleIdentifier as ModuleIdentifier, versionRange),
  );

  yield* getInstanceGeneratorsDependencyCandidates(
    instanceGenerators,
    accumulator,
    sharedGenerators,
  );
}

async function* getInstanceDependencyCandidates(
  instance: ModuleInstance,
  accumulator = new ReadonlyDeps(),
  sharedGenerators: SharedGeneratorFactories = new WeakMap(),
): AsyncGenerator<DependencyTree> {
  if (!(await ensureModuleInstanceMetadata(instance))) {
    return;
  }

  const nextAccumulator = accumulator.accumulateTo(instance);
  if (!nextAccumulator) {
    return;
  }

  async function* resolveCandidateTrees(
    target: ModuleInstance,
    acc: ReadonlyDeps,
    generators: SharedGeneratorFactories,
  ) {
    const dependencies = target.metadata?.dependencies ?? {};

    for await (const candidate of getDependenciesTreeCandidates(dependencies, acc, generators)) {
      yield [target, ...candidate] as DependencyTree;
    }
  }

  let sharedFactory = sharedGenerators.get(instance);
  if (!sharedFactory) {
    sharedFactory = createSharedGeneratorFactory(
      resolveCandidateTrees(instance, accumulator, sharedGenerators),
    );
    sharedGenerators.set(instance, sharedFactory);
  }

  for await (const candidate of sharedFactory()) {
    if (nextAccumulator.accumulateTo(...flattenDependencyTree(candidate))) {
      yield candidate;
    }
  }
}

export async function* getInstanceGeneratorsDependencyCandidates(
  instanceGenerators: Array<AsyncGenerator<ModuleInstance>>,
  accumulator = new ReadonlyDeps(),
  sharedGenerators: SharedGeneratorFactories = new WeakMap(),
): AsyncGenerator<DependencyTree[]> {
  const generators = instanceGenerators.map((instanceGenerator) =>
    (async function* () {
      yield* getInstanceGeneratorCandidates(instanceGenerator, accumulator, sharedGenerators);
    })(),
  );

  for await (const combination of getCombinationsFromGenerators(...generators)) {
    combinationCheck: {
      const combinationDeps = new Deps();

      for (const dependencyTree of combination) {
        if (!combinationDeps.accumulate(...flattenDependencyTree(dependencyTree))) {
          break combinationCheck;
        }
      }

      yield combination;
    }
  }
}

async function* getCombinationsFromGenerators<T>(
  ...generators: Array<AsyncGenerator<T>>
): AsyncGenerator<T[]> {
  const values: Array<Array<T>> = new Array(generators.length);

  for (let index = 0; index < generators.length; index += 1) {
    const result = await generators[index].next();
    if (result.done) {
      return;
    }

    values[index] = [result.value];
  }

  yield values.map((current) => current[0]);

  const completed = new Set<AsyncGenerator<T>>();
  for (
    let index = 0;
    completed.size !== generators.length;
    index = (index + 1) % generators.length
  ) {
    if (completed.has(generators[index])) {
      continue;
    }

    const result = await generators[index].next();
    if (result.done) {
      completed.add(generators[index]);
      continue;
    }

    yield* getCombinationsFromArrays(...values.toSpliced(index, 1, [result.value]));

    values[index].push(result.value);
  }
}

function* getCombinationsFromArrays<T>(...arrays: Array<Array<T>>): Generator<Array<T>> {
  if (arrays.some((array) => array.length === 0)) {
    return;
  }

  const indexes = new Array(arrays.length).fill(0);
  yield arrays.map((array, index) => array[indexes[index]]);

  let completedCount = 0;
  for (let index = 0; completedCount !== arrays.length; index = (index + 1) % arrays.length) {
    if (indexes[index] === arrays[index].length) {
      continue;
    }

    if (++indexes[index] === arrays[index].length) {
      completedCount += 1;
      continue;
    }

    yield* getCombinationsFromArrays(
      ...arrays.map((array, arrayIndex) =>
        index === arrayIndex
          ? [array[indexes[arrayIndex]]]
          : array.slice(0, indexes[arrayIndex] + 1),
      ),
    );
  }
}

function createSharedGeneratorFactory<T>(generator: AsyncGenerator<T>): AsyncGeneratorFactory<T> {
  const cache: T[] = [];

  async function next(index: number) {
    if (index === cache.length) {
      const result = await generator.next();
      if (result.done) {
        return -1;
      }

      cache.push(result.value);
    }

    return index + 1;
  }

  return async function* () {
    for (let index = 0; (index = await next(index)) >= 0; ) {
      yield cache[index - 1];
    }
  };
}
