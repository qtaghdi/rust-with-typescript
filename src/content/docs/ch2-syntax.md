---
title: "Ch.3 — Syntax Basics"
description: "Variables, functions, structs, traits, Option, Result, async/await — every core Rust concept mapped 1:1 to TypeScript equivalents with runnable examples"
---

## 2-1. Variables and Types

### Basic Declarations

In TypeScript, you declare variables with `let` and `const`. In Rust, both use `let`, but variables are **immutable by default**.

```typescript
// TypeScript
let count = 0;          // type inference: number
const name = "Alice";   // cannot be reassigned
let age: number = 30;   // explicit type

count = 1;  // OK
// name = "Bob"; // error: const cannot be reassigned
```

```rust
// Rust
let count = 0;        // type inference: i32, and immutable by default!
let name = "Alice";   // immutable
let age: u32 = 30;    // explicit type

// count = 1; // compile error: cannot assign twice to immutable variable

let mut count = 0;    // must add mut to allow mutation
count = 1;            // OK
```

> **Key difference**: TypeScript's `let` means "can be reassigned." Rust's `let` means "cannot be reassigned" by default. In Rust, you need `let mut` if you want to change a value.

### Variable and Type Comparison

| Concept | TypeScript | Rust |
|---------|-----------|------|
| Immutable variable | `const x = 1` | `let x = 1` |
| Mutable variable | `let x = 1` | `let mut x = 1` |
| Explicit type | `let x: number = 1` | `let x: i32 = 1` |
| Type inference | Yes (number, string, etc.) | Yes (i32, &str, etc.) |
| Global constant | `const MAX = 100` | `const MAX: u32 = 100` |
| Declaration before use | Optional | Required |

### Numeric Types

TypeScript has a single `number` type. Rust has separate types based on size and signedness.

```typescript
// TypeScript: one number type for everything
let a: number = 42;
let b: number = 3.14;
let c: number = -10;
```

```rust
// Rust: integers and floats are distinct, and sizes are explicit
let a: i32 = 42;      // 32-bit signed integer
let b: f64 = 3.14;    // 64-bit floating point
let c: i64 = -10;     // 64-bit signed integer
let d: u32 = 100;     // 32-bit unsigned integer (non-negative)
let e: usize = 10;    // platform-sized integer (used for array indices)
```

### Shadowing: A Rust-Specific Feature

In Rust, you can declare a new variable with the same name (shadowing). TypeScript doesn't allow this within the same scope.

```typescript
// TypeScript — cannot re-declare in the same scope
let value = "42";
// let value = parseInt(value); // error: duplicate declaration
let numValue = parseInt(value); // have to use a different name
```

```rust
// Rust — Shadowing: same name, even a different type is fine
let value = "42";
let value = value.parse::<i32>().unwrap(); // type changes from &str to i32
// the previous value is gone, and the new value (i32) takes its place
println!("{}", value); // 42
```

Shadowing is useful when "transforming a value that represents the same concept." Unlike `mut`, it allows the type to change, and after the transformation you can no longer access the original value.

---

## 2-2. Functions

### Basic Function Syntax

```typescript
// TypeScript
function add(a: number, b: number): number {
  return a + b;
}

// arrow function
const multiply = (a: number, b: number): number => a * b;

// default parameter
function greet(name: string, greeting: string = "Hello"): string {
  return `${greeting}, ${name}!`;
}

// optional parameter
function log(message: string, level?: string): void {
  console.log(`[${level ?? "INFO"}] ${message}`);
}
```

