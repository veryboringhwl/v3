# AGENTS.md

## Build Commands

### CLI (Rust)

```sh
cd cli && cargo build --release
```

Output: `cli/target/release/spicetify.exe`

### Modules (Deno)

```sh
cd modules
deno task cm:fetch
deno task pw:build
deno task pw:enable
```

### Hooks (TypeScript)

```sh
cd hooks && bunx tsc
```

### DevTools (React + Vite)

```sh
cd devtools && npm run dev
```

### Linting

```sh
biome check --write --unsafe  # Root-level JS/TS
deno task check              # In modules/
```

## Architecture

- **`cli/`** - Rust CLI entrypoint (`src/main.rs`). Commands: `init`, `apply`, `dev`, `config`, `update`, `sync`, `daemon`, `fix`
- **`modules/`** - Deno-based runtime modules with JSX. Import paths anchored at `/modules/` and `/hooks/`
- **`hooks/`** - TypeScript hooks compiled to `%LOCALAPPDATA%\Spicetify\hooks`. Organized into:
  - `core/` — Module tree, instances, loading engine, hotwire, types
  - `io/` — Daemon RPC, fetch, proxy
  - `runtime/` — Spotify constants, built-in transforms
  - `transform/` — TransformEngine, SourceFile
  - `util/` — Utilities (semver, merge, transition, etc.)
- **`creator/`** - Rust build tool for generating releases. Uses SWC for JSX transpilation (automatic runtime, importSource: `/modules/stdlib/src/expose`)
- **`devtools/`** - React + Vite devtools UI
- **`classmaps/`** - Spotify class ID mappings

## Important Quirks

- **DO NOT run `spicetify sync`**. V3 uses a newer hooks implementation. Use `bun tsc` instead
- This is Windows-specific (PowerShell scripts, `%LOCALAPPDATA%` paths)
- Requires Spotify desktop client `1.2.86` or newer
- Build order: CLI → hooks compilation → modules fetch/build
- Run `spicetify` for TUI

### Hooks Development

- `hooks/dist/` is **symlinked** to `%LOCALAPPDATA%\Spicetify\hooks`. After `bunx tsc`, just reload Spotify.
- Module types import from canonical paths:
  - Types → `/hooks/module.ts`
  - `hotwire`, `hotwired` → `/hooks/core/hotwire.ts`
  - `RootModule` → `/hooks/core/tree.ts`
  - `loadRemoteModules` → `/hooks/module.ts` (orchestration)
  - Utilities → `/hooks/util.ts`, `/hooks/util/semver.ts`
  - `proxy` → `/hooks/io/proxy.js`
- JSX is **entirely handled by creator** (SWC). `deno.json` has no `jsxImportSource` — it's just an optional type-resolution map.
