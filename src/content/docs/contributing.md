---
title: Contributing
description: How to contribute to Rust with TypeScript — fix errors, add chapters, translate content
---

Contributions of all kinds are welcome — from fixing a typo to writing a whole new chapter.

## Ways to Contribute

| Type | Description |
|:-----|:------------|
| **Fix an error** | Incorrect explanation, broken code, outdated content |
| **Improve content** | Clearer wording, better examples |
| **Add a chapter** | Propose and write a new topic |
| **Translate** | English ↔ Korean, or help add a new language |
| **Report a bug** | Broken UI, code runner issues, broken links |

## Getting Started

```bash
git clone https://github.com/qtaghdi/rust-with-typescript.git
cd rust-with-typescript
bun install
bun run dev   # → http://localhost:4321
```

## Content Structure

Chapters live in `src/content/docs/`:

```
src/content/docs/
├── ch0-intro.md          ← English
├── ch1-mental-model.md
├── ...
└── ko/
    ├── ch0-intro.md      ← Korean
    ├── ch1-mental-model.md
    └── ...
```

**Keep both languages in sync.** When you edit an English chapter, update the Korean version too (or note it in your PR).

## Editing a Chapter

1. Open the file in `src/content/docs/` (English) or `src/content/docs/ko/` (Korean)
2. Edit the Markdown
3. Run `bun run dev` to preview
4. Open a PR

## Adding a New Chapter

1. Create `src/content/docs/ch{N}-topic.md` and `src/content/docs/ko/ch{N}-topic.md`
2. Add it to `sidebar` in `astro.config.mjs` with both `label` and `translations.ko`
3. Follow existing chapter structure:
   - Frontmatter: `title`, `description`
   - TypeScript ↔ Rust side-by-side comparisons
   - Summary section at the end
   - Glossary links for key terms

## Runnable Code Blocks

Add the `runnable` flag to make a Rust block executable in the browser:

````markdown
```rust runnable
fn main() {
    println!("Hello!");
}
```
````

After adding runnable blocks, regenerate the hash file:

```bash
node scripts/generate-hashes.mjs
```

`bun run build` does this automatically. For local dev you need to run it manually once.

## Commit Style

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
fix: correct borrow checker example in ch3
feat: add chapter on error handling patterns
docs: improve lifetime syntax explanation
```

## Opening an Issue

Use one of the issue templates on GitHub:
- **Content Error** — incorrect explanation, broken code
- **New Chapter Proposal** — suggest a topic
- **Bug Report** — site/UI issues

[Open an issue →](https://github.com/qtaghdi/rust-with-typescript/issues/new/choose)
