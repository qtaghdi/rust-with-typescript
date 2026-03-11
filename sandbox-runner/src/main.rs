//! # sandbox-runner
//!
//! A minimal Axum HTTP server that compiles and runs Rust code snippets
//! submitted from the documentation site.
//!
//! ## Endpoints
//! - `GET  /health` — liveness probe (used for warm-up pings from the frontend)
//! - `POST /run`    — compile and execute a Rust snippet; returns stdout/stderr/exit code
//!
//! ## Security layers
//! - **Allowlist** (upstream): the Astro API route only forwards code that was
//!   present in the documentation at build time (SHA-256 hash check).
//! - **Concurrency limit**: a `Semaphore` caps simultaneous compilations.
//! - **Rate limit**: per-IP sliding-window counter (default 5 req/min).
//! - **Timeouts**: separate compile and run timeouts kill hung processes.
//! - **Temp dir isolation**: each run gets its own `tempdir`; cleaned up on drop.
//!
//! ## Configuration (environment variables)
//! | Variable                    | Default       | Description                        |
//! |-----------------------------|---------------|------------------------------------|
//! | `RUNNER_HOST`               | `127.0.0.1`   | Bind address                       |
//! | `RUNNER_PORT`               | `4100`        | Bind port                          |
//! | `RUNNER_MAX_CONCURRENCY`    | `2`           | Max simultaneous compilations      |
//! | `RUNNER_RATE_LIMIT_PER_MIN` | `5`           | Max requests per IP per minute     |
//! | `RUNNER_COMPILE_TIMEOUT_MS` | `2000`        | `rustc` timeout in milliseconds    |
//! | `RUNNER_RUN_TIMEOUT_MS`     | `2000`        | Binary execution timeout in ms     |