```rust
// Rust
fn add(a: i32, b: i32) -> i32 {
    a + b  // return keyword can be omitted (last expression is the return value)
}

// closure (equivalent to arrow functions)
let multiply = |a: i32, b: i32| -> i32 { a * b };
let multiply_short = |a: i32, b: i32| a * b; // single expression, braces optional

// no default parameters → use a separate function or Option
fn greet(name: &str, greeting: &str) -> String {
    format!("{}, {}!", greeting, name)
}

fn greet_default(name: &str) -> String {
    greet(name, "Hello")
}

// optional parameter → use Option<T>
fn log(message: &str, level: Option<&str>) {
    println!("[{}] {}", level.unwrap_or("INFO"), message);
}

// when calling
log("Server started", Some("DEBUG"));
log("Server started", None);
```

### Return Types: return vs. Last Expression

In Rust, `return` is only used for early returns. The last expression in a function is automatically returned.

```rust
fn classify(n: i32) -> &'static str {
    if n < 0 {
        return "negative"; // early return
    }
    if n == 0 {
        "zero"  // no return — this is the last expression
    } else {
        "positive"
    }
}
```

> Watch out for semicolons (`;`): in Rust, a line ending with a semicolon is a "statement," and one without is an "expression." The last line must not have a semicolon if it's meant to be the return value.

### Closure Comparison

```typescript
// TypeScript closures
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
const evens = numbers.filter(n => n % 2 === 0);
const sum = numbers.reduce((acc, n) => acc + n, 0);
```

```rust
// Rust closures
let numbers = vec![1, 2, 3, 4, 5];
let doubled: Vec<i32> = numbers.iter().map(|n| n * 2).collect();
let evens: Vec<&i32> = numbers.iter().filter(|n| *n % 2 == 0).collect();
let sum: i32 = numbers.iter().sum();
// or
let sum: i32 = numbers.iter().fold(0, |acc, n| acc + n);
```

---

## 2-3. interface → struct / trait

### TypeScript interface vs. Rust struct

TypeScript's `interface` defines the shape of an object. In Rust, data structures use [`struct`](/glossary/#타입-시스템), and behavior is separated into `impl` and [`trait`](/glossary/#타입-시스템).

```typescript
// TypeScript
interface User {
  id: number;
  name: string;
  email: string;
}

interface Greetable {
  greet(): string;
}

class User implements Greetable {
  constructor(
    public id: number,
    public name: string,
    public email: string,
  ) {}

  greet(): string {
    return `Hi, I'm ${this.name}`;
  }
}

const user = new User(1, "Alice", "alice@example.com");
console.log(user.greet()); // "Hi, I'm Alice"
```

```rust
// Rust: data (struct) and behavior (impl, trait) are separated
struct User {
    id: u32,
    name: String,
    email: String,
}

// method implementation (similar to class methods)
impl User {
    // constructor pattern (new is a conventional name, not a keyword)
    fn new(id: u32, name: String, email: String) -> User {
        User { id, name, email }
    }
}

// trait = TypeScript's interface (defines behavior)
trait Greetable {
    fn greet(&self) -> String;
}

// User implements Greetable
impl Greetable for User {
    fn greet(&self) -> String {
        format!("Hi, I'm {}", self.name)
    }
}

let user = User::new(1, "Alice".to_string(), "alice@example.com".to_string());
println!("{}", user.greet()); // "Hi, I'm Alice"
```

### Key Difference: Separating Data from Behavior

| Concept | TypeScript | Rust |
|---------|-----------|------|
| Data structure | `interface` / `class` | `struct` |
| Define behavior | `interface` (method signatures) | `trait` |
| Implement behavior | `class implements Interface` | `impl Trait for Struct` |
| Constructor | `constructor` | `fn new()` (convention) |
| `this` | `this` | `self` / `&self` / `&mut self` |
| Inheritance | `extends` | None (use composition instead) |

### Implementing Multiple Traits

```typescript
// TypeScript
interface Printable {
  print(): void;
}
interface Serializable {
  serialize(): string;
}

class User implements Printable, Serializable {
  print(): void { console.log(this.name); }
  serialize(): string { return JSON.stringify(this); }
}
```

```rust
// Rust
trait Printable {
    fn print(&self);
}
trait Serializable {
    fn serialize(&self) -> String;
}

