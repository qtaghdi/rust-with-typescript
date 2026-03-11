---
title: "Ch.6 — Enum & Pattern Matching"
description: "TypeScript union types vs Rust enums, exhaustive match, Option/Result patterns, and a real-world state machine example"
---

When working with TypeScript, you often reach for union types like `string | number | null` or discriminated unions.

Rust's `enum` takes that concept one step further. And `match` looks similar to TypeScript's `switch`, but it's far more powerful and safe.

In this chapter, we'll explore Rust's `enum` and pattern matching through the eyes of a TypeScript developer.

---

## 6-1. Union Type vs Enum — Basic Comparison

In TypeScript, when you need to say "this value can be one of several types," you use union types. Rust expresses the same concept with `enum` — the shape is similar, but the behavior is different.

### TypeScript: union type

```typescript
// TypeScript — union type representing directions
type Direction = "North" | "South" | "East" | "West";

function move(dir: Direction): string {
  return `Moving ${dir}`;
}

move("North");  // OK
move("Up");     // compile error: '"Up"' is not assignable to type 'Direction'
```

Using a string literal union ensures only allowed values can be passed in. But this is a constraint that lives in the type system — at runtime, this value is just a `string`.

### Rust: enum

```rust
// Rust — enum representing directions
enum Direction {
    North,
    South,
    East,
    West,
}

fn move_player(dir: Direction) -> String {
    format!("Moving {:?}", dir)  // in practice you'd use match here
}

move_player(Direction::North);  // OK
// move_player("Up");  // compile error: type mismatch
```

Rust's `enum` is a **real type**. `Direction::North` is not a `string` — it's a value of type `Direction`, and that type information is preserved at runtime.

### Comparison

| Concept | TypeScript | Rust |
|------|-----------|------|
| Definition | `type Dir = "A" \| "B"` | `enum Dir { A, B }` |
| Value usage | `"North"` (string) | `Direction::North` |
| Runtime type | string | Direction (enum) |
| Adding methods | Not possible (type alias) | `impl Direction { ... }` |
| Pattern matching | manual switch/if | match (enforced by compiler) |

> **Key difference**: TypeScript's union type is a type-layer constraint that disappears at compile time. Rust's enum is a real type whose structure is preserved even after compilation.

### Adding Methods to Rust Enums

Rust enums can have methods attached via `impl` blocks — something that's impossible with TypeScript's string unions.

```rust
enum Direction {
    North,
    South,
    East,
    West,
}

impl Direction {
    fn is_vertical(&self) -> bool {
        match self {
            Direction::North | Direction::South => true,
            Direction::East | Direction::West => false,
        }
    }

    fn opposite(&self) -> Direction {
        match self {
            Direction::North => Direction::South,
            Direction::South => Direction::North,
            Direction::East => Direction::West,
            Direction::West => Direction::East,
        }
    }
}

let dir = Direction::North;
println!("{}", dir.is_vertical()); // true
```

---

## 6-2. Embedding Data in Enums — Discriminated Union vs Rust Enum with Data

This is where Rust enums are far more powerful than TypeScript unions.

### TypeScript: Discriminated Union

In TypeScript, when each case needs to carry different data, you use the discriminated union pattern.
A common field like `kind` or `type` distinguishes which case it is.

```typescript
// TypeScript — representing shapes with a discriminated union
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rectangle"; width: number; height: number }
  | { kind: "triangle"; base: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      return shape.width * shape.height;
    case "triangle":
      return (shape.base * shape.height) / 2;
    default:
      // TypeScript treats this as the `never` type
      const _exhaustive: never = shape;
      throw new Error("Unknown shape");
  }
}

const c: Shape = { kind: "circle", radius: 5 };
console.log(area(c)); // 78.54...
```

It works, but there are pain points. You have to manually maintain the `kind` field, and if you forget the `default: never` pattern, exhaustive checking breaks down.

### Rust: Enum with Data

In Rust, each enum variant can carry its own data directly.
No need for a separate discriminant field like `kind`.

