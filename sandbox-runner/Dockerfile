FROM rust:1.85 AS builder
WORKDIR /app
COPY Cargo.toml Cargo.lock* ./
COPY src ./src
RUN cargo build --release

FROM rust:1.85-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/sandbox-runner /usr/local/bin/sandbox-runner

ENV RUNNER_HOST=0.0.0.0
ENV RUNNER_PORT=4100
EXPOSE 4100

CMD ["sandbox-runner"]
