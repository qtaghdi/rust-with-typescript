# Rust with TypeScript

> A practical Rust guide written for TypeScript developers — side-by-side code comparisons, runnable examples, and no C/C++ background required.

**Live site:** [qtaghdi.com](https://qtaghdi.com) · [한국어](https://qtaghdi.com/ko/)

---

## What this is

Most Rust learning resources assume a systems programming background. This guide takes a different approach: every concept is explained through the lens of TypeScript.

- **Side-by-side code**: TypeScript and Rust examples shown together
- **Runnable code**: Execute Rust snippets directly in the browser
- **Bilingual**: English and Korean
- **14 chapters** covering syntax, ownership, traits, concurrency, and more

## Project Structure

```
src/
├── content/docs/          # Documentation (Markdown/MDX)
│   ├── *.md               # English chapters
│   └── ko/                # Korean chapters
├── expressive-code/       # Custom plugin for runnable code blocks
├── lib/                   # Utilities + generated hash file
├── pages/api/run-rust.ts  # API endpoint for code execution
└── styles/custom.css      # Theme customization

sandbox-runner/            # Rust axum server (code execution backend)
scripts/                   # Build-time scripts
```

## Local Development

```bash
bun install
bun run dev        # → http://localhost:4321
```

```bash
bun run build      # Generates code hashes + builds
bun run preview    # Preview production build
```

## Commands

| Command | Action |
|:--------|:-------|
| `bun run dev` | Start local dev server at `localhost:4321` |
| `bun run build` | Generate hashes + production build → `./dist/` |
| `bun run preview` | Preview the production build locally |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to add chapters, fix errors, or translate content.

## Tech Stack

| Layer | Tech |
|:------|:-----|
| Framework | [Astro](https://astro.build) + [Starlight](https://starlight.astro.build) |
| Deployment | [Cloudflare Workers](https://workers.cloudflare.com) |
| Code runner | Rust + [Axum](https://github.com/tokio-rs/axum) on [Fly.io](https://fly.io) |
| i18n | Starlight built-in + `Accept-Language` middleware |

## License

MIT
