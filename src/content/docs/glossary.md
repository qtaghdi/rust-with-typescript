---
title: "Glossary"
description: "TypeScript ↔ Rust concept mapping — a quick-reference for when you get stuck"
---

When learning Rust after writing TypeScript, you frequently run into the question "what is the Rust equivalent of this?" This page is a 1-to-1 reference mapping TypeScript concepts to their Rust counterparts.

---

## Type System

| TypeScript | Rust | Notes |
|---|---|---|
| `string` | `String` / `&str` | `String` is an owned string; `&str` is a borrowed string slice |
| `number` | `i32`, `f64`, `u64`, etc. | Rust requires explicit integer/float sizes |
| `boolean` | `bool` | identical |
| `null` / `undefined` | `Option<T>` | represented as `None`; requires unwrapping |
| `T \| null` | `Option<T>` | `Some(T)` or `None` |
| `T \| Error` | `Result<T, E>` | `Ok(T)` or `Err(E)` |
| `any` | (none) | Rust has no `any` type; the closest is `Box<dyn Any>` |
| `unknown` | (none) | all types are determined at compile time |
| `never` | `!` | a type that never returns (`loop`, `panic`, etc.) |
| `void` | `()` | unit type |
| `Array<T>` / `T[]` | `Vec<T>` | dynamic array |
| `[T, U]` (tuple) | `(T, U)` | tuple |
| `Record<K, V>` / `Map<K, V>` | `HashMap<K, V>` | hash map |
| `Set<T>` | `HashSet<T>` | hash set |
| `readonly T[]` | `&[T]` | immutable slice |
| Generics `<T>` | Generics `<T>` | similar, but Rust requires trait bounds |
| `interface Foo {}` | `trait Foo {}` | behavior definition |
| `class Foo {}` | `struct Foo {}` + `impl Foo {}` | data and methods are separate |
| Type union `A \| B \| C` | `enum { A, B, C }` | Rust enums can carry data |

---

## Variables & Control Flow

| TypeScript | Rust | Notes |
|---|---|---|
| `const x = 1` | `let x = 1` | Rust `let` is immutable by default |
| `let x = 1` | `let mut x = 1` | `mut` is required for mutable variables |
| `const` (no reassignment) | `let` (immutable by default) | conceptually similar |
| `if / else if / else` | `if / else if / else` | identical; in Rust, `if` is an expression |
| `switch` | `match` | Rust `match` is exhaustive and can return values |
| `for...of` | `for x in iter` | iterator traversal |
| `while` | `while` | identical |
| `for...in` (key traversal) | `.iter().enumerate()` | when you need indices |
| `try / catch / finally` | `Result<T, E>` + `?` operator | no exceptions; errors are values |
| `throw new Error()` | `return Err(...)` / `panic!()` | `panic!` is unrecoverable |
| `?.` (optional chaining) | `.map()` / `if let Some(x) =` | `Option` chaining |
| `??` (nullish coalescing) | `.unwrap_or(default)` | default value when `None` |

---

## Functions & Closures

| TypeScript | Rust | Notes |
|---|---|---|
| `function f(x: number): number` | `fn f(x: i32) -> i32` | function declaration |
| `const f = (x) => x + 1` | `\|x\| x + 1` | closure |
| `async function f()` | `async fn f()` | async function |
| `await promise` | `.await` | async wait |
| `Promise<T>` | `Future<T>` | async value |
| Default params `f(x = 0)` | (none; use `Option<T>` or overloading) | default parameters |
| Rest params `...args` | (none; use a slice or `Vec`) | variadic arguments |
| Destructuring `{ a, b }` | pattern matching `let (a, b) = ...` | destructuring |

---

## Memory & Ownership

| TypeScript Concept | Rust Concept | Notes |
|---|---|---|
| GC (Garbage Collector) | Ownership system | compile-time memory management |
| Reference (freely passed) | Ownership transfer (move) | Rust: one owner at a time |
| Reference (freely shared) | Immutable reference `&T` | multiple concurrent borrows allowed |
| (none) | Mutable reference `&mut T` | only one at a time |
| (none) | Lifetime `'a` | explicit validity scope of a reference |
| Shallow copy | `Clone` trait | explicit deep copy |
| (automatic copy) | `Copy` trait | auto-copy for stack types (`i32`, `bool`, etc.) |
| `WeakRef` | `Weak<T>` | prevents reference cycles |

---

## Packages & Tools

