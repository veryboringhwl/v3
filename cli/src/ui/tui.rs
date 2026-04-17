use std::collections::VecDeque;
use std::io;
use std::net::{SocketAddr, TcpStream, ToSocketAddrs};
use std::process::{Command, Stdio};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::{self, Receiver, RecvTimeoutError, Sender};
use std::thread;
use std::time::{Duration, Instant};

use anyhow::{Context, Result, anyhow};
use crossterm::event::{self, Event, KeyCode, KeyEvent, KeyEventKind, KeyModifiers};
use crossterm::execute;
use crossterm::terminal::{
    EnterAlternateScreen, LeaveAlternateScreen, disable_raw_mode, enable_raw_mode,
};
use ratatui::Terminal;
use ratatui::backend::CrosstermBackend;
use ratatui::layout::{Constraint, Direction, Layout};
use ratatui::style::{Color, Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Block, BorderType, Borders, List, ListItem, ListState, Paragraph, Wrap};

use crate::application::dispatcher;
use crate::core::app::AppContext;
use crate::core::cli::{DaemonAction, SpicetifyCommand, UpdateMode};
use crate::utils::logging;

const FRAME_INTERVAL: Duration = Duration::from_millis(33);
const INPUT_POLL_INTERVAL: Duration = Duration::from_millis(50);
const SPINNER_INTERVAL: Duration = Duration::from_millis(110);
const BUDDY_TICK_INTERVAL: Duration = Duration::from_millis(220);
const DAEMON_STATUS_CHECK_INTERVAL: Duration = Duration::from_secs(1);
const DAEMON_CONNECT_TIMEOUT: Duration = Duration::from_millis(120);
const DAEMON_ADDR: &str = "localhost:7967";
const MAX_LOG_LINES: usize = 400;
const LAST_RUN_VISIBLE_LINES: usize = 14;
const SPINNER_FRAMES: [&str; 4] = ["-", "\\", "|", "/"];
const BUDDY_POSES: [[&str; 3]; 4] = [
    [" ▐▛███▜▌", "▝▜█████▛▘", "  ▘▘ ▝▝  "],
    [" ▐▟███▟▌", "▝▜█████▛▘", "  ▘▘ ▝▝  "],
    [" ▐▙███▙▌", "▝▜█████▛▘", "  ▘▘ ▝▝  "],
    ["▗▟▛███▜▙▖", " ▜█████▛ ", "  ▘▘ ▝▝  "],
];

#[derive(Clone, Copy)]
enum MenuAction {
    Apply,
    Fix,
    Dev,
    Sync,
    UpdateOn,
    UpdateOff,
    Daemon,
    DaemonStop,
    DaemonEnable,
    DaemonDisable,
    Config,
}

impl MenuAction {
    const ALL: [Self; 11] = [
        Self::Apply,
        Self::Fix,
        Self::Dev,
        Self::Sync,
        Self::UpdateOn,
        Self::UpdateOff,
        Self::Daemon,
        Self::DaemonStop,
        Self::DaemonEnable,
        Self::DaemonDisable,
        Self::Config,
    ];

    fn label(self) -> &'static str {
        match self {
            Self::Apply => "apply",
            Self::Fix => "fix",
            Self::Dev => "dev",
            Self::Sync => "sync",
            Self::UpdateOn => "update on",
            Self::UpdateOff => "update off",
            Self::Daemon => "daemon",
            Self::DaemonStop => "daemon stop",
            Self::DaemonEnable => "daemon enable",
            Self::DaemonDisable => "daemon disable",
            Self::Config => "config",
        }
    }

    fn summary(self) -> &'static str {
        match self {
            Self::Apply => "Apply hooks/modules to Spotify",
            Self::Fix => "Restore Spotify to stock state",
            Self::Dev => "Enable app-developer mode",
            Self::Sync => "Sync hook files",
            Self::UpdateOn => "Allow native Spotify updates",
            Self::UpdateOff => "Block native Spotify updates",
            Self::Daemon => "Start background daemon runtime",
            Self::DaemonStop => "Stop running daemon runtime",
            Self::DaemonEnable => "Enable daemon in config",
            Self::DaemonDisable => "Disable daemon in config",
            Self::Config => "Print effective config values",
        }
    }

    fn to_command(self) -> SpicetifyCommand {
        match self {
            Self::Apply => SpicetifyCommand::Apply,
            Self::Fix => SpicetifyCommand::Fix,
            Self::Dev => SpicetifyCommand::Dev,
            Self::Sync => SpicetifyCommand::Sync,
            Self::UpdateOn => SpicetifyCommand::Update {
                mode: UpdateMode::On,
            },
            Self::UpdateOff => SpicetifyCommand::Update {
                mode: UpdateMode::Off,
            },
            Self::Daemon => SpicetifyCommand::Daemon {
                action: Some(DaemonAction::Start),
            },
            Self::DaemonStop => SpicetifyCommand::Daemon {
                action: Some(DaemonAction::Disable),
            },
            Self::DaemonEnable => SpicetifyCommand::Daemon {
                action: Some(DaemonAction::Enable),
            },
            Self::DaemonDisable => SpicetifyCommand::Daemon {
                action: Some(DaemonAction::Disable),
            },
            Self::Config => SpicetifyCommand::Config,
        }
    }
}