```rust
// Rust — embedding data directly in enum variants
enum Shape {
    Circle { radius: f64 },
    Rectangle { width: f64, height: f64 },
    Triangle { base: f64, height: f64 },
}

fn area(shape: &Shape) -> f64 {
    match shape {
        Shape::Circle { radius } => std::f64::consts::PI * radius * radius,
        Shape::Rectangle { width, height } => width * height,
        Shape::Triangle { base, height } => base * height / 2.0,
        // if any case is missing, it won't compile!
    }
}

let c = Shape::Circle { radius: 5.0 };
println!("{:.2}", area(&c)); // 78.54
```

If even one case is missing from `match`, **it simply won't compile**. No need to worry about forgetting a `default` handler.

### Enum Variant Forms

Rust enum variants come in three forms.

```rust
enum Message {
    // 1. No data (unit variant)
    Quit,

    // 2. Unnamed data (tuple variant)
    Move(i32, i32),

    // 3. Named data (struct variant)
    Write { text: String, urgent: bool },
}

// Creating values
let q = Message::Quit;
let m = Message::Move(10, 20);
let w = Message::Write {
    text: String::from("hello"),
    urgent: false,
};
```

In TypeScript, the equivalent looks like this.

```typescript
// TypeScript equivalent
type Message =
  | { kind: "quit" }
  | { kind: "move"; x: number; y: number }
  | { kind: "write"; text: string; urgent: boolean };

const q: Message = { kind: "quit" };
const m: Message = { kind: "move", x: 10, y: 20 };
const w: Message = { kind: "write", text: "hello", urgent: false };
```

The Rust version is more concise. No need for a separate discriminant field like `kind`.

### Try It Out

```rust runnable
enum Direction {
    North,
    South,
    East,
    West,
}

fn main() {
    let dir = Direction::West;
    let label = match dir {
        Direction::North => "N",
        Direction::South => "S",
        Direction::East => "E",
        Direction::West => "W",
    };
    println!("dir = {}", label);
}
```

---

## 6-3. [`match`](/glossary/#변수--제어-흐름) Expression — TypeScript switch vs Rust match

### TypeScript: switch statement

TypeScript's `switch` is a statement inherited from JavaScript. To return a value, you need an external variable, and forgetting `break` causes fall-through.

```typescript
// TypeScript — switch statement
type Color = "red" | "green" | "blue";

function colorToHex(color: Color): string {
  let hex: string;  // external variable needed

  switch (color) {
    case "red":
      hex = "#FF0000";
      break;
    case "green":
      hex = "#00FF00";
      break;
    case "blue":
      hex = "#0000FF";
      break;
    // no compile error if default is omitted!
    // if a new case is added and this is forgotten, hex becomes undefined
  }

  return hex!; // non-null assertion required (a warning sign)
}
```

When you add a new color to the `Color` union, TypeScript won't warn you by default if you forget to add it to the `switch`. This is a classic pattern for silent bugs.

### Rust: match expression

Rust's `match` is an **expression**.
It returns a value directly, and it only compiles if every case is handled.

```rust
// Rust — match expression
enum Color {
    Red,
    Green,
    Blue,
}

fn color_to_hex(color: Color) -> &'static str {
    match color {
        Color::Red   => "#FF0000",
        Color::Green => "#00FF00",
        Color::Blue  => "#0000FF",
        // if a new variant is added and not handled here, it's a compile error!
    }
}

// match is an expression, so it can be assigned directly
let hex = match Color::Red {
    Color::Red   => "#FF0000",
    Color::Green => "#00FF00",
    Color::Blue  => "#0000FF",
};
```

What happens if you add `Yellow` to the `Color` enum?

```rust
enum Color {
    Red,
    Green,
    Blue,
    Yellow,  // newly added
}

fn color_to_hex(color: Color) -> &'static str {
    match color {
        Color::Red   => "#FF0000",
        Color::Green => "#00FF00",
        Color::Blue  => "#0000FF",
        // if Color::Yellow is not handled...
        // error[E0004]: non-exhaustive patterns: `Color::Yellow` not covered
    }
}
```