impl Printable for User {
    fn print(&self) { println!("{}", self.name); }
}
impl Serializable for User {
    fn serialize(&self) -> String {
        format!(r#"{{"id":{},"name":"{}"}}"#, self.id, self.name)
    }
}
```

---

## 2-4. null/undefined → Option\<T\>

### TypeScript's null/undefined

```typescript
// TypeScript
function findUser(id: number): User | null {
  const user = users.find(u => u.id === id);
  return user ?? null;
}

const user = findUser(1);

// optional chaining
const city = user?.profile?.address?.city;

// nullish coalescing
const displayName = user?.name ?? "Anonymous";

// use after null check
if (user !== null && user !== undefined) {
  console.log(user.name); // user is guaranteed to be User here
}
```

### Rust's Option\<T\>

Rust has no `null`. Instead, situations where a value may or may not be present are expressed with [`Option<T>`](/glossary/#타입-시스템).

```rust
// Rust
fn find_user(id: u32) -> Option<User> {
    users.iter().find(|u| u.id == id).cloned()
}

let user = find_user(1);

// branch with match
match user {
    Some(u) => println!("{}", u.name),
    None => println!("User not found"),
}

// if let — only runs if a value is present
if let Some(u) = find_user(1) {
    println!("{}", u.name);
}

// unwrap_or — provide a default (like nullish coalescing ??)
let name = find_user(1)
    .map(|u| u.name.clone())
    .unwrap_or_else(|| "Anonymous".to_string());

// ? operator — chains Options (similar to optional chaining)
fn get_city(user_id: u32) -> Option<String> {
    let user = find_user(user_id)?;  // returns None immediately if None
    let profile = user.profile?;
    let address = profile.address?;
    Some(address.city.clone())
}
```

### Mapping the Concepts

| TypeScript | Rust | Meaning |
|-----------|------|---------|
| `T \| null` | `Option<T>` | value may be absent |
| `null` / `undefined` | `None` | no value |
| value present | `Some(value)` | value present |
| `?.` (optional chaining) | `?` operator | return None early if absent |
| `?? "default"` | `.unwrap_or("default")` | fallback if absent |
| `?? fn()` | `.unwrap_or_else(\|\| fn())` | call function if absent |
| use after null check | `if let Some(x) = ...` | pattern matching |
| `!` (non-null assertion) | `.unwrap()` | force value present (risk of panic) |

> **Why is this better?** In TypeScript, `string | null` can accidentally be passed where a `string` is expected, and the compiler doesn't force you to handle all paths. Rust's `Option<T>` won't compile unless you handle both the `Some` and `None` cases.

---

## 2-5. try/catch → Result\<T, E\>

### TypeScript's Exception Handling

```typescript
// TypeScript
function readFile(path: string): string {
  try {
    return fs.readFileSync(path, "utf-8");
  } catch (e) {
    // e is of type unknown... we don't know what it is
    throw new Error(`Failed to read file: ${e}`);
  }
}

async function processData(path: string): Promise<Data> {
  try {
    const raw = readFile(path);
    const json = JSON.parse(raw); // parsing can fail
    return validate(json);        // validation can fail
  } catch (e) {
    // hard to tell where the failure occurred
    console.error(e);
    throw e;
  }
}
```

**The problems:**
- `e` in `catch` is of type `unknown` — you don't know what you got
- The function signature carries no information that "this function can throw"
- The compiler doesn't enforce that errors must be handled

### Rust's Result\<T, E\>

[`Result<T, E>`](/glossary/#에러-처리) represents either success (`Ok(T)`) or failure (`Err(E)`) as a type. The function signature makes the possibility of error explicit, and the compiler forces you to handle it.

```rust
use std::fs;
use std::io;
use serde_json;

// error type is explicit in the function signature
fn read_file(path: &str) -> Result<String, io::Error> {
    fs::read_to_string(path) // returns Result<String, io::Error>
}

fn parse_json(content: &str) -> Result<serde_json::Value, serde_json::Error> {
    serde_json::from_str(content)
}

// ? operator: returns Err immediately on failure, unwraps the value on success
fn process_data(path: &str) -> Result<Data, Box<dyn std::error::Error>> {
    let raw = read_file(path)?;       // returns io::Error on failure
    let json = parse_json(&raw)?;     // returns serde_json::Error on failure
    let data = validate(json)?;       // returns ValidationError on failure
    Ok(data)
}

// caller must handle the result
match process_data("config.json") {
    Ok(data) => println!("Loaded: {:?}", data),
    Err(e) => eprintln!("Error: {}", e),
}

// or shorter
let data = process_data("config.json").expect("Failed to load config");
```

### [The `?` Operator](/glossary/#unwrap-vs-expect-vs-): A Cleaner Alternative to Chained try/catch

```typescript
// TypeScript — nested try/catch
async function loadConfig(): Promise<Config> {
  let raw: string;
  try {
    raw = await fs.readFile("config.json", "utf-8");
  } catch (e) {
    throw new Error(`Read failed: ${e}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Parse failed: ${e}`);
  }

  return validateConfig(parsed);
}
```

```rust
// Rust — clean with the ? operator
async fn load_config() -> Result<Config, AppError> {
    let raw = fs::read_to_string("config.json")?;  // returns Err immediately on failure
    let parsed: serde_json::Value = serde_json::from_str(&raw)?;
    let config = validate_config(parsed)?;
    Ok(config)
}
```

### Mapping the Concepts

| TypeScript | Rust | Meaning |
|-----------|------|---------|
| `try { ... }` | `Result<T, E>` | operation that can fail |
| `throw new Error(...)` | `Err(MyError::...)` | return an error |
| return success value | `Ok(value)` | wrap a success value |
| `catch (e)` | `match res { Err(e) => ... }` | handle an error |
| `finally` | `Drop` trait (automatic cleanup) | cleanup code |
| propagate error | manual `throw` | `?` operator |
| error type | none (discovered at runtime) | explicit at compile time |

---

## 2-6. async/await

### TypeScript's Async

```typescript
// TypeScript + Node.js
async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }
  return response.json() as Promise<User>;
}