enum UiEvent {
    Key(KeyEvent),
    CommandLog(String),
    CommandFinished { success: bool },
    InputWorkerError,
}

struct TuiApp {
    ctx: AppContext,
    selected: usize,
    recent_logs: VecDeque<String>,
    running: bool,
    exit_armed: bool,
    current_action: Option<MenuAction>,
    last_result_ok: Option<bool>,
    progress_display: f64,
    progress_target: f64,
    link_steps_seen: usize,
    phase_label: String,
    command_started_at: Option<Instant>,
    spinner_index: usize,
    last_spinner_tick: Instant,
    buddy_frame_index: usize,
    last_buddy_tick: Instant,
    daemon_running: bool,
    last_daemon_check: Instant,
    tx: Sender<UiEvent>,
    rx: Receiver<UiEvent>,
}

impl TuiApp {
    fn new(ctx: &AppContext) -> Self {
        let (tx, rx) = mpsc::channel();
        Self {
            ctx: ctx.clone(),
            selected: MenuAction::ALL
                .iter()
                .position(|a| matches!(a, MenuAction::Config))
                .unwrap_or(0),
            recent_logs: VecDeque::new(),
            running: false,
            exit_armed: false,
            current_action: None,
            last_result_ok: None,
            progress_display: 0.0,
            progress_target: 0.0,
            link_steps_seen: 0,
            phase_label: String::from("Pick a command and press Enter"),
            command_started_at: None,
            spinner_index: 0,
            last_spinner_tick: Instant::now(),
            buddy_frame_index: 0,
            last_buddy_tick: Instant::now(),
            daemon_running: false,
            last_daemon_check: Instant::now(),
            tx,
            rx,
        }
    }

    fn run(&mut self, terminal: &mut Terminal<CrosstermBackend<io::Stdout>>) -> Result<()> {
        drain_pending_input()?;
        self.refresh_daemon_status(true);

        let stop_flag = Arc::new(AtomicBool::new(false));
        let input_handle = spawn_input_worker(self.tx.clone(), Arc::clone(&stop_flag));

        let result = self.event_loop(terminal);

        stop_flag.store(true, Ordering::Relaxed);
        let _ = input_handle.join();

        result
    }

    fn event_loop(&mut self, terminal: &mut Terminal<CrosstermBackend<io::Stdout>>) -> Result<()> {
        self.draw(terminal)?;

        loop {
            match self.rx.recv_timeout(FRAME_INTERVAL) {
                Ok(event) => {
                    if self.handle_event(event) {
                        return Ok(());
                    }
                }
                Err(RecvTimeoutError::Timeout) => {}
                Err(RecvTimeoutError::Disconnected) => return Ok(()),
            }

            self.animate();
            self.draw(terminal)?;
        }
    }

    fn handle_event(&mut self, event: UiEvent) -> bool {
        match event {
            UiEvent::Key(key) => self.handle_key(key),
            UiEvent::CommandLog(line) => {
                self.update_progress_from_log(&line);
                self.push_log(line);
                false
            }
            UiEvent::CommandFinished { success } => {
                self.running = false;
                self.last_result_ok = Some(success);
                self.progress_target = if success { 1.0 } else { 0.95 };
                self.phase_label = if success {
                    String::from("Completed successfully")
                } else {
                    String::from("Completed with errors")
                };
                false
            }
            UiEvent::InputWorkerError => true,
        }
    }

