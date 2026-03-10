use axum::{
    http::StatusCode,
    routing::post,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::{
    env,
    process::Stdio,
    time::{Duration, Instant},
};
use tempfile::tempdir;
use tokio::{
    process::Command,
    time::timeout,
};

const COMPILE_TIMEOUT_MS: u64 = 2000;
const RUN_TIMEOUT_MS: u64 = 2000;
const OUTPUT_LIMIT: usize = 8192;

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

    let app = Router::new().route("/run", post(run_code));

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    println!("sandbox-runner listening on http://{}", addr);
    axum::serve(listener, app).await.unwrap();
}

async fn run_code(Json(payload): Json<RunRequest>) -> Result<Json<RunResponse>, (StatusCode, String)> {
    let start = Instant::now();
    let code = payload.code.trim();
    if code.is_empty() {
        return Err((StatusCode::BAD_REQUEST, "Code is required.".to_string()));
    }

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
        COMPILE_TIMEOUT_MS,
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

    let run_output = run_command(binary_path.to_string_lossy().to_string(), vec![], RUN_TIMEOUT_MS).await;

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
