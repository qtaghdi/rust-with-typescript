---
title: "Ch.5 — Cargo & Module System"
description: "From npm/package.json to Cargo.toml — a complete guide to Rust's package manager and module system"
---

For TypeScript developers, npm/yarn is part of daily life. Installing dependencies, running scripts, building — all handled through npm. Rust's **[Cargo](/glossary/#패키지--도구)** is the official package manager and build tool that covers all of that, in a far more integrated way. Think of it as npm + tsc + jest + typedoc rolled into one. And Cargo isn't just a tool — it's tightly coupled with Rust's **module system**.

---

## Cargo vs npm

| Role | npm | Cargo |
|------|----------------------|-------|
| Install packages | `npm install` | `cargo add` / `cargo build` |
| Run scripts | `npm run dev` | `cargo run` |
| Build | `tsc` / `vite build` | `cargo build` |
| Release build | `npm run build` | `cargo build --release` |
| Test | `npm test` | `cargo test` |
| Generate docs | `typedoc` | `cargo doc` |
| Lint/format | `eslint` / `prettier` | `cargo clippy` / `cargo fmt` |
| Package registry | npmjs.com | crates.io |

The biggest advantage Cargo has over npm is **official integration**. No need to separately configure jest, prettier, or eslint — testing and formatting are built in from the start.

---

## Cargo.toml vs package.json

Both files define a project's metadata and dependencies.

```json
// package.json (TypeScript)
{
  "name": "my-app",
  "version": "1.0.0",
  "description": "My TypeScript app",
  "main": "dist/index.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest"
  },
  "dependencies": {
    "zod": "^3.22.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

```toml
# Cargo.toml (Rust)
[package]
name = "my-app"
version = "1.0.0"
edition = "2021"
description = "My Rust app"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
reqwest = { version = "0.11", features = ["json"] }
tokio = { version = "1", features = ["full"] }

[dev-dependencies]
assert_eq = "1.0"
```

A few differences stand out.

- **`edition`**: Specifies the Rust language edition. `2021` is the current default. Similar in concept to TypeScript's `"target"` setting.
- **`features`**: Some crates expose optional functionality via feature flags. Unlike npm packages, you can choose to only compile the features you need.
- **`dev-dependencies`**: Same as `devDependencies`. Dependencies used only in tests or benchmarks.
- **`Cargo.lock`**: The equivalent of `package-lock.json`. Add it to `.gitignore` for libraries (`lib`), but always commit it for applications (`bin`).

---

## Commonly Used Cargo Commands

| npm/yarn | Cargo | Description |
|---------|-------|------|
| `npm install` | `cargo build` | Install dependencies and build |
| `npm install serde` | `cargo add serde` | Add a package |
| `npm uninstall serde` | `cargo remove serde` | Remove a package |
| `npm run dev` | `cargo run` | Run the project |
| `npm test` | `cargo test` | Run tests |
| `npm run build` | `cargo build --release` | Optimized release build |
| `npx eslint .` | `cargo clippy` | Lint check |
| `npx prettier --write .` | `cargo fmt` | Format code |
| `npm run docs` | `cargo doc --open` | Generate and open docs |
| `npm audit` | `cargo audit` | Security vulnerability check |

### Key Command Descriptions

**`cargo run`** — Compiles and immediately runs the project. Similar to `npm run dev`, but no separate script setup is needed.

**`cargo build --release`** — Unlike a development build (`cargo build`), this compiles with maximum optimization. Both file size and execution speed improve significantly. Always use this before deploying to production.

**[`cargo clippy`](/glossary/#패키지--도구)** — Rust's official linter. It offers rich advice about writing more idiomatic Rust. It's far more proactive about code quality than TypeScript's ESLint.

**`cargo doc --open`** — Automatically generates HTML documentation from code comments (`///`) and opens it in the browser. Documentation for dependencies is included as well.

---

## Starting a New Project

### Creating a Project

```bash
# TypeScript
npm create vite@latest my-app
npx create-next-app@latest my-app

# Rust — executable binary project
cargo new my-project

# Rust — library project
cargo new --lib my-lib
```

### Comparing Generated Directory Structures

```
# TypeScript (Vite)
my-app/
  src/
    main.ts
    App.tsx
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  node_modules/     ← dependencies (often hundreds of MB)
```

```
# Rust
my-project/
  src/
    main.rs         ← entry point (for binaries)
  Cargo.toml        ← plays the role of package.json
  Cargo.lock        ← plays the role of package-lock.json
  target/           ← build output (add to .gitignore like node_modules)
```

The structure is much simpler. Instead of a massive `node_modules` folder, Cargo stores dependencies in a system-wide cache (`~/.cargo/registry`). Multiple projects share the same version of a crate, so there's no disk waste.

---

## Module System: import/export vs mod/use

This is the part TypeScript developers find most confusing in Rust. Unlike TypeScript, where creating a file automatically makes it a module, **Rust requires every module to be explicitly declared.**

### TypeScript: File = Module

In TypeScript, creating a file automatically makes it a module. You `export` what you want to share, and `import` what you want to use.