    fn handle_key(&mut self, key: KeyEvent) -> bool {
        match key.code {
            KeyCode::Up => {
                if !self.running {
                    self.selected = if self.selected == 0 {
                        MenuAction::ALL.len() - 1
                    } else {
                        self.selected - 1
                    };
                }
                self.exit_armed = false;
                false
            }
            KeyCode::Down => {
                if !self.running {
                    self.selected = (self.selected + 1) % MenuAction::ALL.len();
                }
                self.exit_armed = false;
                false
            }
            KeyCode::Enter => {
                if !self.running {
                    self.start_selected_action();
                }
                self.exit_armed = false;
                false
            }
            KeyCode::Char('c') if key.modifiers.contains(KeyModifiers::CONTROL) => {
                if self.running {
                    self.exit_armed = false;
                    false
                } else if self.exit_armed {
                    true
                } else {
                    self.exit_armed = true;
                    false
                }
            }
            _ => {
                self.exit_armed = false;
                false
            }
        }
    }

    fn start_selected_action(&mut self) {
        let action = MenuAction::ALL[self.selected];

        if matches!(action, MenuAction::Daemon | MenuAction::DaemonStop) {
            self.exit_armed = false;
            self.running = false;
            self.current_action = Some(action);
            self.command_started_at = Some(Instant::now());
            self.spinner_index = 0;
            self.last_spinner_tick = Instant::now();
            self.recent_logs.clear();

            match action {
                MenuAction::Daemon => {
                    self.refresh_daemon_status(true);
                    if self.daemon_running {
                        self.last_result_ok = Some(true);
                        self.progress_display = 1.0;
                        self.progress_target = 1.0;
                        self.phase_label = String::from("Daemon is already active");
                        self.push_log(String::from("INFO Daemon already running"));
                    } else {
                        match launch_daemon_process() {
                            Ok(()) => {
                                self.last_result_ok = Some(true);
                                self.progress_display = 1.0;
                                self.progress_target = 1.0;
                                self.phase_label = String::from("Daemon launched in background");
                                self.push_log(String::from("INFO Started daemon process"));
                                self.refresh_daemon_status(true);
                            }
                            Err(err) => {
                                self.last_result_ok = Some(false);
                                self.progress_display = 0.0;
                                self.progress_target = 0.95;
                                self.phase_label = String::from("Failed to launch daemon");
                                self.push_log(format!("ERROR {err}"));
                            }
                        }
                    }
                }
                MenuAction::DaemonStop => {
                    if !self.daemon_running {
                        self.last_result_ok = Some(true);
                        self.progress_display = 1.0;
                        self.progress_target = 1.0;
                        self.phase_label = String::from("Daemon is already stopped");
                        self.push_log(String::from("INFO Daemon is not running"));
                    } else {
                        match shutdown_daemon_process() {
                            Ok(()) => {
                                if wait_for_daemon_stopped(Duration::from_secs(2)) {
                                    self.last_result_ok = Some(true);
                                    self.progress_display = 1.0;
                                    self.progress_target = 1.0;
                                    self.phase_label = String::from("Daemon stopped");
                                    self.push_log(String::from("INFO Daemon has stopped"));
                                } else {
                                    self.last_result_ok = Some(false);
                                    self.progress_display = 0.0;
                                    self.progress_target = 0.95;
                                    self.phase_label =
                                        String::from("Shutdown sent but daemon still active");
                                    self.push_log(String::from(
                                        "ERROR Daemon did not stop; this may be an older daemon build without shutdown support",
                                    ));
                                }
                                self.refresh_daemon_status(true);
                            }
                            Err(err) => {
                                self.last_result_ok = Some(false);
                                self.progress_display = 0.0;
                                self.progress_target = 0.95;
                                self.phase_label = String::from("Failed to stop daemon");
                                self.push_log(format!("ERROR {err}"));
                            }
                        }
                    }
                }
                _ => {}
            }
            return;
        }

        self.running = true;
        self.exit_armed = false;
        self.current_action = Some(action);
        self.last_result_ok = None;
        self.progress_display = 0.0;
        self.progress_target = 0.07;
        self.link_steps_seen = 0;
        self.phase_label = format!("Starting {}", action.label());
        self.command_started_at = Some(Instant::now());
        self.spinner_index = 0;
        self.last_spinner_tick = Instant::now();
        self.recent_logs.clear();

        let ctx = self.ctx.clone();
        let ui_tx = self.tx.clone();

        thread::spawn(move || {
            let (log_tx, log_rx) = mpsc::channel::<String>();

            let ui_log_tx = ui_tx.clone();
            let log_forwarder = thread::spawn(move || {
                while let Ok(line) = log_rx.recv() {
                    let _ = ui_log_tx.send(UiEvent::CommandLog(line));
                }
            });

            logging::capture_begin_stream(log_tx);
            let success = match dispatcher::dispatch_spicetify(action.to_command(), &ctx) {
                Ok(()) => true,
                Err(err) => {
                    let _ = ui_tx.send(UiEvent::CommandLog(format!("ERROR {err}")));
                    false
                }
            };
            let _ = logging::capture_end();

            let _ = log_forwarder.join();
            let _ = ui_tx.send(UiEvent::CommandFinished { success });
        });
    }

