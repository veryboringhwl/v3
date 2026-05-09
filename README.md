# v3

This repository contains the current `Spicetify` v3 implementation.

- A previous `Spicetify v2` installation should be removed or backed up before proceeding (Only %LOCALAPPDATA% or platform equivilent as roaming isnt used)

# COMPLETELY UNTESTED ON LINUX AND MACOS

## Prerequisites

- Usually the latest Spotify ver `1.2.89 as of 30/04/226`

## Install Steps

### 1. Install spotify

Download and run the latest installer e.g `installer-0.0.1-windows-amd64.msi`

once installed run

```sh
spicetify sync
```

### 2. Build the modules

Go back to the modules folder
Run the following Deno tasks in order:

```sh
deno task cm:fetch
deno task pw:build
deno task pw:enable
```

### Uninstalling

Use windows settings app to uninstall

## Notes

## Building from source

## Prerequisites

Install the following before building:

- [Rust](https://www.rust-lang.org/tools/install)
- [Deno](https://deno.com/)
- [Bun](https://bun.sh/)
- [Pwsh](https://learn.microsoft.com/en-us/powershell/scripting/install/install-powershell-on-windows/)

### 1. Build the CLI

In `%LOCALAPPDATA%` create a folder called `Spicetify` inside create another folder called `bin`.

From the downloaded `cli` directory:

```sh
cargo build --release
```

After the build completes, the executable will be located at:

```text
cli/target/release/spicetify.exe
```

Copy it to your Spicetify bin directory, for example:

```text
%LOCALAPPDATA%\Spicetify\bin\spicetify.exe
```

### 3. Initialize Spicetify

Run:

```sh
spicetify init
```

`cd devtools` and then run `bun install` and then `bun run build`
Run `spicetify dev` to enable devtools
In spotify use keybing ctrl + shift + t to open chrome urls and then use ctrl + n to open a new window
Press the 3 dots in the top right corner and go to extensions and manage extensions
In the top right of the page enable developer mode and then click load unpacked and select the `devtools` folder in this repository (NOT BUILD FOLDER)
Restart spotify and in spotify devtools you will see Mapped Elements page
In the bottom right there is a blue settings icon paste in the latest classmap version from the `classmaps` folder and press save
This will give you the dom but with mapped elements and the classmap entry it is mapped to on hover.

> [!IMPORTANT]
> run `deno run -A npm:@biomejs/biome check --write --unsafe --diagnostic-level=info` to format the entire codebase.
> If updating hooks run `bunx tsgo` and then reload spotify and it will update
> If building modules run `deno task pw:build` after every change and reload or use `deno task pw:watch` and it will hot-reload for you.
> `deno task cm:fetch` replaces your classmap with the one from `https://github.com/veryboringhwl/v3/tree/main/classmaps`