async function main() {
  const user = await fetchUser(1);
  console.log(user.name);
}

// Promise.all — parallel execution
const [user, posts] = await Promise.all([
  fetchUser(1),
  fetchPosts(1),
]);
```

### Rust's Async (Tokio runtime)

```rust
// Rust + Tokio + reqwest
use tokio;
use reqwest;

async fn fetch_user(id: u32) -> Result<User, reqwest::Error> {
    let url = format!("http://api/users/{}", id);
    let user = reqwest::get(&url)
        .await?           // .await executes the Future
        .json::<User>()
        .await?;
    Ok(user)
}

#[tokio::main]  // macro that makes main async
async fn main() {
    let user = fetch_user(1).await.expect("Failed to fetch user");
    println!("{}", user.name);
}

// parallel execution — tokio::join!
let (user, posts) = tokio::join!(
    fetch_user(1),
    fetch_posts(1),
);
```

### Promise vs. Future

| Concept | TypeScript | Rust |
|---------|-----------|------|
| Async type | `Promise<T>` | `Future<Output = T>` |
| Async function | `async function` | `async fn` |
| Awaiting | `await` | `.await` |
| Eager execution | Yes (starts on creation) | No (only runs when polled) |
| Runtime | Node.js (built-in) | Tokio, async-std, etc. (your choice) |
| Parallel execution | `Promise.all()` | `tokio::join!()` |
| Error handling | `try/catch` | `?` + `Result` |

**An important difference**: JavaScript's `Promise` starts executing as soon as it's created. Rust's `Future` does nothing until it's polled with `.await` (lazy evaluation).

```rust
// In Rust, forgetting .await means nothing happens
let future = fetch_user(1); // Future is created, not yet running
// if future is unused, the compiler will warn you
let user = fetch_user(1).await?; // this is what actually runs it
```

---

## 2-7. Generics

### TypeScript Generics

```typescript
// TypeScript
function identity<T>(value: T): T {
  return value;
}