    fn draw(&self, terminal: &mut Terminal<CrosstermBackend<io::Stdout>>) -> Result<()> {
        terminal.draw(|frame| {
            let layout = Layout::default()
                .direction(Direction::Vertical)
                .constraints([
                    Constraint::Length(5),
                    Constraint::Min(10),
                    Constraint::Length(11),
                    Constraint::Length(3),
                ])
                .split(frame.area());

            let (status_text, status_color) = self.status_badge();
            let (daemon_text, daemon_color) = self.daemon_badge();
            let active_command = self
                .current_action
                .map(|a| format!("spicetify {}", a.label()))
                .unwrap_or_else(|| String::from("spicetify <idle>"));
            let buddy_pose = self.buddy_pose();

            let session_block = panel_block("Session");
            let session_inner = session_block.inner(layout[0]);
            frame.render_widget(session_block, layout[0]);

            let session_split = Layout::default()
                .direction(Direction::Horizontal)
                .constraints([Constraint::Min(10), Constraint::Length(12)])
                .split(session_inner);

            let header = Paragraph::new(vec![
                Line::from(vec![
                    Span::styled(
                        " SPICETIFY ",
                        Style::default()
                            .fg(Color::Black)
                            .bg(Color::Rgb(30, 215, 96))
                            .add_modifier(Modifier::BOLD),
                    ),
                    Span::raw("  Spotify Customization Console  "),
                    Span::styled(
                        format!(" {} ", status_text),
                        Style::default()
                            .fg(Color::Black)
                            .bg(status_color)
                            .add_modifier(Modifier::BOLD),
                    ),
                    Span::raw("  "),
                    Span::styled(
                        format!(" daemon {} ", daemon_text),
                        Style::default()
                            .fg(Color::Black)
                            .bg(daemon_color)
                            .add_modifier(Modifier::BOLD),
                    ),
                ]),
                Line::from(vec![
                    Span::styled(" Command: ", Style::default().add_modifier(Modifier::BOLD)),
                    Span::raw(active_command),
                ]),
                Line::from(vec![
                    Span::styled(" Phase: ", Style::default().add_modifier(Modifier::BOLD)),
                    Span::raw(self.phase_label.clone()),
                ]),
            ]);
            frame.render_widget(header, session_split[0]);

            let clawd = Paragraph::new(vec![
                Line::from(format!(" {}", buddy_pose[0])),
                Line::from(format!(" {}", buddy_pose[1])),
                Line::from(format!(" {}", buddy_pose[2])),
            ]);
            frame.render_widget(clawd, session_split[1]);

            let main = Layout::default()
                .direction(Direction::Horizontal)
                .constraints([Constraint::Percentage(44), Constraint::Percentage(56)])
                .split(layout[1]);

            let items = MenuAction::ALL
                .iter()
                .map(|a| ListItem::new(Line::from(format!("{:<14} {}", a.label(), a.summary()))))
                .collect::<Vec<_>>();

            let list = List::new(items)
                .block(panel_block("Actions"))
                .highlight_symbol("> ")
                .highlight_style(
                    Style::default()
                        .fg(Color::Black)
                        .bg(Color::Rgb(30, 215, 96))
                        .add_modifier(Modifier::BOLD),
                );

            let mut list_state = ListState::default();
            list_state.select(Some(self.selected));
            frame.render_stateful_widget(list, main[0], &mut list_state);

            let side = Layout::default()
                .direction(Direction::Vertical)
                .constraints([
                    Constraint::Length(4),
                    Constraint::Length(5),
                    Constraint::Min(3),
                ])
                .split(main[1]);

            let selected_action = MenuAction::ALL[self.selected];
            let selected = Paragraph::new(vec![
                Line::from(Span::styled(
                    selected_action.label(),
                    Style::default()
                        .fg(Color::Rgb(30, 215, 96))
                        .add_modifier(Modifier::BOLD),
                )),
                Line::from(selected_action.summary()),
            ])
            .block(panel_block("Selected Action"))
            .wrap(Wrap { trim: true });
            frame.render_widget(selected, side[0]);

            let pct = (self.progress_display * 100.0).round() as u16;
            let spinner = SPINNER_FRAMES[self.spinner_index];
            let content_width = usize::from(side[1].width.saturating_sub(4));
            let meter_width = content_width.saturating_sub(2).clamp(1, 40);
            let filled = ((self.progress_display.clamp(0.0, 1.0) * meter_width as f64).round()
                as usize)
                .min(meter_width);
            let meter = format!(
                "[{}{}]",
                "=".repeat(filled),
                ".".repeat(meter_width.saturating_sub(filled))
            );
            let meter_status = if self.running {
                format!("{} {}% complete", spinner, pct)
            } else if self.last_result_ok == Some(true) {
                format!("done {}%", pct)
            } else if self.last_result_ok == Some(false) {
                format!("stopped {}%", pct)
            } else {
                format!("ready {}%", pct)
            };
            let progress = Paragraph::new(vec![
                Line::from(Span::styled(
                    "Spicetify pipeline",
                    Style::default()
                        .fg(Color::Rgb(30, 215, 96))
                        .add_modifier(Modifier::BOLD),
                )),
                Line::from(meter_status),
                Line::from(meter),
            ])
            .block(panel_block("Progress Meter"))
            .wrap(Wrap { trim: true });
            frame.render_widget(progress, side[1]);

            let runtime = self
                .command_started_at
                .map(|start| format!("{:.1}s", start.elapsed().as_secs_f64()))
                .unwrap_or_else(|| String::from("-"));
            let active = self.current_action.map(|a| a.label()).unwrap_or("none");
            let result = match self.last_result_ok {
                Some(true) => "ok",
                Some(false) => "error",
                None => "-",
            };
            let daemon = if self.daemon_running {
                "running"
            } else {
                "stopped"
            };
            let status = Paragraph::new(vec![
                Line::from(format!("active: {active}")),
                Line::from(format!("runtime: {runtime}")),
                Line::from(format!("logs: {}", self.recent_logs.len())),
                Line::from(format!("last result: {result}")),
                Line::from(format!("daemon: {daemon}")),
            ])
            .block(panel_block("Run Stats"));
            frame.render_widget(status, side[2]);

            let mut lines: Vec<Line<'static>> = Vec::new();
            let tail_len = self.recent_logs.len().min(LAST_RUN_VISIBLE_LINES);
            let skip = self.recent_logs.len().saturating_sub(tail_len);
            for line in self.recent_logs.iter().skip(skip) {
                let style = if line.starts_with("ERROR") || line.starts_with("FATAL") {
                    Style::default().fg(Color::Rgb(248, 113, 113))
                } else if line.starts_with("WARN") {
                    Style::default().fg(Color::Rgb(250, 204, 21))
                } else if line.starts_with("INFO") {
                    Style::default().fg(Color::Rgb(125, 211, 252))
                } else {
                    Style::default().fg(Color::White)
                };
                lines.push(Line::from(Span::styled(line.clone(), style)));
            }

            let logs = Paragraph::new(lines)
                .style(Style::default())
                .block(panel_block("Run Log"))
                .wrap(Wrap { trim: true });
            frame.render_widget(logs, layout[2]);

            let footer = Paragraph::new(if self.exit_armed {
                "Press Ctrl+C again to quit"
            } else {
                "Up/Down: navigate    Enter: run    Ctrl+C twice: quit"
            })
            .style(Style::default().fg(Color::DarkGray))
            .block(panel_block("Keys"));
            frame.render_widget(footer, layout[3]);
        })?;

        Ok(())
    }

