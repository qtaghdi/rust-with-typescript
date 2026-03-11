---
title: "Ch.1 — Introduction"
description: "Why TypeScript developers should learn Rust"
---

You're already doing great work with TypeScript — so why bother learning Rust?

Honestly? You don't have to. You can build excellent services with Node.js and TypeScript, and countless production servers are running just fine right now. But have you ever run into situations like these?

## Things Every TypeScript Developer Has Experienced

### "Why is this undefined?"

```typescript
interface User {
  profile?: {
    address?: {
      city?: string;
    };
  };
}

const user: User = fetchUser(); // something goes wrong at runtime
console.log(user.profile?.address?.city ?? "Unknown"); // types look fine, but...
```

TypeScript checks types at compile time, but **it makes no guarantees about what actually happens at runtime.** Sneak in an `any`, or have an external API return data that doesn't match the spec, and it all falls apart.

### "How much memory is this thing using?"

Node.js servers tend to creep up in memory usage over time. The Garbage Collector decides when to clean up, and every time it runs, the server pauses briefly — those GC pauses are often the culprit behind P99 latency spikes.

### "I wish just this one part were faster..."

CPU-intensive work like image processing, encryption, or parsing hits a wall in TypeScript. You end up reaching for `worker_threads`, strapping on a C++ native addon, or making HTTP requests to a Python service — awkward architectures all around.

---

## What Rust Solves

Rust addresses these problems **at the language design level**.

### 1. It catches almost everything at compile time

TypeScript's type checking verifies "this value should be a string" at compile time. Rust goes a step further — **memory access, null dereferences, and data races** are all checked at compile time too. Bugs that would only blow up at runtime get caught during the build.

```rust
// This code won't even compile
let x: Option<String> = None;
println!("{}", x); // compile error: can't print an Option directly
                   // the compiler asks: "what do you want to do if it's None?"
```

### 2. No GC — and still no memory leaks

Rust manages memory without a Garbage Collector. Instead, its unique **Ownership** system lets the compiler automatically insert memory allocation and deallocation code. No GC pauses means predictable latency and stable memory usage.

### 3. C/C++-level performance, modern syntax

Rust pursues "zero-cost abstractions." Writing high-level code still compiles down to optimized machine code. That's why Cloudflare Workers, parts of AWS Lambda, the Linux kernel, and Android core components are being written in Rust.

---

## Why Rust Is a Natural Fit for TypeScript Developers

If you write TypeScript, you already understand the value of the safety net that types provide. If you're the person who pushes back when teammates want to use `any`, and you prefer compile-time errors over runtime ones, **Rust's strictness won't feel alien.** It might even feel like the fully realized version of what TypeScript was trying to be.

There is a learning curve, of course. Ownership and the Borrow Checker will make you feel like you're fighting the compiler at first. But once you win that fight, you can ship code with genuine confidence that it's safe.

---

## What This Book Covers

This is not a Rust primer. It's **a Rust context guide for TypeScript developers**.

- TypeScript and Rust code are placed side by side so you can see "this is that"
- It directly answers the question "why does this work in JS but not in Rust?"
- Practical examples cover HTTP APIs, JSON handling, and error handling

If you're a working TypeScript developer who wants to pick up Rust, this book will make that journey a little less painful.

Let's get started.

---

## Summary

- TypeScript is only safe at compile time — at runtime, it's still JavaScript.
- Rust blocks memory and concurrency errors at compile time.
- Safe memory management is possible without a GC.
- Rust shines wherever you need performance.
- Learning Rust is fundamentally about shifting how you think, not just learning syntax.

## Core Code

```rust runnable
fn main() {
    let message = "Rust guarantees more things at compile time.";
    println!("{}", message);
}
```

## Common Mistakes

- Treating Rust as a superset of TypeScript.
- Missing the premise that "if it compiles, it's safe."
- Viewing Ownership as a syntax problem rather than understanding the philosophy.

## Exercises

1. Think of one example from TypeScript where you've seen a runtime error.
2. Write out in plain language what compile-time error Rust would give you for the same situation.

## Preview of the Next Chapter

This chapter laid out the reasons for choosing Rust.
The next chapter systematically compares the mental models of TypeScript and Rust.
