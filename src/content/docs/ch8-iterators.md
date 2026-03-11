---
title: "Ch.8 — Iterators & Closures"
description: "Array method chaining vs Rust iterators — the power of zero-cost abstractions"
---

If you enjoy writing `array.filter().map().reduce()` in TypeScript, Rust's iterators will feel very familiar. The syntax is a little different, but the concept is nearly identical. And thanks to **zero-cost abstractions**, Rust iterators never create intermediate arrays. Let's find out how that's possible.

---

## 1. Closures In Depth

### TypeScript Arrow Functions vs Rust Closures

Arrow functions are very familiar in TypeScript.

```typescript
const double = (x: number) => x * 2;
const greet = (name: string) => `Hello, ${name}!`;
```

Rust closures use the `|parameter| expression` syntax. Think of it as putting parameters inside `||`.

```rust
let double = |x: i32| x * 2;
let greet = |name: &str| format!("Hello, {}!", name);

println!("{}", double(5));   // 10
println!("{}", greet("Rust")); // Hello, Rust!
```

If you need multiple lines, wrap them in curly braces.

```rust
let process = |x: i32| {
    let doubled = x * 2;
    let added = doubled + 10;
    added // the last expression is the return value
};

println!("{}", process(5)); // 20
```

Rust closures have powerful type inference, so types can usually be omitted.

```rust
let numbers = vec![1, 2, 3, 4, 5];
let doubled: Vec<i32> = numbers.iter().map(|x| x * 2).collect();
// No need to write |x: &i32| (*x) * 2 — the compiler infers it
```

### Try It Out

```rust runnable
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];
    let sum: i32 = numbers.iter().map(|x| x * 2).sum();
    println!("sum = {}", sum);
}
```

---

### Environment Capture: move vs borrow

TypeScript arrow functions **always automatically** capture outer variables.

```typescript
const multiplier = 3;
const multiply = (x: number) => x * multiplier; // captures multiplier automatically
console.log(multiply(5)); // 15
```

Rust captures by **borrow** by default, but you can use the `move` keyword to transfer ownership into the closure when needed.

```rust
fn main() {
    let multiplier = 3;

    // default: capture by reference (borrow)
    let multiply = |x| x * multiplier;
    println!("{}", multiply(5)); // 15
    println!("{}", multiplier);  // multiplier is still usable

    // move: transfer ownership into the closure
    let name = String::from("Alice");
    let greet = move || format!("Hello, {}!", name);
    // println!("{}", name); // error! ownership of name has moved into the closure
    println!("{}", greet()); // Hello, Alice!
}
```

The most common scenario where `move` is essential is **threads**. Since a thread cannot guarantee the lifetime of values captured by a closure, ownership must be transferred.

```rust
use std::thread;

fn main() {
    let data = vec![1, 2, 3];

    // compile error without move
    let handle = thread::spawn(move || {
        println!("data in thread: {:?}", data);
    });

    handle.join().unwrap();
}
```

---

### FnOnce / FnMut / Fn Traits

Rust closures implement one of three traits depending on how they capture their environment. TypeScript has no such distinction, but the concept is understandable.

| Trait | Call count | Capture mode | TypeScript analogy |
|-------|-----------|-------------|-------------------|
| `FnOnce` | Once only | Ownership move | Single-use callback |
| `FnMut` | Multiple times (can mutate) | Mutable borrow | Stateful callback |
| `Fn` | Multiple times | Immutable borrow | Pure function |

```rust
fn call_once<F: FnOnce()>(f: F) {
    f(); // can only be called once
}

fn call_multiple<F: Fn()>(f: F) {
    f();
    f(); // can be called multiple times
}

fn main() {
    let name = String::from("Alice");

    // FnOnce: closure that consumes ownership
    let consume = || {
        let owned = name; // takes ownership of name
        println!("name: {}", owned);
    };
    call_once(consume);
    // call_once(consume); // error! already consumed

    // FnMut: closure that mutates internal state
    let mut count = 0;
    let mut increment = || {
        count += 1;
        println!("count: {}", count);
    };
    increment();
    increment();
    // count is now 2

    // Fn: closure that only reads
    let base = 10;
    let add_base = |x| x + base;
    println!("{}", add_base(5));  // 15
    println!("{}", add_base(20)); // 30
}
```

