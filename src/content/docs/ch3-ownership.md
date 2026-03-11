---
title: "Ch.4 — Ownership & Borrowing"
description: "Stack vs heap, move semantics, borrow checker, lifetimes — why Rust's ownership rules exist and how they map to JavaScript's garbage collector"
---

When first learning Rust, this is the part where most people get stuck. Many give up after battling the Borrow Checker. But these concepts aren't "Rust being weird" — they're a systematic approach to managing memory safely. Let's walk through it step by step.

---

## 3-1. Memory Basics: Stack, Heap, and GC

To understand Rust's Ownership, you first need to understand how memory works. As a JavaScript developer, this may be something you've never had to think about directly — but let's cover it here.

### Stack: Fast and Predictable Memory

The stack is like a **pile of books**. You add books on top (push) and take from the top (pop). The order is clear.

```
On function call:
┌─────────────────┐
│   add(3, 5)     │  ← top: currently executing function
│   main()        │
└─────────────────┘

When add() finishes:
┌─────────────────┐
│   main()        │  ← add() has been removed from the stack
└─────────────────┘
```

- Size must be known at **compile time**
- Very fast (CPU cache-friendly)
- Memory is automatically freed when a function returns
- Primitive types like `i32`, `f64`, `bool` are stored on the stack

### Heap: Flexible but Requires Management

The heap is like a **large warehouse**. You borrow space when you need it (allocate), and must return it when you're done (free).

```
Heap memory:
┌────────────────────────────────────┐
│  [In use: String "hello"]          │
│  [Empty]                           │
│  [In use: Vec<User> ...]           │
│  [Empty]                           │
└────────────────────────────────────┘
```

- Size can be determined at runtime
- Slower than the stack (allocation overhead)
- Dynamically-sized types like `String`, `Vec<T>`, `Box<T>` are stored on the heap
- **If not freed, memory leaks**

### JavaScript/TypeScript: GC as the Warehouse Manager

In JavaScript, you don't have to manually free memory. The **Garbage Collector (GC)** periodically scans and automatically reclaims memory that "no one references anymore."

```
World without GC (C/C++):
  Borrow warehouse → do work → manually return
  Forget to return? → memory leak
  Use already-returned space again? → bug (use-after-free)

World with GC (JavaScript):
  Borrow warehouse → do work → just leave it
  GC periodically cleans up → convenient, but...
  Brief pause during cleanup (GC pause)
  Cleanup timing is unpredictable
```

### Rust: Compiler as the Warehouse Manager

Rust has neither GC nor manual memory management. Instead, the **compiler checks Ownership rules** and determines at build time when each piece of memory should be freed.

```
Ownership world (Rust):
  Borrow warehouse → an owner is assigned
  When the owner goes out of scope → automatically returned (drop)
  Compiler checks all of this
  No GC pause, no memory leaks
```

```rust
fn main() {
    let s = String::from("hello"); // allocate "hello" on heap, s is the owner
    println!("{}", s);
    // when main() ends, s goes out of scope → drop() is called automatically → memory freed
}
```

---

## 3-2. The 3 Rules of Ownership

Rust's [Ownership](/glossary/#메모리--소유권) system is built on exactly three rules.

### Rule 1: Every value has an owner

```rust
let s = String::from("hello"); // s is the owner of "hello"
```

### Rule 2: There can only be one owner at a time

```typescript
// TypeScript — copying is free
let a = "hello";
let b = a;       // both a and b point to "hello"
console.log(a);  // OK
console.log(b);  // OK
```

```rust
// Rust — ownership is transferred (move)
let a = String::from("hello");
let b = a;       // ownership of "hello" is moved from a to b
// println!("{}", a); // compile error! a is no longer the owner
println!("{}", b);   // OK
```

This is the first case of "it works in JS but not in Rust."

In Rust, `let b = a;` is not a simple copy. The **ownership of the heap value moves from a to b**. After that, a is no longer valid.

> Why does this happen? If both a and b pointed to the same heap memory, they would both try to free the same memory when going out of scope — a **double free** bug. Rust eliminates this at the root by enforcing single ownership.

