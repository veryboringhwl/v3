use std::sync::mpsc::Sender;
use std::sync::{Mutex, OnceLock};

#[derive(Default)]
struct CaptureState {
    enabled: bool,
    lines: Vec<String>,
    stream: Option<Sender<String>>,
}

fn capture_state() -> &'static Mutex<CaptureState> {
    static STATE: OnceLock<Mutex<CaptureState>> = OnceLock::new();
    STATE.get_or_init(|| Mutex::new(CaptureState::default()))
}

pub fn capture_begin_stream(stream: Sender<String>) {
    if let Ok(mut state) = capture_state().lock() {
        state.enabled = true;
        state.lines.clear();
        state.stream = Some(stream);
    }
}

pub fn capture_end() -> Vec<String> {
    if let Ok(mut state) = capture_state().lock() {
        state.enabled = false;
        state.stream = None;
        return std::mem::take(&mut state.lines);
    }
    Vec::new()
}

fn emit(level: &str, ansi: &str, message: &str) {
    if let Ok(mut state) = capture_state().lock()
        && state.enabled
    {
        let line = format!("{level} {message}");
        state.lines.push(line.clone());
        if let Some(stream) = &state.stream {
            let _ = stream.send(line);
        }
        return;
    }

    eprintln!("\x1b[{ansi}m{level}\x1b[0m {message}");
}

pub fn info(message: &str) {
    emit("INFO", "36", message);
}

pub fn warn(message: &str) {
    emit("WARN", "33", message);
}

pub fn error(message: &str) {
    emit("ERROR", "31", message);
}

pub fn fatal(message: &str) {
    emit("FATAL", "31;1", message);
}