The compiler tells you exactly which case is missing. You're **forced** to update all relevant code when a new case is added.

### Various match Patterns

Rust's `match` goes beyond simple value comparison — it supports a wide variety of patterns.

```rust
let num = 7;

let description = match num {
    // single value
    1 => "one",

    // OR pattern (|)
    2 | 3 => "two or three",

    // range pattern (..=)
    4..=6 => "four to six",

    // guard condition
    n if n % 2 == 0 => "even, greater than 6",

    // wildcard (catch-all)
    _ => "odd, greater than 6",
};

println!("{}", description); // "odd, greater than 6"
```

Writing the same thing in TypeScript is far more verbose.

```typescript
// TypeScript equivalent
const num = 7;

const description =
  num === 1 ? "one"
  : num === 2 || num === 3 ? "two or three"
  : num >= 4 && num <= 6 ? "four to six"
  : num > 6 && num % 2 === 0 ? "even, greater than 6"
  : "odd, greater than 6";
```

### Try It Out

```rust runnable
fn main() {
    let num = 7;

    let description = match num {
        1 => "one",
        2 | 3 => "two or three",
        4..=6 => "four to six",
        n if n % 2 == 0 => "even, greater than 6",
        _ => "odd, greater than 6",
    };

    println!("{}", description);
}
```

### Destructuring Patterns

`match` also handles extracting data from inside enum variants in one step.

```rust
enum Point {
    TwoD { x: f64, y: f64 },
    ThreeD { x: f64, y: f64, z: f64 },
}

fn describe_point(p: Point) -> String {
    match p {
        // destructure struct variant
        Point::TwoD { x, y } => {
            format!("2D point at ({}, {})", x, y)
        }
        // match specific value + capture the rest
        Point::ThreeD { x: 0.0, y: 0.0, z } => {
            format!("On the Z-axis at z={}", z)
        }
        Point::ThreeD { x, y, z } => {
            format!("3D point at ({}, {}, {})", x, y, z)
        }
    }
}
```

```typescript
// TypeScript equivalent
type Point =
  | { kind: "2d"; x: number; y: number }
  | { kind: "3d"; x: number; y: number; z: number };

function describePoint(p: Point): string {
  if (p.kind === "2d") {
    return `2D point at (${p.x}, ${p.y})`;
  } else if (p.x === 0 && p.y === 0) {
    return `On the Z-axis at z=${p.z}`;
  } else {
    return `3D point at (${p.x}, ${p.y}, ${p.z})`;
  }
}
```

The TypeScript version separates the `p.kind` check from property access, and exhaustive checking requires extra boilerplate. Rust's `match` unifies all of this into a single expression.

---

## 6-4. Option\<T\> and match — The Core of Null Safety