Primitive types stored on the stack (`i32`, `f64`, `bool`, `char`) are cheap to copy, so **[Copy](/glossary/#clone-vs-copy)** happens instead of Move.

```rust
let x: i32 = 5;
let y = x;       // i32 is Copy — both x and y are valid
println!("{} {}", x, y); // OK
```

### Rule 3: When the owner goes out of scope, the value is dropped

```rust
fn main() {
    {
        let s = String::from("world"); // s is the owner
        println!("{}", s);
    } // ← s goes out of scope at this closing brace → auto drop → memory freed

    // println!("{}", s); // compile error: s has already been dropped
}
```

### Passing Values to Functions

```typescript
// TypeScript — can still use original after passing to function
function printUser(user: User): void {
  console.log(user.name);
}

const user = { id: 1, name: "Alice" };
printUser(user);
console.log(user.name); // still usable
```

```rust
// Rust — ownership moves into the function
fn print_user(user: User) {    // ownership of user moves into this function
    println!("{}", user.name);
} // user is dropped when function ends

let user = User { id: 1, name: "Alice".to_string() };
print_user(user);            // ownership transferred
// println!("{}", user.name); // compile error! ownership is gone
```

The solution to this problem is **Borrowing**, covered in the next section.

---

## 3-3. Borrowing and References

**Borrowing** is the concept of letting someone use a value temporarily without transferring ownership. You use `&` (ampersand) to create a reference.

### Immutable Reference: `&T`

```typescript
// TypeScript — objects are passed by reference (by default)
function printUser(user: User): void {
  console.log(user.name);
  // modifying user here would also modify the original (it's a reference)
}

const user = { id: 1, name: "Alice" };
printUser(user);
console.log(user.name); // OK
```

```rust
// Rust — explicitly pass a reference (&)
fn print_user(user: &User) {  // receives a reference, not ownership
    println!("{}", user.name);
    // user.name = "Bob".to_string(); // error: cannot modify through an immutable reference
}

let user = User { id: 1, name: "Alice".to_string() };
print_user(&user);           // &user: passing a reference
println!("{}", user.name);   // OK: ownership still belongs to user
```

Multiple immutable references can exist **at the same time**.

```rust
let s = String::from("hello");
let r1 = &s;
let r2 = &s;
let r3 = &s;
println!("{} {} {}", r1, r2, r3); // OK: multiple immutable references are fine
```

### Mutable Reference: `&mut T`

```typescript
// TypeScript — modifying an object inside a function
function updateUser(user: User): void {
  user.name = "Bob"; // original is also modified
}

const user = { id: 1, name: "Alice" };
updateUser(user);
console.log(user.name); // "Bob"
```

```rust
// Rust — explicit mutable reference
fn update_user(user: &mut User) {
    user.name = "Bob".to_string(); // OK: can modify through a mutable reference
}

let mut user = User { id: 1, name: "Alice".to_string() }; // variable must also be mut
update_user(&mut user);  // &mut: passing a mutable reference
println!("{}", user.name); // "Bob"
```

Only **one** mutable reference can exist at a time.

```rust
let mut s = String::from("hello");

let r1 = &mut s;
// let r2 = &mut s; // compile error! only one mutable reference at a time

r1.push_str(" world");
println!("{}", r1); // OK
```

### Why These Restrictions? — Preventing Data Races

```
What if multiple mutable references existed simultaneously?
 → Thread A and Thread B both modify the same value at the same time
 → Unpredictable result (data race)
 → The most painful bug in multi-threaded programs

Rust's rules:
 → Only one mutable reference at a time
 → Immutable and mutable references cannot coexist
 → Data races are eliminated at compile time
```

| Situation | TypeScript | Rust |
|------|-----------|------|
| Read-only reference | No restriction | `&T` — multiple allowed |
| Mutable reference | No restriction | `&mut T` — only one at a time |
| Mixed immutable + mutable | No restriction | Cannot coexist |
| Original validity | Implicit | Guaranteed by compiler |

### Preventing Dangling References

```typescript
// TypeScript — this situation can occur at runtime
function getRef(): { value: string } {
  const obj = { value: "hello" };
  return obj; // return a reference
}
// TypeScript/JS: GC keeps obj alive
```

```rust
// Rust — prevented at compile time
fn get_ref() -> &String {
    let s = String::from("hello");
    &s  // compile error! s is dropped at end of this scope, cannot return a reference to it
}

// Solution: return ownership
fn get_string() -> String {
    let s = String::from("hello");
    s  // transfer ownership (OK)
}
```

---

## 3-4. A Taste of Lifetimes

[Lifetimes](/glossary/#메모리--소유권) are the concept most people find hardest in Rust. Before going deep, let's just grasp the core idea.

### What Is a Lifetime?

A lifetime is **the period during which a reference is valid**. The Rust compiler tracks the validity of every reference to prevent situations where you reference an already-dropped value.

```
Analogy: borrowing a library book

Book (value) → owner: the library
Reader (function) → reference: borrowing the book
Lifetime: loan period

Rules:
- The book cannot be discarded while it is on loan
- Book must be returned when the loan period ends
- Compiler = librarian (enforces loan rules)
```

### When Explicit Lifetimes Are Needed

The compiler infers lifetimes in most cases. But when multiple references are involved, explicit annotation is needed.

```rust
// This function: returns the longer of two strings
// The compiler doesn't know which reference's lifetime the return value shares
fn longest(x: &str, y: &str) -> &str { // compile error
    if x.len() > y.len() { x } else { y }
}
```

```rust
// Explicitly annotate lifetime parameter 'a
// "the lifetime of the return reference is the shorter of x and y"
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

fn main() {
    let s1 = String::from("long string");
    let result;
    {
        let s2 = String::from("xyz");
        result = longest(s1.as_str(), s2.as_str());
        println!("{}", result); // OK: s2 is still alive
    }
    // println!("{}", result); // error: s2 has been dropped, so result is invalid
}
```

### Comparison with TypeScript

TypeScript has no concept of Lifetimes. JavaScript's GC tracks reference relationships and keeps objects that are "still referenced" in memory.

```typescript
// TypeScript — GC manages reference lifetimes
function longest(a: string, b: string): string {
  return a.length > b.length ? a : b;
}
// GC keeps the returned string in memory as long as it is referenced
// Developer doesn't need to worry about it
```

| Concept | TypeScript | Rust |
|------|-----------|------|
| Reference lifetime management | GC (automatic) | Lifetime (compile time) |
| Explicit annotation needed | No | Rarely, sometimes needed |
| Dangling references | Prevented by GC | Prevented by compiler |
| Runtime cost | GC overhead | None (zero-cost) |

### Lifetimes Are Hard at First

To be honest, Lifetimes are the point where most people learning Rust get stuck. You'll spend a lot of time fighting compiler error messages at first.

There's good news on two fronts:

1. **You'll rarely need to write lifetimes explicitly in practice.** The compiler infers them most of the time.
2. **The compiler error messages are very helpful.** They explain which lifetime is problematic and how to fix it.

```
error[E0106]: missing lifetime specifier
  --> src/main.rs:1:33
   |
1  | fn longest(x: &str, y: &str) -> &str {
   |               ----     ----     ^ expected named lifetime parameter
   |
help: consider introducing a named lifetime parameter
   |
1  | fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
   |           ++++     ++          ++          ++
```

The compiler even suggests the fix. It's like having a reliable pair programmer by your side.

---

## Ownership Summary

Rust's Ownership system feels frustrating at first. You have to unlearn the habit of freely passing and mutating references like in JS. But thanks to these rules, Rust:

- Guarantees **memory safety** with no runtime cost
- Prevents **data races** at compile time
- Eliminates classic bugs like **null pointer dereferences**, **use-after-free**, and **double-free**

When you're exhausted from fighting the Borrow Checker, remember: these rules aren't trying to make your life difficult — they're making your code safe. Once you get used to it, you'll find it hard to go back to languages without a Borrow Checker.

---

## Frontend Perspective Mapping

- Directly mutating state in React causes bugs → Rust's `&mut` rules catch those bugs at compile time.
- Components referencing the same object leads to unpredictable behavior → Rust enforces "one mutable owner at a time."
- You need to be conscious of copy vs reference when passing state → Rust's move/borrow maps directly to this.

## Summary

- Ownership makes it explicit "who is responsible for this value."
- There can only be one owner at a time.
- References are borrows; violating the rules causes a compile failure.
- `&mut` is powerful but restricted for concurrency safety.
- This model prevents data races and use-after-free.

## Key Code

```rust runnable
fn main() {
    let s = String::from("hello");
    let len = s.len();
    println!("len = {}", len);
}
```

## Common Mistakes

- Getting confused between move and copy, surprised when a value "disappears."
- Trying to use `&mut` in multiple places at the same time and hitting a wall.
- Treating lifetime issues as purely a "syntax" problem.

## Exercises

1. Write code that passes a `String` to a function and tries to use it again afterward — then see the compile error.
2. Change the same code to use a `&str` reference and resolve the error.

## Chapter Connections

The previous chapter covered basic syntax.
The next chapter takes a deeper look at control flow patterns like enum/match.
