---
title: "Ch.12 — Learning Roadmap"
description: "A 6-month Rust roadmap for TypeScript developers"
---

Rust takes time to learn. Saying "you can pick it up in a week" would be a lie. But if you're already comfortable with types like TypeScript developers are, you can get up to speed much faster than developers from other backgrounds.

With a 6-month investment, you can reach a level where you're writing production-quality Rust code.

---

## Month-by-Month Roadmap

### Month 1 — Basic Syntax & Mental Model Shift

**Goal**: Be able to read Rust code and compile basic programs.

**Deliverable**: One small Rust CLI app

**Key Topics**:
- Installation (`rustup`, `cargo`)
- Variables, types, functions (Ch.2 of this book)
- Conditionals, loops, pattern matching
- `Option<T>` and `Result<T, E>` basics
- `struct` and `impl`

**Recommended Resources**:
- [The Rust Book (official)](https://doc.rust-lang.org/book/) — Chapters 1–6
- [Rustlings](https://github.com/rust-lang/rustlings) — First 20–30 exercises
- Ch.0–Ch.2 of this book

**This Month's Project**: CLI Calculator
```bash
cargo new calculator
```
```
> calc 10 + 5
15
> calc 100 / 4
25
> calc 3 * 7
21
```
A CLI tool that reads from stdin and performs arithmetic. Covers basic types, string parsing, `match`, and `Result` handling all at once.

**This Month's Checkpoints**:
- [ ] Can use `cargo new`, `cargo run`, `cargo build`
- [ ] Understands basic types and type inference
- [ ] Can handle Option/Result with `match`
- [ ] Has a rough understanding of "why the Borrow Checker blocks this"

---

### Month 2 — Mastering Ownership

**Goal**: Cooperate with the Borrow Checker instead of fighting it.

**Deliverable**: A complete address book CLI

**Key Topics**:
- The 3 rules of Ownership
- References and Borrowing (`&`, `&mut`)
- Lifetime basics
- String vs `&str`
- `Clone` and `Copy` traits

**Recommended Resources**:
- [The Rust Book](https://doc.rust-lang.org/book/) — Chapters 4–5
- Ch.3 of this book
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/) — Ownership section
- [Jon Gjengset - Crust of Rust](https://www.youtube.com/c/JonGjengset) — Lifetimes video

**This Month's Project**: Address Book CLI
```
> add Alice alice@example.com
Added: Alice
> list
1. Alice - alice@example.com
2. Bob - bob@example.com
> search Alice
Found: alice@example.com
```
Practice Ownership concepts by passing a `Vec<Contact>` to multiple functions by reference.

**This Month's Checkpoints**:
- [ ] Intuitively understands move semantics
- [ ] Can decide when to use `&T` vs `&mut T`
- [ ] Can explain the difference between `String` and `&str`
- [ ] Can read compiler error messages and fix them independently

---

### Month 3 — Advanced Type System & Error Handling

**Goal**: Work with Rust's type system as fluently as TypeScript's.

**Deliverable**: A complete JSON processing CLI

**Key Topics**:
- Enums and pattern matching (compared to TypeScript union types)
- Generics and trait bounds
- Error handling patterns (`thiserror`, `anyhow`)
- Iterators (`map`, `filter`, `fold`, `collect`)
- Advanced closures

**Recommended Resources**:
- [The Rust Book](https://doc.rust-lang.org/book/) — Chapters 6, 9, 10, 13
- [Rustlings](https://github.com/rust-lang/rustlings) — enums, error_handling, iterators
- [Exercism Rust Track](https://exercism.org/tracks/rust) — ongoing practice

**This Month's Project**: JSON File Processing CLI

```bash
# read users.json, filter, and print
> user-filter --file users.json --age-min 18 --sort name
```

Parse a file with `serde_json`, filter/sort with iterators, and handle errors with a custom error type.

**This Month's Checkpoints**:
- [ ] Can implement a state machine with Enum + match
- [ ] Can write generic functions with trait bounds
- [ ] Naturally propagates errors with the `?` operator
- [ ] Transforms data with iterator chaining

---

### Month 4 — Async Programming & HTTP

**Goal**: Build a real HTTP server with async Rust.

**Deliverable**: 3 Leptos components + a simple API

**Key Topics**:
- `async/await` basics
- Tokio runtime
- Differences between `Future` and `Promise`
- REST API with Axum or Actix-web
- HTTP client with `reqwest`

**Recommended Resources**:
- [Tokio official tutorial](https://tokio.rs/tokio/tutorial)
- [Axum official examples](https://github.com/tokio-rs/axum/tree/main/examples)
- Ch.9 of this book (UI components section)
- [Zero To Production In Rust](https://www.zero2prod.com/) — Chapters 5–7 (optional)

**This Month's Project**: Todo REST API

Rebuild something you made with TypeScript/React, this time with Leptos.

```
GET    /todos         - list all
POST   /todos         - create
GET    /todos/:id     - get one
PUT    /todos/:id     - update
DELETE /todos/:id     - delete
```

For a PostgreSQL integration challenge, use the `sqlx` crate.

**This Month's Checkpoints**:
- [ ] Uses `async fn` and `.await` naturally
- [ ] Implements a CRUD API with Axum
- [ ] Handles request/response types with Serde
- [ ] Understands shared state with `Arc<Mutex<T>>` or `Arc<RwLock<T>>`

---

### Month 5 — Performance Optimization & Advanced Patterns

**Goal**: Write code with a conscious awareness of Rust's performance strengths.

**Deliverable**: A complete parallel-processing CLI

**Key Topics**:
- Smart pointers (`Box<T>`, `Rc<T>`, `Arc<T>`)
- Trait objects (`dyn Trait`) vs generics
- Concurrency (`Mutex`, `RwLock`, channels)
- Profiling basics (`cargo flamegraph`)
- Advanced lifetimes

**Recommended Resources**:
- [The Rust Book](https://doc.rust-lang.org/book/) — Chapters 15, 16
- [Rust for Rustaceans](https://nostarch.com/rust-rustaceans) (Jon Gjengset) — intermediate book
- [Exercism](https://exercism.org/tracks/rust) — advanced problems
- [This Week in Rust](https://this-week-in-rust.org/) — newsletter subscription

**This Month's Project**: Multithreaded File Processor

Process a large CSV file in parallel across multiple threads to compute statistics.

```bash
> csv-stats --file big_data.csv --threads 4
Processed 1,000,000 rows in 0.8s
Average age: 35.2
Top city: Seoul (15,234 users)
```

Using the Rayon crate makes parallel processing as easy as `Promise.all` in TypeScript.

**This Month's Checkpoints**:
- [ ] Can decide when to use `Box<T>` vs `Arc<T>`
- [ ] Shares data between threads with `Mutex`
- [ ] Communicates between threads with channels (`mpsc`)
- [ ] Can perform basic performance profiling

---

### Month 6 — Real-World Projects & Exploring the Ecosystem

**Goal**: Complete a meaningful project entirely in Rust.

**Deliverable**: One completed personal project + README

**Key Topics**:
- Cargo workspaces and the module system
- Testing (`#[test]`, `#[cfg(test)]`, integration tests)
- Benchmarking (`criterion` crate)
- CI/CD setup (GitHub Actions)
- WebAssembly (optional)

**Recommended Resources**:
- [The Rust Book](https://doc.rust-lang.org/book/) — Chapters 11, 14
- [crates.io](https://crates.io) — explore crates
- [Are We Web Yet?](https://www.arewewebyet.org/) — Rust web ecosystem
- [Awesome Rust](https://github.com/rust-unofficial/awesome-rust) — curated list

**This Month's Final Project**: Pick one of the following

**Option A: GitHub CLI Clone (mini version)**
```bash
> my-gh repos list
> my-gh issues list --repo owner/repo
> my-gh pr create --title "feat: add feature"
```
A CLI tool that calls the GitHub API. Uses the `reqwest`, `serde`, and `clap` crates.

**Option B: Markdown Blog Engine**
```bash
> blog build --src posts/ --out dist/
> blog serve --port 8080
```
Filesystem traversal, Markdown parsing, static site generation.

**Option C: Real-Time Chat Server**
A chat server using WebSockets. Built with Axum + tokio-tungstenite.

**This Month's Checkpoints**:
- [ ] Project is well-organized into modules
- [ ] Unit tests and integration tests are written
- [ ] CI is configured with GitHub Actions
- [ ] Published publicly on GitHub with a README

---

## Core Resources Summary

### Essential (in this order)
1. **This book** — Build intuition by comparing with TypeScript
2. **[The Rust Book](https://doc.rust-lang.org/book/)** — Official introduction, free, available in multiple languages
3. **[Rustlings](https://github.com/rust-lang/rustlings)** — 100+ small practice exercises
4. **[Rust by Example](https://doc.rust-lang.org/rust-by-example/)** — Code-focused reference

### Intermediate Level
5. **[Exercism Rust Track](https://exercism.org/tracks/rust)** — Practice with mentoring
6. **[Rust for Rustaceans](https://nostarch.com/rust-rustaceans)** — Jon Gjengset's intermediate book
7. **[Zero To Production In Rust](https://www.zero2prod.com/)** — Real-world backend development

### Videos
8. **[Jon Gjengset YouTube](https://www.youtube.com/c/JonGjengset)** — Crust of Rust series
9. **[Let's Get Rusty](https://www.youtube.com/c/LetsGetRusty)** — Video lectures on The Rust Book

### Community
10. **[users.rust-lang.org](https://users.rust-lang.org/)** — Official forum
11. **[r/rust](https://www.reddit.com/r/rust/)** — Reddit community
12. **Rust Korea Discord** — Korean-language community

---

## Special Tips for TypeScript Developers

### When You Think "How Did I Do This in TypeScript?"

| What you're thinking in TypeScript | What to look up in Rust |
|----------------------|-----------------|
| `interface` | `struct` + `trait` |
| `type X = A \| B` | `enum` |
| `Promise<T>` | `Future<Output = T>` |
| `Array<T>` | `Vec<T>` |
| `Map<K, V>` | `HashMap<K, V>` |
| `?.` (optional chaining) | `?` operator + `Option` |
| `??` (nullish coalescing) | `.unwrap_or()` |
| `try/catch` | `Result<T, E>` + `match` |
| `readonly` | default (immutable) |
| `as const` | `const` + literal type |

### How to Make Friends with the Borrow Checker

Compiler error messages can feel intimidating at first. A few mindset shifts can help:

1. **Read error messages all the way through.** The Rust compiler explains the error and suggests a fix.
2. **Don't be afraid of `clone()`.** Copying to pass things along is fine at first. Optimize later.
3. **Start small.** Write small functions first, then combine them incrementally.
4. **Think of it as a conversation with the compiler.** Instead of "why won't this work?", ask "what is the compiler worried about?" — this framing accelerates learning enormously.

### Don't Get Discouraged

Everyone learning Rust goes through the same phases:

1. **Excitement** → "Safe and fast — this looks great!"
2. **Frustration** → "Why is the compiler blocking this? It works fine in TS!"
3. **Understanding** → "Oh, so that's why this rule exists..."
4. **Fluency** → "I couldn't go back to coding without the Borrow Checker"

Getting to phase 3 typically takes 1–2 months. Don't give up.

---

If you write good TypeScript code, you can absolutely write good Rust code too. In 6 months, you can experience the confidence of deploying with the assurance that "if it compiles, it runs."

Good luck. The `rustc` compiler will become a trusted companion.

---

## Chapter Connection

The practical examples from the previous chapter have made the learning goals concrete.
If you've read this far, it's time to put each monthly goal into practice.
