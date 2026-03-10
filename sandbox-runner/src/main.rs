use axum::{
    extract::ConnectInfo,
    extract::State,
    http::HeaderMap,
    http::StatusCode,
    routing::post,
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

const OUTPUT_LIMIT: usize = 8192;
const RATE_LIMIT_WINDOW_SECS: u64 = 60;

#[derive(Clone)]
struct AppState {
    semaphore: Arc<Semaphore>,
    rate_limit: Arc<Mutex<HashMap<String, VecDeque<Instant>>>>,
    compile_timeout_ms: u64,
    run_timeout_ms: u64,
    rate_limit_per_min: usize,
}

#[derive(Deserialize)]
struct RunRequest {
    code: String,
}

#[derive(Serialize)]
struct RunResponse {
    stdout: String,
    stderr: String,
    exit_code: i32,
    duration_ms: u128,
}

#[tokio::main]
async fn main() {
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
        .route("/run", post(run_code))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    println!("sandbox-runner listening on http://{}", addr);
    axum::serve(listener, app.into_make_service_with_connect_info::<std::net::SocketAddr>())
        .await
        .unwrap();
}

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

    let client_id = client_id_from_request(addr, &headers);
    if !check_rate_limit(&state, &client_id).await {
        return Err((StatusCode::TOO_MANY_REQUESTS, "Rate limit exceeded.".to_string()));
    }

    let permit = match state.semaphore.clone().try_acquire_owned() {
        Ok(permit) => permit,
        Err(_) => {
            return Err((StatusCode::TOO_MANY_REQUESTS, "Runner busy.".to_string()));
        }
    };

    let dir = tempdir().map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Tempdir failed".to_string()))?;
    let source_path = dir.path().join("main.rs");
    let binary_path = dir.path().join("main");

    tokio::fs::write(&source_path, code)
        .await
        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Write failed".to_string()))?;

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

    if compile_output.exit_code != 0 {
        return Ok(Json(RunResponse {
            stdout: compile_output.stdout,
            stderr: compile_output.stderr,
            exit_code: compile_output.exit_code,
            duration_ms: start.elapsed().as_millis(),
        }));
    }

    let run_output = run_command(binary_path.to_string_lossy().to_string(), vec![], state.run_timeout_ms).await;

    drop(permit);

    Ok(Json(RunResponse {
        stdout: run_output.stdout,
        stderr: run_output.stderr,
        exit_code: run_output.exit_code,
        duration_ms: start.elapsed().as_millis(),
    }))
}

struct CommandOutput {
    stdout: String,
    stderr: String,
    exit_code: i32,
}

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

async fn check_rate_limit(state: &AppState, key: &str) -> bool {
    let mut guard = state.rate_limit.lock().await;
    let now = Instant::now();
    let window = Duration::from_secs(RATE_LIMIT_WINDOW_SECS);
    let entry = guard.entry(key.to_string()).or_insert_with(VecDeque::new);
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