---

## 2. Iterator Basics

### The Iterator Trait and the next() Method

A Rust iterator is any type that implements the `Iterator` trait. The core is a single method: `next()`.

```rust
pub trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;
    // dozens of other methods are automatically implemented on top of next()
}
```

You can call `next()` directly.

```rust
fn main() {
    let numbers = vec![1, 2, 3];
    let mut iter = numbers.iter();

    println!("{:?}", iter.next()); // Some(1)
    println!("{:?}", iter.next()); // Some(2)
    println!("{:?}", iter.next()); // Some(3)
    println!("{:?}", iter.next()); // None
}
```

This is nearly identical in structure to TypeScript's iterator protocol.

```typescript
const numbers = [1, 2, 3];
const iter = numbers[Symbol.iterator]();

console.log(iter.next()); // { value: 1, done: false }
console.log(iter.next()); // { value: 2, done: false }
console.log(iter.next()); // { value: 3, done: false }
console.log(iter.next()); // { value: undefined, done: true }
```

---

### Differences Between iter() / into_iter() / iter_mut()

The three methods look similar but have important differences.

```rust
fn main() {
    let mut numbers = vec![1, 2, 3, 4, 5];

    // iter(): iterates by immutable reference (&T) — original is preserved
    for n in numbers.iter() {
        print!("{} ", n); // n: &i32
    }
    println!(); // numbers is still usable

    // iter_mut(): iterates by mutable reference (&mut T) — values can be modified
    for n in numbers.iter_mut() {
        *n *= 2; // n: &mut i32, dereference to modify value
    }
    println!("{:?}", numbers); // [2, 4, 6, 8, 10]

    // into_iter(): takes ownership (T) — original is consumed
    for n in numbers.into_iter() {
        print!("{} ", n); // n: i32 (owned)
    }
    // println!("{:?}", numbers); // error! numbers has already been consumed
}
```

### Try It Out

```rust runnable
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];
    let doubled: Vec<i32> = numbers.iter().map(|n| n * 2).collect();
    println!("{:?}", doubled);
}
```

| Method | Element type | Original usable? | Use case |
|--------|------------|-----------------|----------|
| `iter()` | `&T` | Yes | Read-only iteration |
| `iter_mut()` | `&mut T` | Yes (after modification) | Modifying values |
| `into_iter()` | `T` | No | Transfer ownership |

---

### Lazy Evaluation

TypeScript array methods use **eager evaluation** — each step creates a new array.

```typescript
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// each step creates a new array: [2,4,6,8,10] → [4,8] → [4]
const result = numbers
  .filter(x => x % 2 === 0) // new array: [2, 4, 6, 8, 10]
  .map(x => x * 2)          // new array: [4, 8, 12, 16, 20]
  .slice(0, 2);              // new array: [4, 8]

console.log(result); // [4, 8]
```

Rust iterators use **lazy evaluation** — nothing executes until a consuming adapter like `.collect()` is called.

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // nothing executes at this point
    let lazy_chain = numbers.iter()
        .filter(|&&x| x % 2 == 0)
        .map(|&x| x * 2)
        .take(2);

    // execution only happens when collect() is called
    let result: Vec<i32> = lazy_chain.collect();
    println!("{:?}", result); // [4, 8]
}
```

Thanks to lazy evaluation, no intermediate collections are created at all. Elements pass through the pipeline one at a time.

---

## 3. Iterator Adapters (1:1 Comparison with TypeScript Array Methods)

### map

```typescript
// TypeScript
const doubled = [1, 2, 3, 4, 5].map(x => x * 2);
// [2, 4, 6, 8, 10]
```

```rust
// Rust
let doubled: Vec<i32> = vec![1, 2, 3, 4, 5]
    .iter()
    .map(|&x| x * 2)
    .collect();
