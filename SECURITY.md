# Security Policy

## Scope

This policy covers the **Rust with TypeScript** documentation site and its
associated infrastructure:

| Component | In Scope |
|-----------|----------|
| Astro/Starlight site (`/`) | ✅ |
| `/api/run-rust` code execution endpoint | ✅ **High priority** |
| Sandbox runner (Fly.io) | ✅ |
| Static assets | ✅ |
| Third-party dependencies | ⚠️ Report upstream |

The `/api/run-rust` endpoint executes Rust code in an isolated sandbox and is
the most security-sensitive part of this project. Reports related to sandbox
escapes, allowlist bypasses, or denial-of-service via code execution are
especially welcome.

## Reporting a Vulnerability

**Please do not open a public GitHub Issue for security vulnerabilities.**

Instead, report privately via one of these channels:

1. **GitHub Private Vulnerability Reporting** (preferred)
   Navigate to the [Security tab](https://github.com/qtaghdi/rust-with-typescript/security)
   and click **"Report a vulnerability"**.

2. **Direct contact**
   Reach out to [@qtaghdi](https://github.com/qtaghdi) via GitHub.

### What to include

- A clear description of the vulnerability
- Steps to reproduce (proof-of-concept if possible)
- Potential impact assessment
- Any suggested fix (optional but appreciated)

## Response Timeline

| Stage | Target |
|-------|--------|
| Acknowledgement | Within 48 hours |
| Initial assessment | Within 5 business days |
| Fix or mitigation | Depends on severity |
| Public disclosure | After fix is deployed |

## Supported Versions

This project follows a rolling release model — only the latest version
deployed at `rust-with-typescript.pages.dev` is actively maintained.

## Known Limitations of the Sandbox

The code execution sandbox is designed to be isolated but has the following
intentional constraints worth noting:

- Only Rust code blocks that appear in the documentation (verified via
  SHA-256 allowlist) can be submitted to `/api/run-rust`
- Execution is time-limited and resource-capped on the Fly.io runner
- Network access is disabled inside the sandbox

If you find a way to bypass any of these controls, please report it.