use axum::{
    extract::ConnectInfo,
    extract::State,
    http::HeaderMap,
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::{
    collections::{HashMap, VecDeque},
    env,
    process::Stdio,
    sync::Arc,
    time::{Duration, Instant},
};
use tempfile::tempdir;
use tokio::{
    process::Command,
    sync::{Mutex, Semaphore},
    time::timeout,
};

/// Maximum bytes of stdout/stderr captured from a single run.
/// Matches the client-side `OUTPUT_LIMIT` in `public/runnable-code.js`.
const OUTPUT_LIMIT: usize = 8192;

/// Sliding-window duration for per-IP rate limiting.
const RATE_LIMIT_WINDOW_SECS: u64 = 60;

/// Shared state injected into Axum route handlers via `State<AppState>`.
#[derive(Clone)]
struct AppState {
    /// Limits the number of concurrent `rustc` invocations.
    semaphore: Arc<Semaphore>,
    /// Per-IP request timestamps for the sliding-window rate limiter.
    rate_limit: Arc<Mutex<HashMap<String, VecDeque<Instant>>>>,
    /// Milliseconds before `rustc` is killed.
    compile_timeout_ms: u64,
    /// Milliseconds before the compiled binary is killed.
    run_timeout_ms: u64,
    /// Maximum requests allowed per IP within `RATE_LIMIT_WINDOW_SECS`.
    rate_limit_per_min: usize,
}

/// POST /run request body.
#[derive(Deserialize)]
struct RunRequest {
    code: String,
}

/// POST /run response body.
#[derive(Serialize)]
struct RunResponse {
    stdout: String,
    stderr: String,
    exit_code: i32,
    duration_ms: u128,
}

#[tokio::main]
async fn main() {
    // Read configuration from environment with sane defaults
    let host = env::var("RUNNER_HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = env::var("RUNNER_PORT").unwrap_or_else(|_| "4100".to_string());
    let addr = format!("{}:{}", host, port);
    let max_concurrency: usize = env::var("RUNNER_MAX_CONCURRENCY")
        .ok()
        .and_then(|value| value.parse().ok())
        .unwrap_or(2);
    let rate_limit_per_min: usize = env::var("RUNNER_RATE_LIMIT_PER_MIN")
        .ok()
        .and_then(|value| value.parse().ok())
        .unwrap_or(5);
    let compile_timeout_ms: u64 = env::var("RUNNER_COMPILE_TIMEOUT_MS")
        .ok()
        .and_then(|value| value.parse().ok())
        .unwrap_or(2000);
    let run_timeout_ms: u64 = env::var("RUNNER_RUN_TIMEOUT_MS")
        .ok()
        .and_then(|value| value.parse().ok())
        .unwrap_or(2000);

    let state = AppState {
        semaphore: Arc::new(Semaphore::new(max_concurrency)),
        rate_limit: Arc::new(Mutex::new(HashMap::new())),
        compile_timeout_ms,
        run_timeout_ms,
        rate_limit_per_min,
    };

    let app = Router::new()
        .route("/health", get(health))
        .route("/run", post(run_code))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    println!("sandbox-runner listening on http://{}", addr);
    axum::serve(listener, app.into_make_service_with_connect_info::<std::net::SocketAddr>())
        .await
        .unwrap();
}

/// `GET /health` — liveness probe.
/// Returns 200 OK. Used by the frontend to wake the Fly.io machine before the
/// user clicks Run (see `warmUpRunner()` in `public/runnable-code.js`).
async fn health() -> StatusCode {
    StatusCode::OK
}

/// `POST /run` — compile and execute a Rust snippet.
///
/// Steps:
/// 1. Validate the request body.
/// 2. Check the per-IP rate limit.
/// 3. Acquire a concurrency permit (rejects with 429 if all slots are busy).
/// 4. Write the code to a temp file and invoke `rustc`.
/// 5. If compilation succeeds, run the resulting binary.
/// 6. Return combined stdout/stderr/exit_code/duration to the caller.
async fn run_code(
    State(state): State<AppState>,
    ConnectInfo(addr): ConnectInfo<std::net::SocketAddr>,
    headers: HeaderMap,
    Json(payload): Json<RunRequest>,
) -> Result<Json<RunResponse>, (StatusCode, String)> {
    let start = Instant::now();
    let code = payload.code.trim();
    if code.is_empty() {
        return Err((StatusCode::BAD_REQUEST, "Code is required.".to_string()));
    }

    // Rate-limit check: rejects if the IP has exceeded the per-minute quota
    let client_id = client_id_from_request(addr, &headers);
    if !check_rate_limit(&state, &client_id).await {
        return Err((StatusCode::TOO_MANY_REQUESTS, "Rate limit exceeded.".to_string()));
    }

    // Concurrency limit: non-blocking try_acquire so we immediately 429 if busy
    let permit = match state.semaphore.clone().try_acquire_owned() {
        Ok(permit) => permit,
        Err(_) => {
            return Err((StatusCode::TOO_MANY_REQUESTS, "Runner busy.".to_string()));
        }
    };

    // Each run gets its own temp directory; automatically cleaned up on drop
    let dir = tempdir().map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Tempdir failed".to_string()))?;
    let source_path = dir.path().join("main.rs");
    let binary_path = dir.path().join("main");

    tokio::fs::write(&source_path, code)
        .await
        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Write failed".to_string()))?;

    // Step 1: compile
    let compile_output = run_command(
        "rustc".to_string(),
        vec![
            source_path.to_string_lossy().to_string(),
            "--edition=2021".to_string(),
            "-o".to_string(),
            binary_path.to_string_lossy().to_string(),
        ],
        state.compile_timeout_ms,
    )
    .await;

    // Return compiler errors to the user without running the binary
    if compile_output.exit_code != 0 {
        return Ok(Json(RunResponse {
            stdout: compile_output.stdout,
            stderr: compile_output.stderr,
            exit_code: compile_output.exit_code,
            duration_ms: start.elapsed().as_millis(),
        }));
    }

    // Step 2: run the compiled binary
    let run_output = run_command(binary_path.to_string_lossy().to_string(), vec![], state.run_timeout_ms).await;

    // Release the concurrency permit before returning
    drop(permit);

    Ok(Json(RunResponse {
        stdout: run_output.stdout,
        stderr: run_output.stderr,
        exit_code: run_output.exit_code,
        duration_ms: start.elapsed().as_millis(),
    }))
}

/// Raw output captured from a child process.
struct CommandOutput {
    stdout: String,
    stderr: String,
    exit_code: i32,
}

/// Spawn `command` with `args`, capture its output, and enforce `timeout_ms`.
/// Returns exit code 124 (matching the POSIX `timeout` utility) on timeout.
async fn run_command(command: String, args: Vec<String>, timeout_ms: u64) -> CommandOutput {
    let mut cmd = Command::new(command);
    cmd.args(args)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let output = match timeout(Duration::from_millis(timeout_ms), cmd.output()).await {
        Ok(Ok(output)) => output,
        Ok(Err(err)) => {
            return CommandOutput {
                stdout: "".to_string(),
                stderr: err.to_string(),
                exit_code: 1,
            };
        }
        Err(_) => {
            // Timed out — exit code 124 matches the POSIX `timeout` utility
            return CommandOutput {
                stdout: "".to_string(),
                stderr: "Timed out".to_string(),
                exit_code: 124,
            };
        }
    };

    CommandOutput {
        stdout: limit_output(String::from_utf8_lossy(&output.stdout).to_string()),
        stderr: limit_output(String::from_utf8_lossy(&output.stderr).to_string()),
        exit_code: output.status.code().unwrap_or(1),
    }
}

/// Truncate `text` to at most `OUTPUT_LIMIT` bytes (on a character boundary)
/// and append a truncation notice if trimmed.
fn limit_output(text: String) -> String {
    if text.len() <= OUTPUT_LIMIT {
        return text;
    }
    let mut end = 0;
    for (idx, ch) in text.char_indices() {
        let next = idx + ch.len_utf8();
        if next > OUTPUT_LIMIT {
            break;
        }
        end = next;
    }
    let mut truncated = text[..end].to_string();
    truncated.push_str("\n...output truncated");
    truncated
}

/// Determine a stable client identifier for rate limiting.
///
/// Prefers the first IP in the `X-Forwarded-For` header (set by Fly.io's proxy)
/// so that the real client IP is used rather than the proxy's address.
/// Falls back to the TCP connection's remote IP.
fn client_id_from_request(addr: std::net::SocketAddr, headers: &HeaderMap) -> String {
    if let Some(value) = headers.get("x-forwarded-for") {
        if let Ok(text) = value.to_str() {
            if let Some(first) = text.split(',').next() {
                let trimmed = first.trim();
                if !trimmed.is_empty() {
                    return trimmed.to_string();
                }
            }
        }
    }
    addr.ip().to_string()
}

/// Sliding-window rate limiter.
///
/// Removes timestamps older than `RATE_LIMIT_WINDOW_SECS` from the deque,
/// then checks whether the remaining count is within `rate_limit_per_min`.
/// Records the current timestamp and returns `true` if the request is allowed.
async fn check_rate_limit(state: &AppState, key: &str) -> bool {
    let mut guard = state.rate_limit.lock().await;
    let now = Instant::now();
    let window = Duration::from_secs(RATE_LIMIT_WINDOW_SECS);
    let entry = guard.entry(key.to_string()).or_insert_with(VecDeque::new);
    // Evict timestamps that have fallen outside the sliding window
    while let Some(front) = entry.front() {
        if now.duration_since(*front) > window {
            entry.pop_front();
        } else {
            break;
        }
    }
    if entry.len() >= state.rate_limit_per_min {
        return false;
    }
    entry.push_back(now);
    true
}