// [2, 4, 6, 8, 10]
```

### filter

```typescript
// TypeScript
const evens = [1, 2, 3, 4, 5].filter(x => x % 2 === 0);
// [2, 4]
```

```rust
// Rust
let evens: Vec<i32> = vec![1, 2, 3, 4, 5]
    .iter()
    .filter(|&&x| x % 2 == 0)
    .cloned()
    .collect();
// [2, 4]
```

### find

```typescript
// TypeScript
const found = [1, 2, 3, 4, 5].find(x => x > 3);
// Some: 4, None: undefined
```

```rust
// Rust
let found = vec![1, 2, 3, 4, 5]
    .iter()
    .find(|&&x| x > 3);
// Some(&4) or None
println!("{:?}", found); // Some(4)
```

### any / all

```typescript
// TypeScript
const hasEven = [1, 2, 3].some(x => x % 2 === 0);   // true
const allPositive = [1, 2, 3].every(x => x > 0);      // true
```

```rust
// Rust
let has_even = vec![1, 2, 3].iter().any(|&x| x % 2 == 0); // true
let all_positive = vec![1, 2, 3].iter().all(|&x| x > 0);  // true
```

### take / skip

```typescript
// TypeScript
const first3 = [1, 2, 3, 4, 5].slice(0, 3); // [1, 2, 3]
const after2 = [1, 2, 3, 4, 5].slice(2);     // [3, 4, 5]
```

```rust
// Rust
let first3: Vec<i32> = vec![1, 2, 3, 4, 5]
    .iter()
    .take(3)
    .cloned()
    .collect(); // [1, 2, 3]

let after2: Vec<i32> = vec![1, 2, 3, 4, 5]
    .iter()
    .skip(2)
    .cloned()
    .collect(); // [3, 4, 5]
```

### enumerate

```typescript
// TypeScript
const arr = ["a", "b", "c"];
arr.forEach((item, index) => {
    console.log(`${index}: ${item}`);
});
// 0: a, 1: b, 2: c
```

```rust
// Rust
let arr = vec!["a", "b", "c"];
for (index, item) in arr.iter().enumerate() {
    println!("{}: {}", index, item);
}
// 0: a, 1: b, 2: c
```

### zip

```typescript
// TypeScript (no built-in zip, must implement manually)
const names = ["Alice", "Bob", "Charlie"];
const scores = [95, 87, 92];
const paired = names.map((name, i) => [name, scores[i]]);
// [["Alice", 95], ["Bob", 87], ["Charlie", 92]]
```

```rust
// Rust
let names = vec!["Alice", "Bob", "Charlie"];
let scores = vec![95, 87, 92];
let paired: Vec<(&&str, &i32)> = names.iter().zip(scores.iter()).collect();
// [("Alice", 95), ("Bob", 87), ("Charlie", 92)]

for (name, score) in names.iter().zip(scores.iter()) {
    println!("{}: {}", name, score);
}
```

### flat_map

```typescript
// TypeScript
const sentences = ["hello world", "foo bar"];
const words = sentences.flatMap(s => s.split(" "));
// ["hello", "world", "foo", "bar"]
```

```rust
// Rust
let sentences = vec!["hello world", "foo bar"];
let words: Vec<&str> = sentences.iter()
    .flat_map(|s| s.split(" "))
    .collect();