    fn animate(&mut self) {
        self.refresh_daemon_status(false);

        if self.last_buddy_tick.elapsed() >= BUDDY_TICK_INTERVAL {
            self.buddy_frame_index = (self.buddy_frame_index + 1) % BUDDY_POSES.len();
            self.last_buddy_tick = Instant::now();
        }

        if self.running {
            if self.last_spinner_tick.elapsed() >= SPINNER_INTERVAL {
                self.spinner_index = (self.spinner_index + 1) % SPINNER_FRAMES.len();
                self.last_spinner_tick = Instant::now();
            }

            if let Some(start) = self.command_started_at {
                let drift = (0.08 + start.elapsed().as_secs_f64() * 0.04).min(0.88);
                self.progress_target = self.progress_target.max(drift);
            }
        }

        if self.progress_target > self.progress_display {
            let delta = self.progress_target - self.progress_display;
            let step = (delta * 0.22).max(0.004);
            self.progress_display = (self.progress_display + step).min(self.progress_target);
        }

        self.progress_display = self.progress_display.clamp(0.0, 1.0);
    }

    fn update_progress_from_log(&mut self, line: &str) {
        let lower = line.to_ascii_lowercase();

        if lower.starts_with("error") || lower.starts_with("fatal") {
            self.phase_label = String::from("Error reported; inspect run log");
            self.progress_target = self.progress_target.max(0.85);
            return;
        }

        self.phase_label = line
            .trim_start_matches("INFO ")
            .trim_start_matches("WARN ")
            .trim_start_matches("ERROR ")
            .chars()
            .take(72)
            .collect();

        match self.current_action {
            Some(MenuAction::Apply) => {
                if lower.contains("extracting ") && lower.contains("xpui.spa") {
                    self.progress_target = self.progress_target.max(0.22);
                } else if lower.contains("extracting xpui-modules") {
                    self.progress_target = self.progress_target.max(0.44);
                } else if lower.contains("patching xpui/index.html") {
                    self.progress_target = self.progress_target.max(0.62);
                } else if lower.contains("linking ") {
                    self.link_steps_seen = (self.link_steps_seen + 1).min(3);
                    let link_progress = 0.68 + (self.link_steps_seen as f64 * 0.08);
                    self.progress_target = self.progress_target.max(link_progress);
                } else if lower.contains("patched spotify") {
                    self.progress_target = self.progress_target.max(0.96);
                }
            }
            Some(_) => {
                if lower.starts_with("info") {
                    self.progress_target = (self.progress_target + 0.16).min(0.9);
                } else if lower.starts_with("warn") {
                    self.progress_target = (self.progress_target + 0.1).min(0.88);
                }
            }
            None => {}
        }
    }

