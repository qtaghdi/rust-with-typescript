---
title: "Ch.2 — Mental Models"
description: "GC vs Ownership, compile-time safety vs runtime checks — the mental model shift every TypeScript developer needs before learning Rust syntax"
---

When learning Rust, the first thing you need to change isn't the syntax. It's **how you think**.

TypeScript and Rust are both strongly typed languages, but the way they achieve safety — and the philosophy behind it — are fundamentally different. Understanding this difference makes Rust's "strange" constraints feel logical rather than arbitrary.

---

## Axis 1: Runtime Safety vs. Compile-time Safety

### TypeScript's approach: best effort, but runtime is JavaScript

TypeScript is JavaScript with types layered on top. When you compile, you get a `.js` file, and the actual execution is handled by a JavaScript engine. That means TypeScript's type information disappears at runtime.

```typescript
// TypeScript — compiles fine
function greet(name: string): string {
  return `Hello, ${name}!`;
}

// What if it's called like this at runtime? → it just runs
greet(42 as any); // prints "Hello, 42!"
```

TypeScript lets you bypass the type system with `as any` or type assertions. External data (API responses, localStorage, etc.) can't have its real type verified until runtime.

### Rust's approach: if it compiles, the runtime is guaranteed

Rust's compiler checks much more aggressively. Once compilation succeeds, memory safety, no null dereferences, and no data races are **guaranteed**.

```rust
// Rust — if types don't match, it won't compile at all
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

greet(42); // compile error: expected `&str`, found integer
           // there is no "workaround" (except unsafe blocks)
```

| Aspect | TypeScript | Rust |
|--------|-----------|------|
| Type checking | Compile time (partial) | Compile time (comprehensive) |
| Runtime type info | Erased (type erasure) | None (zero-cost) |
| Can bypass? | Yes, via `any` or type assertions | `unsafe` block (intentionally difficult) |
| Runtime errors possible | Yes | Extremely limited |

---

## Axis 2: GC vs. Ownership

### TypeScript/JavaScript's approach: the Garbage Collector handles it

In JavaScript, you don't think about memory. Allocate a variable, and when you're done with it, the GC eventually cleans it up.

```typescript
// TypeScript — memory? don't worry about it
function createUsers(count: number): User[] {
  const users: User[] = [];
  for (let i = 0; i < count; i++) {
    users.push({ id: i, name: `User ${i}` }); // where's the memory allocated? doesn't matter
  }
  return users; // the GC will clean it up eventually
}
```

Convenient, but there are trade-offs:
- **GC pauses**: the program briefly stops when GC runs (a common cause of P99 latency spikes)
- **Unpredictable**: developers can't control when memory is freed
- **Overhead**: GC itself consumes CPU and memory

### Rust's approach: the compiler manages memory via Ownership

Rust has no GC. Instead, the **[Ownership](/glossary/#메모리--소유권)** system lets the compiler determine at build time exactly when memory should be freed, and automatically inserts that deallocation code.

```rust
// Rust — the compiler automatically inserts memory deallocation code
fn create_users(count: usize) -> Vec<User> {
    let mut users = Vec::new(); // allocate memory on the heap
    for i in 0..count {
        users.push(User { id: i, name: format!("User {}", i) });
    }
    users // ownership is transferred to the caller
} // when this block ends, users' memory is freed (unless ownership was transferred)
```

No GC pauses means stable latency. You can see exactly when memory gets freed just by reading the code.

| Aspect | TypeScript (GC) | Rust (Ownership) |
|--------|----------------|-----------------|
| When memory is freed | Whenever GC decides | Immediately at scope end |
| Developer burden | None | Moderate (working with the Borrow Checker) |
| Runtime overhead | GC cost | None |
| Memory leaks | Possible (if references are held) | Nearly impossible |
| Latency predictability | Unstable due to GC pauses | Stable |

---

## Axis 3: Dynamic Feel vs. Zero-cost Abstractions

### TypeScript's approach: convenience and flexibility

TypeScript maximizes JavaScript's flexibility while adding types. It has an expressive type system with union types, conditional types, template literal types, and more.

```typescript
// TypeScript — flexible type system
type Status = "pending" | "active" | "inactive";
type ApiResponse<T> = {
  data: T;
  status: Status;
  timestamp: number;
};

// convenience features: optional properties, default values, etc.
function createResponse<T>(data: T, status: Status = "active"): ApiResponse<T> {
  return { data, status, timestamp: Date.now() };
}
```

But these abstractions run at runtime too. Generic functions execute without type information at runtime, and some abstractions carry a performance cost.

### Rust's approach: abstractions with no runtime cost

Rust's "zero-cost abstractions" mean that writing high-level code produces the same compiled output as manually optimized low-level code.

```rust
// Rust — high-level code with no runtime cost
#[derive(Debug, Serialize)]
struct ApiResponse<T> {
    data: T,
    status: Status,
    timestamp: u64,
}

// Generic function: specialized per type at compile time (monomorphization)
// → no runtime type lookups, no dynamic dispatch
fn create_response<T>(data: T, status: Status) -> ApiResponse<T> {
    ApiResponse {
        data,
        status,
        timestamp: current_timestamp(),
    }
}
```

Rust's iterator chains produce the same assembly as C-style for loops. You can use abstractions freely without worrying about performance.

---

## Summary: The Core Philosophy of Each Language

```
TypeScript:
"We need to be able to build things quickly.
 Put up a safety net with types,
 and catch problems at runtime if needed."

Rust:
"If the build passes, it should work correctly.
 Runtime errors are unacceptable.
 Sacrificing performance is also unacceptable."
```

Neither philosophy is wrong. TypeScript excels at development speed and has a massive ecosystem; Rust excels at safety and performance. Choose based on what you need.

Starting in the next chapter, we'll compare specific syntax side by side. Once you see how familiar TypeScript concepts are expressed in Rust, it'll feel more approachable than you might expect.

---

## Frontend Perspective Mapping

- Updating React state is fundamentally a question of "who owns this data?" → this maps directly to Rust's Ownership and mutable reference rules.
- Handling UI state updates after async operations means branching on "success/failure" → similar to Rust's [`Result<T, E>`](/glossary/#에러-처리) model.
- Keeping state immutable reduces re-render bugs → aligns with Rust's default immutable model.

## Summary

- TypeScript's runtime is JavaScript, which limits type safety.
- Rust strongly guarantees runtime safety once compilation passes.
- GC is convenient but introduces unpredictable latency.
- Ownership is how Rust achieves safety without a GC.
- Rust's abstractions carry no performance cost.

## Core Code

```rust runnable
fn main() {
    let name = "Rust";
    println!("Hello, {}!", name);
}
```

## Common Mistakes

- Trying to bypass Rust the same way you'd use `as any` in TypeScript.
- Assuming that any language without a GC must be difficult.
- Misreading Rust code under the assumption that "abstraction = slow."

## Exercises

1. Think of a performance bottleneck you've encountered in a React app.
2. Classify whether that bottleneck was rooted in runtime execution, memory, or concurrency.

## Chapter Connections

The previous chapter covered the reasons to learn Rust.
The next chapter compares TypeScript and Rust syntax side by side.
