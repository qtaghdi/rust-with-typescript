# Contributing

Thank you for your interest in contributing! Here's how to get involved.

## Ways to Contribute

- **Fix errors** — typos, incorrect code, outdated explanations
- **Improve content** — clearer wording, better examples
- **Add a chapter** — propose and write a new topic
- **Translate** — English ↔ Korean, or add a new language
- **Report issues** — broken code examples, missing sections

---

## Getting Started

```bash
git clone https://github.com/qtaghdi/rust-with-typescript.git
cd rust-with-typescript
npm install
npm run dev
```

The dev server starts at `http://localhost:4321`.

---

## Content Structure

```
src/content/docs/
├── *.md          # English chapters  (e.g. ch0-intro.md)
└── ko/           # Korean chapters   (e.g. ko/ch0-intro.md)
```

**Both languages should stay in sync.** When you edit an English chapter, update the Korean counterpart too (or note in your PR that the other language needs updating).

---

## Editing an Existing Chapter

1. Find the file in `src/content/docs/` (English) or `src/content/docs/ko/` (Korean)
2. Edit the Markdown
3. Run `npm run dev` and verify the page looks correct
4. Open a PR with a brief description of what changed and why

---

## Adding a New Chapter

1. Create the file: `src/content/docs/ch{N}-topic.md`
2. Add the Korean version: `src/content/docs/ko/ch{N}-topic.md`
3. Register it in `astro.config.mjs` under `sidebar` with both `label` and `translations.ko`
4. Follow the existing chapter structure:
   - Frontmatter: `title`, `description`
   - Side-by-side TypeScript ↔ Rust comparisons
   - Summary section at the end
   - Link key terms to `/glossary/`

### Runnable Code Blocks

To make a Rust code block executable in the browser, add the `runnable` meta flag:

````markdown
```rust runnable
fn main() {
    println!("Hello!");
}
```
````

After adding runnable blocks, the build script (`scripts/generate-hashes.mjs`) must be run before serving. `npm run build` does this automatically. For local dev, run:

```bash
node scripts/generate-hashes.mjs
```

---

## Adding a Translation

### Translating to Korean

1. Copy the English file from `src/content/docs/ch{N}-topic.md`
2. Save it as `src/content/docs/ko/ch{N}-topic.md`
3. Translate all prose; keep code blocks unchanged
4. Translate Korean comments inside code blocks if they exist

### Adding a New Language

New languages require:
1. A new locale entry in `astro.config.mjs` under `locales`
2. A new subdirectory under `src/content/docs/{lang}/`
3. Translated sidebar labels in `translations.{lang}` for each sidebar item

Open an issue first to discuss before starting a full translation.

---

## Commit Style

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
fix: correct borrow checker example in ch3
feat: add ch15 on error handling patterns
docs: improve explanation of lifetime syntax
style: fix formatting in collections chapter
chore: update dependencies
```

---

## Pull Request Checklist

- [ ] Content is accurate (code examples compile/run correctly)
- [ ] Both English and Korean versions updated (or PR notes which is pending)
- [ ] Runnable code blocks tested locally
- [ ] No broken links
- [ ] Commit messages follow conventional commits style

---

## Code of Conduct

Be respectful. This project welcomes contributors of all experience levels.
Constructive feedback only — no gatekeeping about language backgrounds or skill levels.
