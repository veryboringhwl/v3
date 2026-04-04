fn main() {
    if let Err(err) = spicetify::run(None) {
        eprintln!("\x1b[31;1mFATAL\x1b[0m {err}");
        std::process::exit(1);
    }
}