| TypeScript / Node.js | Rust | Notes |
|---|---|---|
| `package.json` | `Cargo.toml` | package configuration file |
| `npm` / `yarn` / `pnpm` | `cargo` | package manager |
| `npmjs.com` | `crates.io` | package registry |
| `node_modules/` | `~/.cargo/` + `target/` | where dependencies are stored |
| `npm install foo` | `cargo add foo` | add a dependency |
| `npm run build` | `cargo build` | build |
| `npm run build` (prod) | `cargo build --release` | optimized build |
| `npm test` | `cargo test` | run tests |
| `tsc` | `rustc` (rarely used directly) | compiler |
| `tsconfig.json` | `Cargo.toml` + `rustfmt.toml` | configuration |
| `eslint` | `cargo clippy` | linter |
| `prettier` | `rustfmt` | formatter |
| `npm workspaces` | `Cargo workspaces` | monorepo |

---

## Error Handling

| TypeScript | Rust | Notes |
|---|---|---|
| `throw new Error("msg")` | `return Err("msg".into())` | return an error |
| `try { ... } catch(e) { ... }` | `match result { Ok(v) => ..., Err(e) => ... }` | handle an error |
| `e instanceof TypeError` | `match e { MyError::Type => ... }` | distinguish error types |
| Error subclassing | `enum MyError { ... }` + `thiserror` | custom errors |
| `e.message` | `e.to_string()` | error message |
| (none) | `?` operator | error propagation (without try/catch) |
| `Promise.reject()` | `Err(...)` | async error |

---

## Commonly Confused Rust Concepts

### `String` vs `&str`

`String` is an owned string allocated on the heap. `&str` is a read-only slice that points to a string that already exists somewhere. For function parameters, accepting `&str` is more flexible; use `String` only when ownership is required.

```rust
fn greet(name: &str) {          // &str: borrow and read without owning
    println!("Hello, {}!", name);
}

let owned: String = String::from("Alice");  // String: owned
let borrowed: &str = &owned;               // &str: borrowed

greet(&owned);   // String → &str auto-conversion (Deref coercion)
greet("Bob");    // string literals are also &str
```

### `clone()` vs `copy`

Types that implement the `Copy` trait (`i32`, `bool`, `f64`, `char`, etc.) are automatically copied on assignment, leaving the original intact. The `Clone` trait requires an explicit `.clone()` call and is used for types with heap data like `String` or `Vec`.

```rust
let a: i32 = 5;
let b = a;        // Copy: a is still valid

let s1 = String::from("hello");
let s2 = s1.clone();  // Clone: s1 is still valid
// let s2 = s1;       // this would move s1, making it unusable
```

### `unwrap()` vs `expect()` vs `?`

| Method | Behavior | When to use |
|---|---|---|
| `.unwrap()` | `panic!` if no value | prototyping, cases that can't possibly fail |
| `.expect("msg")` | `panic!` with a message if no value | debugging, when you want a clear failure reason |
| `?` | propagates the error to the caller | production code, chained error handling |

```rust
// unwrap: on failure prints "called unwrap on None"
let x = some_option.unwrap();

// expect: on failure prints the specified message
let x = some_option.expect("there must be a value here");

// ?: propagates the error upward; function return type must be Result
fn parse_config() -> Result<Config, MyError> {
    let raw = std::fs::read_to_string("config.toml")?;  // returns immediately on error
    let config: Config = toml::from_str(&raw)?;
    Ok(config)
}
```

### `Box<T>` vs `Rc<T>` vs `Arc<T>`

| Type | Purpose |
|---|---|
| `Box<T>` | heap allocation, single owner |
| `Rc<T>` | multiple owners (single thread) |
| `Arc<T>` | multiple owners (multiple threads) |

`Box<T>` is used to place a type of unknown size on the heap or to simply move ownership to the heap. `Rc<T>` enables multiple owners via reference counting, but is single-threaded only. `Arc<T>` is the thread-safe version of `Rc<T>`, used to share data across threads.

### `impl Trait` vs `dyn Trait`

| | `impl Trait` | `dyn Trait` |
|---|---|---|
| Dispatch | Static (static dispatch) | Dynamic (dynamic dispatch) |
| Performance | Compile-time optimization, fast | Runtime vtable lookup, slightly slower |
| Type | Resolved to a single type at compile time | Can be different types at runtime |
| Return type usage | `fn f() -> impl Trait` | `fn f() -> Box<dyn Trait>` |
| Storing in a collection | Not possible (same type only) | Possible (`Vec<Box<dyn Trait>>`) |

```rust
// impl Trait: type is fixed at compile time (fast)
fn make_adder(x: i32) -> impl Fn(i32) -> i32 {
    move |y| x + y
}

// dyn Trait: type determined at runtime (flexible)
fn get_shape(kind: &str) -> Box<dyn Shape> {
    match kind {
        "circle" => Box::new(Circle::new()),
        "rect"   => Box::new(Rectangle::new()),
        _        => panic!("unknown shape"),
    }
}
```

---

Come back to this page whenever you get stuck on a concept. It's here to help you quickly find the Rust equivalent of something familiar from TypeScript and keep your momentum going.