    fn status_badge(&self) -> (&'static str, Color) {
        if self.running {
            ("RUNNING", Color::Yellow)
        } else {
            match self.last_result_ok {
                Some(true) => ("DONE", Color::Green),
                Some(false) => ("FAILED", Color::Red),
                None => ("IDLE", Color::DarkGray),
            }
        }
    }

    fn daemon_badge(&self) -> (&'static str, Color) {
        if self.daemon_running {
            ("ACTIVE", Color::Green)
        } else {
            ("OFF", Color::DarkGray)
        }
    }

    fn buddy_pose(&self) -> [&'static str; 3] {
        BUDDY_POSES[self.buddy_frame_index]
    }

    fn push_log(&mut self, line: String) {
        if self.recent_logs.len() >= MAX_LOG_LINES {
            let _ = self.recent_logs.pop_front();
        }
        self.recent_logs.push_back(line);
    }

    fn refresh_daemon_status(&mut self, force: bool) {
        if !force && self.last_daemon_check.elapsed() < DAEMON_STATUS_CHECK_INTERVAL {
            return;
        }

        self.daemon_running = is_daemon_running();
        self.last_daemon_check = Instant::now();
    }
}

pub fn run(ctx: &AppContext) -> Result<()> {
    let mut terminal = setup_terminal()?;
    let mut app = TuiApp::new(ctx);
    let result = app.run(&mut terminal);
    restore_terminal(&mut terminal)?;
    result
}