// ["hello", "world", "foo", "bar"]
```

---

## 4. Consuming Adapters (collect, sum, count, fold)

Iterator adapters return new iterators, but **consuming adapters** consume the iterator and return a final value.

### collect()

`collect()` converts an iterator into a collection. You must specify what type to collect into.

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // specify with type annotation
    let doubled: Vec<i32> = numbers.iter().map(|&x| x * 2).collect();

    // specify with turbofish syntax
    let doubled = numbers.iter().map(|&x| x * 2).collect::<Vec<i32>>();

    // specify partially with a wildcard
    let doubled = numbers.iter().map(|&x| x * 2).collect::<Vec<_>>();

    println!("{:?}", doubled); // [2, 4, 6, 8, 10]

    // collect into a HashMap
    use std::collections::HashMap;
    let map: HashMap<&str, i32> = vec![("a", 1), ("b", 2), ("c", 3)]
        .into_iter()
        .collect();
    println!("{:?}", map); // {"a": 1, "b": 2, "c": 3}
}
```

### sum() / count()

```typescript
// TypeScript
const total = [1, 2, 3, 4, 5].reduce((acc, x) => acc + x, 0); // 15
const count = [1, 2, 3].length; // 3
```

```rust
// Rust
let total: i32 = vec![1, 2, 3, 4, 5].iter().sum(); // 15
let count = vec![1, 2, 3].iter().count();           // 3

// conditional sum
let even_sum: i32 = vec![1, 2, 3, 4, 5]
    .iter()
    .filter(|&&x| x % 2 == 0)
    .sum();
println!("{}", even_sum); // 6 (2 + 4)
```

### fold() — Compared to TypeScript reduce

```typescript
// TypeScript reduce
const numbers = [1, 2, 3, 4, 5];
const product = numbers.reduce((acc, x) => acc * x, 1); // 120

// string concatenation
const joined = ["a", "b", "c"].reduce((acc, x) => acc + x, ""); // "abc"
```

```rust
// Rust fold
let numbers = vec![1, 2, 3, 4, 5];
let product = numbers.iter().fold(1, |acc, &x| acc * x);
println!("{}", product); // 120

// string concatenation
let joined = vec!["a", "b", "c"]
    .iter()
    .fold(String::new(), |mut acc, &x| {
        acc.push_str(x);
        acc
    });
println!("{}", joined); // "abc"

// more idiomatic way
let joined = vec!["a", "b", "c"].join("");
println!("{}", joined); // "abc"
```

`fold` is almost identical to `reduce`, but you must always provide an initial value (`init`). TypeScript's `reduce` can be called without an initial value, but risks an error on an empty array. Rust's `fold` is always safe.

---

## 5. Iterator Chaining in Practice

Let's compare patterns commonly seen in real code.

### Example: Filtering a User List

```typescript
// TypeScript
interface User {
  name: string;
  age: number;
  active: boolean;
}

const users: User[] = [
  { name: "Alice", age: 28, active: true },
  { name: "Bob", age: 17, active: true },
  { name: "Charlie", age: 32, active: false },
  { name: "Diana", age: 25, active: true },
  { name: "Eve", age: 22, active: true },
  { name: "Frank", age: 19, active: true },
];

// among active users, adults only, sorted by name, extract top 3 names
const result = users
  .filter(u => u.active && u.age >= 18)
  .sort((a, b) => a.name.localeCompare(b.name))
  .slice(0, 3)
  .map(u => u.name);

console.log(result); // ["Alice", "Diana", "Eve"]
```

```rust
// Rust
#[derive(Debug)]
struct User {
    name: String,
    age: u32,
    active: bool,
}

fn main() {
    let mut users = vec![
        User { name: "Alice".to_string(), age: 28, active: true },
        User { name: "Bob".to_string(), age: 17, active: true },
        User { name: "Charlie".to_string(), age: 32, active: false },
        User { name: "Diana".to_string(), age: 25, active: true },
        User { name: "Eve".to_string(), age: 22, active: true },
        User { name: "Frank".to_string(), age: 19, active: true },
    ];

    // sort first (sort happens outside the iterator chain)
    users.sort_by(|a, b| a.name.cmp(&b.name));

    // extract top 3 names from active adult users
    let result: Vec<&str> = users.iter()
        .filter(|u| u.active && u.age >= 18)
        .take(3)
        .map(|u| u.name.as_str())
        .collect();

    println!("{:?}", result); // ["Alice", "Diana", "Eve"]
}
```

