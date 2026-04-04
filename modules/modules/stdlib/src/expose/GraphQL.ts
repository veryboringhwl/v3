import { transformer } from "../../mixin.ts";

export type GraphQLOp = "query" | "mutation";
export type GraphQLDef<N extends string, O extends GraphQLOp> = {
  name: N;
  operation: O;
  sha256Hash: string;
  value: null;
};
export type GraphQLDefs = {
  [O in GraphQLOp]: { [N in string]: GraphQLDef<N, O> };
};

export const GraphQLDefs = {
  query: {},
  mutation: {},
} as GraphQLDefs;

transformer(
  (emit) => (str) => {
    emit();

    const matches = str.matchAll(
      /(=new [a-zA-Z_$][\w$]*\.[a-zA-Z_$][\w$]*\("(?<name>\w+)","(?<operation>query|mutation)","(?<sha256Hash>[\w\d]{64})",null\))/g,
    );
    for (const match of matches) {
      const { name, operation, sha256Hash } = match.groups!;
      // @ts-expect-error
      GraphQLDefs[operation][name] = {
        name,
        operation,
        sha256Hash,
        value: null,
      };
    }

    return str;
  },
  {
    glob: /.+\.js$/,
  },
);