We briefly saw [`Option<T>`](/glossary/#타입-시스템) back in Ch.2. Let's go deeper now. Rust has no `null` or `undefined`. Any situation where "a value might not exist" is always expressed as `Option<T>`.

### TypeScript: null / undefined

```typescript
// TypeScript — null can be lurking anywhere
function findUser(id: number): { name: string } | null {
  if (id === 1) {
    return { name: "Alice" };
  }
  return null;
}

const user = findUser(2);

// What if you forget the null check?
// console.log(user.name); // runtime error: Cannot read properties of null

// null check required
if (user !== null) {
  console.log(user.name); // safe
}

// shorthand with optional chaining
console.log(user?.name); // undefined (no error)
```

TypeScript strict mode enforces null checks, but they can be bypassed with `as any` or the `!` operator.

### Rust: Option\<T\>

```rust
// Rust — "might not have a value" expressed as a type
struct User {
    name: String,
}

fn find_user(id: u32) -> Option<User> {
    if id == 1 {
        Some(User { name: String::from("Alice") })
    } else {
        None
    }
}

let user = find_user(2); // type is Option<User>

// cannot use the value while ignoring Option — compile error
// println!("{}", user.name);

// explicit handling with match
match user {
    Some(u) => println!("Found: {}", u.name),
    None    => println!("User not found"),
}
```

`Option<T>` is simply an enum defined in the Rust standard library.

```rust
// Option definition in the standard library (conceptually)
enum Option<T> {
    Some(T),
    None,
}
```

There are just two cases — `Some(value)` and `None` — and both must be handled with `match` for the code to compile.

### Useful Option Methods

Using `match` every time can be verbose, so `Option` comes with many convenience methods.

```rust
let maybe_name: Option<String> = Some(String::from("Alice"));
let no_name: Option<String> = None;

// unwrap_or: return a default value when None
let name1 = maybe_name.unwrap_or(String::from("Anonymous"));
let name2 = no_name.unwrap_or(String::from("Anonymous"));
println!("{}, {}", name1, name2); // Alice, Anonymous

// map: transform the value inside Some (None passes through unchanged)
let length: Option<usize> = maybe_name.as_ref().map(|s| s.len());
println!("{:?}", length); // Some(5)

// unwrap_or_else: run a closure when None
let name3 = no_name.unwrap_or_else(|| String::from("Guest"));
println!("{}", name3); // Guest

// is_some(), is_none(): when you just want to check
if maybe_name.is_some() {
    println!("has a value");
}
```

These correspond to TypeScript's `??`, `?.`, and `|| defaultValue` respectively.

```typescript
// TypeScript comparison
const maybeName: string | null = "Alice";
const noName: string | null = null;

const name1 = maybeName ?? "Anonymous"; // "Alice"
const name2 = noName ?? "Anonymous";    // "Anonymous"

const length = maybeName?.length;       // 5 | undefined

if (maybeName !== null) {
  console.log("has a value");
}
```

---

## 6-5. if let — Shorthand for match

Sometimes you only want to handle one specific pattern and ignore everything else. Using `match` requires you to also write out the `None` case, which can feel verbose.

### match vs if let Comparison

```rust
let config: Option<u32> = Some(42);

// with match: must write the None case too
match config {
    Some(value) => println!("config value: {}", value),
    None => {}  // this line is required even if nothing happens here
}

// with if let: handle only the case you care about
if let Some(value) = config {
    println!("config value: {}", value);
}
// None is simply skipped
```

This is similar to TypeScript's `if (x !== null)` pattern.

```typescript
// TypeScript comparison
const config: number | null = 42;

if (config !== null) {
  console.log(`config value: ${config}`);
}
```

But `if let` goes beyond simple null checks — it handles complex structures in one step.

```rust
// matching enum variants with if let
enum Response {
    Ok { body: String, status: u16 },
    Error { code: u32, message: String },
}

let resp = Response::Ok {
    body: String::from("Hello"),
    status: 200,
};

if let Response::Ok { body, status } = resp {
    println!("success: {} ({})", body, status);
}
// Response::Error is ignored

// can also add an else branch
let resp2 = Response::Error { code: 404, message: String::from("Not Found") };

if let Response::Ok { body, status } = resp2 {
    println!("success: {} ({})", body, status);
} else {
    println!("request failed");
}
```

### while let

The same pattern can be applied to loops. It continues executing as long as the pattern matches.

```rust
let mut stack = vec![1, 2, 3, 4, 5];

// stack.pop() returns Option<i32>
// keeps running while Some(value), stops when None
while let Some(top) = stack.pop() {
    print!("{} ", top); // 5 4 3 2 1
}
```

The TypeScript equivalent looks like this.

```typescript
// TypeScript comparison
const stack = [1, 2, 3, 4, 5];

let top: number | undefined;
while ((top = stack.pop()) !== undefined) {
  process.stdout.write(`${top} `); // 5 4 3 2 1
}
```

The Rust version more clearly expresses the intent.

### if let chains (Rust 1.64+)

When checking multiple conditions in sequence, you can chain `if let` expressions together.

```rust
struct Config {
    host: Option<String>,
    port: Option<u16>,
}

let cfg = Config {
    host: Some(String::from("localhost")),
    port: Some(8080),
};

// if let chain: only runs when both are Some
if let Some(host) = &cfg.host
    && let Some(port) = cfg.port
{
    println!("connecting: {}:{}", host, port); // connecting: localhost:8080
}
```

```typescript
// TypeScript comparison
interface Config {
  host: string | null;
  port: number | null;
}

const cfg: Config = { host: "localhost", port: 8080 };

if (cfg.host !== null && cfg.port !== null) {
  console.log(`connecting: ${cfg.host}:${cfg.port}`);
}
```

---

## 6-6. Real-World Example: State Machine — HTTP Request States

Let's bring together everything we've learned in a practical example. We'll model an HTTP request state machine — a very common pattern in frontend development.

### TypeScript Implementation

```typescript
// TypeScript — HTTP request state management

// state definitions
type RequestState<T> =
  | { status: "pending" }
  | { status: "loading"; progress: number }
  | { status: "success"; data: T; timestamp: Date }
  | { status: "error"; error: Error; retryCount: number };

// user data type
interface User {
  id: number;
  name: string;
  email: string;
}

// return UI message based on state
function renderState(state: RequestState<User>): string {
  switch (state.status) {
    case "pending":
      return "Waiting for request...";

    case "loading":
      return `Loading... ${state.progress}%`;

    case "success":
      return `Done! User: ${state.data.name} (${state.timestamp.toISOString()})`;

    case "error":
      return `Error: ${state.error.message} (retries: ${state.retryCount})`;

    default:
      // boilerplate for exhaustive check
      const _exhaustive: never = state;
      throw new Error("Unknown state");
  }
}

// state transition functions
function startLoading(state: RequestState<User>): RequestState<User> {
  if (state.status !== "pending") {
    throw new Error("Can only transition to loading from pending state");
  }
  return { status: "loading", progress: 0 };
}

function updateProgress(
  state: RequestState<User>,
  progress: number
): RequestState<User> {
  if (state.status !== "loading") {
    throw new Error("Can only update progress from loading state");
  }
  return { ...state, progress };
}

function complete(
  state: RequestState<User>,
  data: User
): RequestState<User> {
  if (state.status !== "loading") {
    throw new Error("Can only transition to success from loading state");
  }
  return { status: "success", data, timestamp: new Date() };
}

function fail(
  state: RequestState<User>,
  error: Error
): RequestState<User> {
  const retryCount =
    state.status === "error" ? state.retryCount + 1 : 0;
  return { status: "error", error, retryCount };
}

// usage example
let state: RequestState<User> = { status: "pending" };
console.log(renderState(state)); // Waiting for request...

state = startLoading(state);
console.log(renderState(state)); // Loading... 0%

state = updateProgress(state, 50);
console.log(renderState(state)); // Loading... 50%

state = complete(state, { id: 1, name: "Alice", email: "alice@example.com" });
console.log(renderState(state)); // Done! User: Alice (...)
```

### Rust Implementation

```rust
// Rust — HTTP request state management

use std::time::SystemTime;

// user data struct
#[derive(Debug)]
struct User {
    id: u32,
    name: String,
    email: String,
}

// state enum — data is embedded directly in each variant
#[derive(Debug)]
enum RequestState {
    Pending,
    Loading { progress: u8 },
    Success { data: User, timestamp: SystemTime },
    Error { message: String, retry_count: u32 },
}

impl RequestState {
    // return UI message based on state
    fn render(&self) -> String {
        match self {
            RequestState::Pending => {
                String::from("Waiting for request...")
            }
            RequestState::Loading { progress } => {
                format!("Loading... {}%", progress)
            }
            RequestState::Success { data, .. } => {
                format!("Done! User: {}", data.name)
            }
            RequestState::Error { message, retry_count } => {
                format!("Error: {} (retries: {})", message, retry_count)
            }
            // missing even one case causes a compile error!
        }
    }

    // state transition: Pending → Loading
    fn start_loading(self) -> Result<RequestState, String> {
        match self {
            RequestState::Pending => Ok(RequestState::Loading { progress: 0 }),
            other => Err(format!(
                "Can only transition to Loading from Pending (current: {:?})",
                other
            )),
        }
    }

    // state transition: Loading → Loading (update progress)
    fn update_progress(self, new_progress: u8) -> Result<RequestState, String> {
        match self {
            RequestState::Loading { .. } => {
                Ok(RequestState::Loading { progress: new_progress })
            }
            other => Err(format!(
                "Can only update progress from Loading state (current: {:?})",
                other
            )),
        }
    }

    // state transition: Loading → Success
    fn complete(self, data: User) -> Result<RequestState, String> {
        match self {
            RequestState::Loading { .. } => Ok(RequestState::Success {
                data,
                timestamp: SystemTime::now(),
            }),
            other => Err(format!(
                "Can only transition to Success from Loading (current: {:?})",
                other
            )),
        }
    }

    // state transition: transition to Error from any state
    fn fail(self, message: String) -> RequestState {
        let retry_count = match &self {
            RequestState::Error { retry_count, .. } => retry_count + 1,
            _ => 0,
        };
        RequestState::Error { message, retry_count }
    }
}

fn main() {
    // state machine usage
    let state = RequestState::Pending;
    println!("{}", state.render()); // Waiting for request...

    let state = state.start_loading().expect("state transition failed");
    println!("{}", state.render()); // Loading... 0%

    let state = state.update_progress(50).expect("state transition failed");
    println!("{}", state.render()); // Loading... 50%

    let user = User {
        id: 1,
        name: String::from("Alice"),
        email: String::from("alice@example.com"),
    };

    let state = state.complete(user).expect("state transition failed");
    println!("{}", state.render()); // Done! User: Alice

    // also test the error state
    let error_state = RequestState::Pending
        .start_loading()
        .unwrap()
        .fail(String::from("Network timeout"));
    println!("{}", error_state.render()); // Error: Network timeout (retries: 0)
}
```

### TypeScript vs Rust Implementation Comparison

| Item | TypeScript | Rust |
|------|-----------|------|
| State definition | discriminated union (requires kind field) | enum variant (data embedded directly) |
| Exhaustive check | manual `default: never` boilerplate | automatically enforced by compiler |
| Invalid transitions | runtime throw | expressed at type level with `Result<T, E>` |
| When a new state is added | easy to forget to update switch | compile error forces all match updates |
| Methods | separated into standalone functions | attached directly to enum via `impl` block |

---

## Summary

Rust's `enum` and `match` build on TypeScript's discriminated union and `switch`, but are far safer and more expressive.

**Key Points:**

1. **Rust enums are real types** — variants can carry data directly, and methods can be attached.

2. **match is exhaustive by default** — if any case is missing, the code won't compile. No need for `default: never` boilerplate.

3. **Option\<T\> is a safe replacement for null** — using `Option<T>` instead of `null` or `undefined` means the compiler forces you to handle the null case.

4. **if let is shorthand for match** — when you only care about one case, `if let` keeps the code concise.

5. **State machines are the ideal use case for enum and match** — safety of state transitions can be guaranteed at compile time.

If you've used discriminated union patterns in TypeScript, Rust's enum and match will feel like the language is properly supporting that pattern natively. Once you get used to it, going back to TypeScript will make the absence of exhaustive checking feel unsettling.

---

---

## Frontend Perspective Mapping

- UI state machine (loading/success/error) ↔ Rust's `enum` + `match`
- Managing state transitions with functions in React ↔ Rust encapsulates transitions by attaching methods directly to the enum
- Bugs from missing switch cases ↔ Rust blocks them at compile time with exhaustive match

---

The previous chapter covered basic syntax and type mappings.
The next chapter explores Rust's collections (`Vec`, `HashMap`) in comparison to TypeScript arrays and Maps.