### Performance Comparison: Why No Intermediate Vecs Are Created

TypeScript's array method chains allocate a new array on the heap at every step.

```
TypeScript chaining:
[1..100] → filter → [new array: 50 even numbers] → map → [new array: 50 transformed] → slice → [new array: 5 items]
            ↑ heap alloc             ↑ heap alloc                                          ↑ heap alloc
```

Rust iterator chains pass elements through the pipeline one at a time.

```
Rust iterator chaining:
element 1 → filter? No  → discarded
element 2 → filter? Yes → map → take? count=1 → added to collect
element 3 → filter? No  → discarded
element 4 → filter? Yes → map → take? count=2 → added to collect
...
```

```rust
fn main() {
    // from 100,000 numbers, double the even ones, take the top 5
    let result: Vec<i32> = (1..=100_000)
        .filter(|x| x % 2 == 0)
        .map(|x| x * 2)
        .take(5)
        .collect();

    // no intermediate arrays! memory used is only for the final 5 results
    println!("{:?}", result); // [4, 8, 12, 16, 20]
}
```

The moment `take(5)` collects 5 items, the entire iterator terminates immediately. The remaining 99,990 elements are never even evaluated. This is the power of lazy evaluation.

---

## 6. Building Custom Iterators

Let's implement the `Iterator` trait ourselves. We'll create a Fibonacci sequence iterator.

```typescript
// TypeScript — implemented with a generator
function* fibonacci(): Generator<number> {
    let [a, b] = [0, 1];
    while (true) {
        yield a;
        [a, b] = [b, a + b];
    }
}

const fib = fibonacci();
const first10 = Array.from({ length: 10 }, () => fib.next().value);
console.log(first10); // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

```rust
// Rust — directly implementing the Iterator trait
struct Fibonacci {
    a: u64,
    b: u64,
}

impl Fibonacci {
    fn new() -> Self {
        Fibonacci { a: 0, b: 1 }
    }
}

impl Iterator for Fibonacci {
    type Item = u64;

    fn next(&mut self) -> Option<Self::Item> {
        let next = self.a;
        let new_b = self.a + self.b;
        self.a = self.b;
        self.b = new_b;
        Some(next) // infinite iterator: never returns None
    }
}

fn main() {
    let fib = Fibonacci::new();

    // since Iterator is implemented, all adapters are immediately available!
    let first10: Vec<u64> = fib.take(10).collect();
    println!("{:?}", first10); // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

    // even Fibonacci numbers under 100
    let even_fibs: Vec<u64> = Fibonacci::new()
        .take_while(|&x| x < 100)
        .filter(|x| x % 2 == 0)
        .collect();
    println!("{:?}", even_fibs); // [0, 2, 8, 34]
}
```

Once you implement just `next()` from the `Iterator` trait, dozens of methods including `map`, `filter`, `take`, and `fold` are provided automatically. This is the power of Rust's trait system.

---

## Summary

| Concept | TypeScript | Rust |
|---------|-----------|------|
| Closure syntax | `(x) => x + 1` | `\|x\| x + 1` |
| Environment capture | Automatic (always) | borrow by default, ownership transfer with `move` |
| Closure traits | None | `Fn` / `FnMut` / `FnOnce` |
| Evaluation style | Eager | Lazy |
| Intermediate collections | Created at each step | Never created |
| Consuming adapters | `.reduce()` etc. | `.collect()`, `.fold()`, `.sum()` etc. |
| Custom iterators | `Symbol.iterator`, generators | Implement the `Iterator` trait |

Rust iterators may feel slightly unfamiliar in syntax compared to TypeScript array methods, but the underlying principle is the same. And thanks to zero-cost abstractions, they deliver the same performance as explicit `for` loops. Combining high-level expressiveness with low-level performance is the essence of Rust iterators.

---

## Chapter Navigation

After seeing collections and ownership in the previous chapter, this chapter showed how to work with those collections efficiently. The next chapter expands into the trait system.