```typescript
// src/math/add.ts
export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}
```

```typescript
// src/main.ts
import { add, multiply } from './math/add';

console.log(add(1, 2));       // 3
console.log(multiply(3, 4));  // 12
```

You can import directly using just the file path. The TypeScript compiler traverses the file system directly.

### Rust: Explicit Module Declaration

In Rust, creating a file alone is not enough. You must **register the file as a module using the `mod` keyword** for the compiler to recognize it.

```rust
// src/math.rs
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

pub fn multiply(a: i32, b: i32) -> i32 {
    a * b
}
```

```rust
// src/main.rs
mod math;           // "include src/math.rs as the math module"
use math::add;      // bring add from the math module into the current scope

fn main() {
    println!("{}", add(1, 2));           // 3
    println!("{}", math::multiply(3, 4)); // 12 — also accessible via full path without use
}
```

TypeScript's `import` references file paths directly, but Rust's `use` references **module paths**. The module path `math` only exists once `mod math` has been declared.

### The pub Keyword — Access Control

Just as something without `export` in TypeScript is inaccessible outside its file, something without `pub` in Rust is inaccessible outside its module.

| TypeScript | Rust | Description |
|---|---|---|
| `export function foo()` | `pub fn foo()` | Accessible externally |
| `function foo()` (no export) | `fn foo()` (no pub) | Module-internal only |
| `export class Foo` | `pub struct Foo` | Public type/struct |
| `export default foo` | `pub use self::foo` | re-export |

```rust
// src/auth.rs
pub struct User {
    pub name: String,     // readable/writable from outside
    pub email: String,    // readable/writable from outside
    password_hash: String, // inaccessible from outside (no pub)
}

pub fn create_user(name: &str, email: &str, password: &str) -> User {
    User {
        name: name.to_string(),
        email: email.to_string(),
        password_hash: hash_password(password), // can call internal function
    }
}

fn hash_password(password: &str) -> String {
    // internal implementation not exposed externally
    format!("hashed_{}", password)
}
```

Access control is more fine-grained than TypeScript. You can make the struct itself public (`pub struct`) while keeping certain fields (`password_hash`) private.

### File Structure Conventions

Rust's file structure maps directly to module paths.

```
# Rust file structure and module paths
src/
  main.rs          ← entry point, crate root
  lib.rs           ← library root (can coexist with binary)
  math.rs          ← equivalent to mod math { ... }
  math/
    mod.rs         ← root of the math module when submodules exist
    add.rs         ← equivalent to mod math { mod add { ... } }
    multiply.rs    ← equivalent to mod math { mod multiply { ... } }
  auth/
    mod.rs
    user.rs        ← accessible as auth::user, like math::add
```

```
# TypeScript file structure
src/
  index.ts
  math/
    index.ts       ← math/index.ts = Rust's math/mod.rs
    add.ts
    multiply.ts
  auth/
    index.ts
    user.ts
```

Since Rust 2018, it's also possible to use `math.rs` alongside a `math/` directory instead of `mod.rs`. Both conventions are in use today depending on the situation.

```rust
// Example of including submodules in src/main.rs
mod math;          // src/math.rs or src/math/mod.rs
mod auth;          // src/auth.rs or src/auth/mod.rs

use math::add;
use auth::{User, create_user};

fn main() {
    let result = add(1, 2);
    let user = create_user("Alice", "alice@example.com", "secret");
    println!("{} + 1 + 2 = {}", user.name, result);
}
```

---

## Using External Crates

### 1. Finding Packages on crates.io

