# v3

This repository contains the current `Spicetify` v3 implementation.

- A previous `Spicetify v2` installation should be removed or backed up before proceeding (Only %LOCALAPPDATA% or platform equivilent as roaming isnt used)

## Prerequisites

Install the following before building:

- [Rust](https://www.rust-lang.org/tools/install)
- [Deno](https://deno.com/)
- [Bun](https://bun.sh/)
- [Pwsh](https://learn.microsoft.com/en-us/powershell/scripting/install/install-powershell-on-windows/)
- Usually the latest Spotify ver `1.2.89 as of 30/04/226`

## Build Steps

### 1. Build the CLI

In `%%LOCALAPPDATA%%` create a folder called `Spicetify` inside create another folder called `bin`.

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
bunx tsgo
```

### 5. Build the modules

Go back to the modules folder
Run the following Deno tasks in order:

```sh
deno task cm:fetch
deno task pw:build
deno task pw:enable
```

### 6. Apply Spicetify

Once everything is built, run:

```sh
spicetify apply
```

### 6. Install DevTools extension

`cd devtools` and then run `bun install` and then `bun run build`
Run `spicetify dev` to enable devtools
In spotify use keybing ctrl + shift + t to open chrome urls and then use ctrl + n to open a new window
Press the 3 dots in the top right corner and go to extensions and manage extensions
In the top right of the page enable developer mode and then click load unpacked and select the `devtools` folder in this repository (NOT BUILD FOLDER)
Restart spotify and in spotify devtools you will see Mapped Elements page
In the bottom right there is a blue settings icon paste in the latest classmap version from the `classmaps` folder and press save
This will give you the dom but with mapped elements and the classmap entry it is mapped to on hover.

## Notes

> [!IMPORTANT]
> If updating hooks run `bunx tsgo` and then reload spotify and it will update
> Do not run `spicetify sync`. This currently doesnt have a github release yet and will remove your hooks
> If building modules run `deno task pw:build` after every change and reload or use `deno task pw:watch` and it will hot-reload for you.
> `deno task cm:fetch` replaces your classmap with the one from `https://github.com/veryboringhwl/v3/tree/main/classmaps`