// constraints
function getLength<T extends { length: number }>(value: T): number {
  return value.length;
}

// generic interface
interface Repository<T, ID> {
  findById(id: ID): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(id: ID): Promise<void>;
}

// multiple constraints
function merge<T extends object, U extends object>(a: T, b: U): T & U {
  return { ...a, ...b };
}
```

### Rust Generics

```rust
// Rust
fn identity<T>(value: T) -> T {
    value
}

// constraints: trait bounds
fn get_length<T: HasLength>(value: T) -> usize {
    value.len()
}

// or where clause (more readable)
fn process<T, E>(value: T) -> Result<String, E>
where
    T: Display + Clone,  // T must implement Display and Clone
    E: std::error::Error,
{
    Ok(format!("{}", value))
}

// generic struct
struct Repository<T> {
    items: Vec<T>,
}

impl<T: Clone> Repository<T> {
    fn new() -> Self {
        Repository { items: Vec::new() }
    }

    fn save(&mut self, item: T) {
        self.items.push(item);
    }

    fn find_by_index(&self, index: usize) -> Option<T> {
        self.items.get(index).cloned()
    }
}
```

### Constraint Comparison

| TypeScript | Rust | Meaning |
|-----------|------|---------|
| `<T extends Type>` | `<T: Trait>` | T must implement Trait |
| `<T extends A & B>` | `<T: A + B>` | T must implement both A and B |
| `keyof T` | Not available (different approach) | Extract key types |
| `ReturnType<F>` | Not available (type inference) | Extract return type |
| `Partial<T>` | Manual `Option<T>` fields | Optional fields |

### Practical Example: Generic Cache

```typescript
// TypeScript
class Cache<K, V> {
  private store = new Map<K, V>();

  set(key: K, value: V): void {
    this.store.set(key, value);
  }

  get(key: K): V | undefined {
    return this.store.get(key);
  }
}

const cache = new Cache<string, User>();
cache.set("user:1", user);
```

```rust
// Rust
use std::collections::HashMap;

struct Cache<K, V> {
    store: HashMap<K, V>,
}

impl<K: Eq + std::hash::Hash, V> Cache<K, V> {
    fn new() -> Self {
        Cache { store: HashMap::new() }
    }

    fn set(&mut self, key: K, value: V) {
        self.store.insert(key, value);
    }

    fn get(&self, key: &K) -> Option<&V> {
        self.store.get(key)
    }
}

let mut cache: Cache<String, User> = Cache::new();
cache.set("user:1".to_string(), user);
```

> To use a type as a `HashMap` key in Rust, it must implement `Eq + Hash`. TypeScript's `Map` accepts any value as a key, but Rust enforces this constraint at compile time.

---

## Summary

- Rust variables are immutable by default; use `mut` to allow mutation.
- Functions return the last expression by default.
- `struct` and `trait` separate data from behavior.
- `Option` and `Result` replace null and exceptions.
- async/await requires a runtime (such as Tokio).

## Core Code

```rust runnable
fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn main() {
    let sum = add(2, 3);
    println!("sum = {}", sum);
}
```

## Common Mistakes

- Forgetting that `let` is immutable by default and trying to reassign.
- Adding a semicolon to the last line of a function, causing the return value to disappear.
- Trying to use an `Option` value directly and hitting a compile error.

## Exercises

1. Convert a TypeScript `try/catch` block to use `Result`.
2. Create a simple `struct` with an `impl` block and add a method to it.

## Chapter Connections

The previous chapter covered the differences in mental models.
The next chapter dives into Ownership and Borrowing in earnest.