[crates.io](https://crates.io) is Rust's npmjs.com. Packages are called "crates." You can view auto-generated documentation for all crates at [docs.rs](https://docs.rs).

### 2. Adding Dependencies

```bash
# npm approach
npm install zod
npm install -D @types/node

# Cargo approach
cargo add serde                          # add latest version
cargo add serde --features derive        # include feature flag
cargo add tokio --features full          # async runtime
cargo add --dev pretty_assertions        # dev dependency
```

`cargo add` automatically modifies `Cargo.toml`. You can also edit it directly like a `package.json`.

### 3. Using in Code

```typescript
// TypeScript
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string(),
  age: z.number(),
});

type User = z.infer<typeof UserSchema>;
```

```rust
// Add to Cargo.toml:
// serde = { version = "1.0", features = ["derive"] }
// serde_json = "1.0"

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
struct User {
    name: String,
    age: u32,
}

fn main() {
    let json = r#"{"name": "Alice", "age": 30}"#;
    let user: User = serde_json::from_str(json).unwrap();
    println!("{:?}", user);

    let back_to_json = serde_json::to_string(&user).unwrap();
    println!("{}", back_to_json);
}
```

`use serde::Serialize` follows the same pattern as TypeScript's `import { Serialize } from 'serde'`. However, in Rust, `use` alone is not enough — the dependency must first be registered in `Cargo.toml`.

---

## Workspace (Monorepo)

Use a Cargo workspace when you want to manage multiple crates in a single repository. The concept is the same as npm workspaces.

```json
// package.json (npm workspaces)
{
  "name": "my-monorepo",
  "workspaces": [
    "packages/core",
    "packages/ui",
    "packages/api"
  ]
}
```

```toml
# Cargo.toml (root — Cargo workspace)
[workspace]
members = [
    "crates/core",
    "crates/api",
    "crates/cli",
]
resolver = "2"
```

```
# Workspace directory structure
my-workspace/
  Cargo.toml          ← workspace root
  Cargo.lock          ← single lock file shared across the workspace
  crates/
    core/
      Cargo.toml
      src/
        lib.rs
    api/
      Cargo.toml      ← can declare a dependency on core
      src/
        main.rs
    cli/
      Cargo.toml
      src/
        main.rs
```

```toml
# crates/api/Cargo.toml
[package]
name = "api"
version = "0.1.0"
edition = "2021"

[dependencies]
core = { path = "../core" }   # reference a crate within the workspace
tokio = { version = "1", features = ["full"] }
```

All crates in a workspace share a single `Cargo.lock`, so there are no dependency version conflicts. If you've ever wrestled with hoisting issues in npm workspaces, Cargo's approach will feel much cleaner.

---

## Summary

- **Cargo = npm + tsc + jest + prettier + typedoc** — all Rust ecosystem build tools unified in one.
- **Cargo.toml = package.json** — defines project metadata and dependencies.
- **crates.io = npmjs.com** — Rust's official package registry.
- **Creating a file does not automatically make it a module.** You must explicitly register it with `mod name;`.
- **Without `pub`, a module's contents are inaccessible from outside** — equivalent to TypeScript's `export`.
- **`use` is similar to `import`, but** uses module paths, not file paths.
- **Cargo workspace = npm workspaces** — monorepo structure is officially supported.

---

## Key Code

An example showing the full module system flow at a glance.

```rust runnable
mod greet {
    pub fn hello(name: &str) -> String {
        format!("Hello, {}!", name)
    }

    pub fn goodbye(name: &str) -> String {
        format!("Goodbye, {}!", name)
    }

    // no pub — inaccessible from outside the module
    fn internal_helper() -> &'static str {
        "this can only be used inside the module"
    }
}

mod math {
    pub fn add(a: i32, b: i32) -> i32 {
        a + b
    }

    pub mod advanced {
        pub fn power(base: i32, exp: u32) -> i32 {
            base.pow(exp)
        }
    }
}

fn main() {
    // using the greet module
    let msg = greet::hello("TypeScript developer");
    println!("{}", msg);

    let bye = greet::goodbye("TypeScript developer");
    println!("{}", bye);

    // using the math module
    let sum = math::add(3, 4);
    println!("3 + 4 = {}", sum);

    // using the nested module
    let squared = math::advanced::power(2, 10);
    println!("2^10 = {}", squared);
}
```

---

## Common Mistakes

### 1. Trying to use `use` without declaring `mod` first

```rust
// ❌ Wrong — even if math.rs exists, without a mod declaration it's a compile error
use math::add;

fn main() {
    println!("{}", add(1, 2));
}
// error[E0432]: unresolved import `math`
```

```rust
// ✅ Correct — must register with mod first before using use
mod math;
use math::add;

fn main() {
    println!("{}", add(1, 2));
}
```

### 2. Forgetting `pub` and getting a private access error

```rust
// src/math.rs
fn add(a: i32, b: i32) -> i32 { // ❌ no pub
    a + b
}

// src/main.rs
mod math;
use math::add; // error[E0603]: function `add` is private
```

```rust
// src/math.rs
pub fn add(a: i32, b: i32) -> i32 { // ✅ pub added
    a + b
}
```

### 3. Creating a file like node_modules and forgetting the `mod` declaration

The TypeScript habit of creating a file like `src/utils.ts` and importing it directly doesn't work in Rust.

```
# ❌ Just creating a file is not enough
src/
  main.rs
  utils.rs    ← without mod utils; the compiler ignores this file
```

```rust
// ✅ Must declare in main.rs
mod utils;   // now utils.rs is included in compilation

fn main() {
    utils::some_function();
}
```

### 4. Making a struct public but leaving fields private

```rust
pub struct Config {
    host: String,  // ❌ no pub — cannot create Config { host: "..." } from outside
    port: u16,
}

// From external code:
// let c = Config { host: "localhost".to_string(), port: 8080 };
// error[E0451]: field `host` of struct `Config` is private
```

```rust
pub struct Config {
    pub host: String,  // ✅
    pub port: u16,
}
```

Or, the more idiomatic Rust pattern is to provide a constructor function (`pub fn new(...)`) and keep the fields private.

---

## Preview of the Next Chapter

The next chapter covers **Enums and Pattern Matching** — Rust's version of TypeScript's `union type`.

```typescript
// TypeScript
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rectangle'; width: number; height: number };
```

```rust
// Rust — this can be expressed far more elegantly
enum Shape {
    Circle { radius: f64 },
    Rectangle { width: f64, height: f64 },
}
```

Rust's `enum` supports TypeScript's discriminated union pattern at the language level. Combined with the `match` expression — which forces the compiler to verify all cases are handled — it becomes an extremely powerful pattern.
