# v3

This repository contains the current `Spicetify` v3 implementation, including the CLI, hooks, and build-time modules.

## Prerequisites

Install the following before building:

- [Rust](https://www.rust-lang.org/tools/install)
- [Deno](https://deno.com/)
- [Node.js](https://nodejs.org/)
- [Bun](https://bun.sh/)
- Spotify desktop client `1.2.85`
- A previous `Spicetify v2` installation should be removed or backed up before proceeding

## Build Steps

### 1. Build the CLI

From the `cli` directory:

```sh
cargo build --release
```

After the build completes, the executable will be located at:

```text
cli/target/release/spicetify.exe
```

Copy it to your local Spicetify bin directory, for example:

```text
%LOCALAPPDATA%\Spicetify\bin\spicetify.exe
```

### 2. Add the bin directory to your PATH

If on Windows, copy and paste this into terminal

```powershell
$user = [EnvironmentVariableTarget]::User
$path = [Environment]::GetEnvironmentVariable('PATH', $user)
$path = "$path;$env:LOCALAPPDATA\Spicetify\bin"
[Environment]::SetEnvironmentVariable('PATH', $path, $user)
```

Then restart your terminal so the updated PATH is updated.

### 3. Initialize Spicetify

Run:

```sh
spicetify init
```

### 4. Prepare the hooks

Create the hooks directory under:

```text
%LOCALAPPDATA%\Spicetify\hooks
```

Then copy the contents of this repository’s `hooks` folder into that location.

After that, compile the hooks from the `hooks` folder:

```sh
bunx tsc
```

### 5. Build the Rust plugins

Open the `modules/build` directory and build both Rust SWC plugins.

For each plugin package:

```sh
bun run build
```

The two plugin packages are:

- `swc-plugin-remapper`
- `swc-plugin-transform-module-specifiers`

### 6. Build the modules

Go back to the modules folder
Run the following Deno tasks in order:

```sh
deno task cm:fetch
deno task pw:build
deno task pw:enable
```

### 7. Apply Spicetify

Once everything is built, run:

```sh
spicetify apply
```

## Notes

> [!IMPORTANT]
> Do not run `spicetify fetch`. V3 relies on the newer hooks implementation, and `spicetify fetch` uses the hooks from the Spicetify repository which are oudated.

### `TypeError: Cannot read properties of undefined (reading 'getPlayerAPI')`

If you see this error, reload Spotify and try again. It usually fixes after a reload.

Run `spicetify` in terminal to open the TUI.

If developing modules just run `pw:build` and the close and reopen Spotify
