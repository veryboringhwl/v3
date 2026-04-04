build steps
install rust
install deno
install node
install bun
remove/backup spicetify v2

1. go to cli folder and run "cargo build --release"
2. go to cli/target/release and find `spicetify.exe`
3. move `spicetify.exe` to a folder called `bin` in local app data (e.g. `%localappdata%\Spicetify\bin\spicetify.exe`)
4. add to path

```
   $user = [EnvironmentVariableTarget]::User
$path = [Environment]::GetEnvironmentVariable('PATH', $user)
$path = "$path;$env:LOCALAPPDATA\spicetify\bin"
   [Environment]::SetEnvironmentVariable('PATH', $path, $user)

```

5. restart terminal
6. run `spicetify init`
7. create hooks folder in `%localappdata%\Spicetify`
8. copy all the files from hooks folder to `%localappdata%\Spicetify\hooks`
9. run `bunx tsc` in the hooks folder
10. open modules folder
11. open build and for both swc plugins run `bun run build` for both
12. `deno task cm:fetch` then `deno task pw:build` then `deno task pw:enable`
13. run `spicetify apply`
14. can run spicetify to open tui