fn setup_terminal() -> Result<Terminal<CrosstermBackend<io::Stdout>>> {
    enable_raw_mode()?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen)?;
    let backend = CrosstermBackend::new(stdout);
    let terminal = Terminal::new(backend)?;
    Ok(terminal)
}

fn restore_terminal(terminal: &mut Terminal<CrosstermBackend<io::Stdout>>) -> Result<()> {
    disable_raw_mode()?;
    execute!(terminal.backend_mut(), LeaveAlternateScreen)?;
    terminal.show_cursor()?;
    Ok(())
}

fn spawn_input_worker(tx: Sender<UiEvent>, stop_flag: Arc<AtomicBool>) -> thread::JoinHandle<()> {
    thread::spawn(move || {
        loop {
            if stop_flag.load(Ordering::Relaxed) {
                break;
            }

            match event::poll(INPUT_POLL_INTERVAL) {
                Ok(true) => match event::read() {
                    Ok(Event::Key(key)) if key.kind == KeyEventKind::Press => {
                        let _ = tx.send(UiEvent::Key(key));
                    }
                    Ok(_) => {}
                    Err(_) => {
                        let _ = tx.send(UiEvent::InputWorkerError);
                        break;
                    }
                },
                Ok(false) => {}
                Err(_) => {
                    let _ = tx.send(UiEvent::InputWorkerError);
                    break;
                }
            }
        }
    })
}

fn drain_pending_input() -> Result<()> {
    while event::poll(Duration::from_millis(0))? {
        let _ = event::read()?;
    }
    Ok(())
}

fn launch_daemon_process() -> Result<()> {
    let exe = std::env::current_exe().context("unable to resolve current executable")?;
    Command::new(exe)
        .arg("daemon")
        .arg("start")
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .context("failed to spawn daemon process")?;
    Ok(())
}

fn shutdown_daemon_process() -> Result<()> {
    let client = reqwest::blocking::Client::builder()
        .timeout(DAEMON_CONNECT_TIMEOUT)
        .build()
        .context("failed to build shutdown client")?;

    let mut seen_endpoint = false;

    for addr in daemon_addresses() {
        let host = if addr.is_ipv6() {
            format!("[{}]", addr.ip())
        } else {
            addr.ip().to_string()
        };
        let url = format!("http://{host}:{}/shutdown", addr.port());

        if let Ok(response) = client.post(&url).send() {
            let status = response.status();
            if status.is_success() {
                return Ok(());
            }
            if status == reqwest::StatusCode::NOT_FOUND
                || status == reqwest::StatusCode::METHOD_NOT_ALLOWED
            {
                seen_endpoint = true;
            }
        }
    }

    if seen_endpoint {
        Err(anyhow!("daemon does not support remote shutdown"))
    } else {
        Err(anyhow!("daemon is not running"))
    }
}

fn wait_for_daemon_stopped(timeout: Duration) -> bool {
    let start = Instant::now();
    while start.elapsed() < timeout {
        if !is_daemon_running() {
            return true;
        }
        thread::sleep(Duration::from_millis(120));
    }
    !is_daemon_running()
}

fn is_daemon_running() -> bool {
    daemon_addresses()
        .iter()
        .any(|addr| TcpStream::connect_timeout(addr, DAEMON_CONNECT_TIMEOUT).is_ok())
}

fn daemon_addresses() -> Vec<SocketAddr> {
    match DAEMON_ADDR.to_socket_addrs() {
        Ok(addrs) => addrs.collect(),
        Err(_) => Vec::new(),
    }
}

fn panel_block<'a>(title: &'a str) -> Block<'a> {
    Block::default()
        .borders(Borders::ALL)
        .border_type(BorderType::Rounded)
        .border_style(Style::default().fg(Color::Rgb(75, 85, 99)))
        .title(title)
        .title_style(Style::default().fg(Color::Rgb(156, 163, 175)))
}
