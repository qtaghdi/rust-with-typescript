---
title: "Ch.7 — Collections"
description: "Vec, HashMap, String vs TypeScript Array/Map/string — how ownership interacts with collections, when to clone vs borrow"
---

If you've worked freely with arrays, strings, and Maps in TypeScript, Rust has similar collection types. The behavior differs somewhat due to the ownership system, though. In this chapter, we compare Rust's three core collections from the perspective of a TypeScript developer.

---

## 1. `Vec<T>` — Compared to TypeScript Array

`Vec<T>` is the type most similar to TypeScript's `Array<T>`. It stores data on the heap and can grow or shrink dynamically.

### Creating

```typescript
// TypeScript
const nums: number[] = [];
const nums2 = [1, 2, 3];
const nums3 = Array.from({ length: 5 }, (_, i) => i * 2); // [0, 2, 4, 6, 8]
```

```rust
// Rust
let nums: Vec<i32> = Vec::new();       // empty vector
let nums2 = vec![1, 2, 3];             // initialize with the vec! macro
let nums3: Vec<i32> = (0..5).map(|i| i * 2).collect(); // [0, 2, 4, 6, 8]
```

The `vec![]` macro is just as convenient as TypeScript's array literal `[]`. `Vec::new()` creates an empty vector; a type annotation is required when the type cannot be inferred later.

### Adding / Removing

```typescript
// TypeScript
const arr = [1, 2, 3];
arr.push(4);          // add to end
arr.pop();            // remove from end
arr.splice(1, 1);     // remove 1 element at index 1
```

```rust
// Rust
let mut arr = vec![1, 2, 3];
arr.push(4);          // add to end
arr.pop();            // remove from end → returns Option<T>
arr.remove(1);        // remove element at index 1 (remaining elements shift left)
```

In Rust, `pop()` returns `Option<T>`. If the vector is empty it returns `None`; if there's a value it returns `Some(value)`. Unlike TypeScript where `undefined` simply comes out, you must handle it explicitly.

```rust
let mut arr = vec![1, 2, 3];
if let Some(last) = arr.pop() {
    println!("popped value: {}", last);
}
```

Also, you must attach `mut` to modify a `Vec`. This is different from TypeScript where `const arr = []` still allows `arr.push()`.

### Reading — Indexing vs `.get()`

```typescript
// TypeScript
const arr = [10, 20, 30];
console.log(arr[1]);    // 20
console.log(arr[99]);   // undefined (no runtime error)
```

```rust
// Rust
let arr = vec![10, 20, 30];

// Method 1: direct indexing — panics if out of bounds!
println!("{}", arr[1]);   // 20

// Method 2: .get() — returns Option<&T>, safe
match arr.get(99) {
    Some(val) => println!("value: {}", val),
    None      => println!("out of bounds"),
}
```

TypeScript returns `undefined` when accessing an out-of-bounds index, but in Rust, direct indexing like `arr[99]` causes the program to panic and terminate. Use `.get()` to access safely via `Option`.

### Iteration

```typescript
// TypeScript
const arr = [1, 2, 3];
arr.forEach(x => console.log(x));
const doubled = arr.map(x => x * 2);
```

```rust
// Rust
let arr = vec![1, 2, 3];

// for loop
for x in &arr {
    println!("{}", x);
}

// iterator chaining
let doubled: Vec<i32> = arr.iter().map(|x| x * 2).collect();
```

Iterating with `&arr` does not move ownership of the vector. If you write `for x in arr` without a reference, `arr` can no longer be used after the loop ends (ownership moves into the loop). In most cases use `&arr` or `.iter()`.

```rust
let arr = vec![1, 2, 3];

// iterate while modifying values
let mut arr2 = vec![1, 2, 3];
for x in &mut arr2 {
    *x *= 2;
}
// arr2 == [2, 4, 6]
```

### Slices `&[T]` — A Concept TypeScript Doesn't Have

Rust has a slice type `&[T]`. It's a way to borrow part of a vector or array without copying.

```rust
let arr = vec![1, 2, 3, 4, 5];

// slice: indices 1 to 3 (3 not included)
let slice: &[i32] = &arr[1..3]; // [2, 3]

// accepting a slice instead of a Vec makes functions more flexible
fn sum(slice: &[i32]) -> i32 {
    slice.iter().sum()
}

sum(&arr);           // pass the whole Vec
sum(&arr[1..3]);     // pass only a portion
```

TypeScript's `Array.prototype.slice()` copies and returns a new array, but Rust's `&[T]` references the original data without copying. This is far more memory-efficient.

---

## 2. `String` — Differences from TypeScript string

Rust strings are more complex than TypeScript's. The key is that there are two types.

| Type | Characteristics |
|------|-----------------|
| `&str` | String slice (immutable reference, typically a literal) |
| `String` | Owned string stored on the heap (can be mutable) |

### `&str` vs `String`

```typescript
// TypeScript — strings are always immutable value types
const greeting: string = "Hello";
let mutable = "Hello";
mutable = mutable + " World"; // creates a new string
```

```rust
// Rust
let literal: &str = "Hello";                           // string slice (stored in the program binary)
let owned: String = String::from("Hello");             // owned string stored on the heap
let owned2 = "Hello".to_string();                      // same result
```

When accepting a string as a function parameter, using `&str` is conventional. `&str` is more flexible because it can accept both string slices and references to `String`.

```rust
// accepting &str allows both String and &str to be passed
fn greet(name: &str) {
    println!("Hello, {}!", name);
}

greet("Alice");                      // pass &str directly
greet(&String::from("Bob"));         // pass a reference to String
```

### Creating and Concatenating Strings

```typescript
// TypeScript
const s1 = "Hello";
const s2 = " World";
const s3 = s1 + s2;                  // "Hello World"
const s4 = `${s1}, ${s2}!`;          // template literal
```

```rust
// Rust
let s1 = String::from("Hello");
let s2 = String::from(" World");

// + operator: note that ownership of s1 is moved!
let s3 = s1 + &s2;  // s1 can no longer be used afterward

// format! macro: convenient concatenation without moving ownership
let s4 = String::from("Hello");
let s5 = format!("{}, {}!", s4, s2); // both s4 and s2 can still be used afterward
```

Be careful with the `+` operator — ownership of the left operand (`s1`) is moved. When combining multiple strings, the `format!` macro is far more convenient and safe.

### Why UTF-8 Indexing Is Not Allowed

TypeScript strings are encoded in UTF-16, while Rust's `String` is encoded in UTF-8. Because of this, you cannot directly retrieve a character in Rust using a byte index.

```typescript
// TypeScript — indexing is allowed
const s = "hello";
console.log(s[0]); // "h"
```

```rust
// Rust — index access not allowed (compile error)
let s = String::from("hello");
// let c = s[0]; // error! String cannot be indexed

// Reason: some Unicode characters occupy multiple bytes in UTF-8
// s[0] is ambiguous: is it the first byte or the first character?
```

Why? The character "é", for example, occupies 2 bytes in UTF-8 encoding. If `s[0]` were allowed, it would be unclear whether a byte or a character should be returned. Rust blocks this ambiguity with a compile error.

### `chars()` / `bytes()` Iteration

```rust
let s = String::from("Hello Rust");

// iterate character by character (Unicode)
for c in s.chars() {
    print!("{} ", c); // H e l l o   R u s t
}

// iterate byte by byte
for b in s.bytes() {
    print!("{} ", b); // numeric value of each byte
}

// get the nth character
let third = s.chars().nth(2); // Some('l')
```

Use `.chars()` when you need character-level processing, and `.bytes()` when you need binary processing. It's more explicit than TypeScript's `[n]` direct access, but the intent is much clearer.

---

## 3. HashMap\<K, V\> — Compared to TypeScript Map/Record

`HashMap<K, V>` corresponds to TypeScript's `Map<K, V>` or `Record<string, V>`.

### Creating and Inserting

```typescript
// TypeScript
const map = new Map<string, number>();
map.set("apple", 3);
map.set("banana", 5);

const record: Record<string, number> = { apple: 3, banana: 5 };
```

```rust
use std::collections::HashMap;

// Rust
let mut map: HashMap<String, i32> = HashMap::new();
map.insert(String::from("apple"), 3);
map.insert(String::from("banana"), 5);

// create with initial values
let map2: HashMap<&str, i32> = [("apple", 3), ("banana", 5)]
    .into_iter()
    .collect();
```

`HashMap` is in the standard library but must be brought in with `use`. Unlike `Vec` or `String`, it is not automatically in scope.

### Reading Values — `get()` → `Option<&V>`

```typescript
// TypeScript
const map = new Map([["apple", 3]]);
const count = map.get("apple"); // number | undefined
if (count !== undefined) {
    console.log(count);
}
```

```rust
// Rust
let mut map = HashMap::new();
map.insert("apple", 3);

// .get() returns Option<&V>
match map.get("apple") {
    Some(count) => println!("count: {}", count),
    None        => println!("key not found"),
}

// or more concisely
if let Some(count) = map.get("apple") {
    println!("count: {}", count);
}
```

TypeScript's `map.get()` returns `T | undefined`, while Rust returns `Option<&V>`. The concept is the same, but in Rust you must handle it explicitly with pattern matching or `if let`.

### The entry API — Equivalent to TypeScript's `||=`

In TypeScript, the "set a default if absent, update if present" pattern looks like this:

```typescript
// TypeScript
const counter = new Map<string, number>();
const word = "hello";
counter.set(word, (counter.get(word) ?? 0) + 1);

// or with ||= (logical assignment operator)
counter.set(word, (counter.get(word) || 0) + 1);
```

In Rust, the `entry` API handles this pattern much more elegantly.

```rust
// Rust
let mut counter: HashMap<String, i32> = HashMap::new();
let word = String::from("hello");

// entry: inserts if key is absent, returns the value if present
counter.entry(word).or_insert(0);

// more idiomatic pattern: modify the value in place
let mut counter: HashMap<&str, i32> = HashMap::new();
let text = "hello world hello rust hello";
for word in text.split_whitespace() {
    let count = counter.entry(word).or_insert(0);
    *count += 1; // dereference to modify the value
}
// {"hello": 3, "world": 1, "rust": 1}
```

`entry().or_insert(0)` inserts 0 if the key is absent, and returns a mutable reference to the existing value if it is present.

`*count += 1` dereferences the reference to modify the value directly.

### Iteration

```typescript
// TypeScript
const map = new Map([["a", 1], ["b", 2]]);
map.forEach((value, key) => console.log(`${key}: ${value}`));
for (const [key, value] of map) {
    console.log(`${key}: ${value}`);
}
```

```rust
// Rust
let mut map = HashMap::new();
map.insert("a", 1);
map.insert("b", 2);

for (key, value) in &map {
    println!("{}: {}", key, value);
}

// iterate over keys only
for key in map.keys() { println!("{}", key); }

// iterate over values only
for val in map.values() { println!("{}", val); }
```

Unlike TypeScript's `Map`, iteration order is not guaranteed to follow insertion order. If you need ordering, use `BTreeMap`.

### Ownership and HashMap

Inserting a value into a HashMap moves ownership. This is a significant difference from TypeScript.

```rust
let key = String::from("color");
let value = String::from("blue");

let mut map = HashMap::new();
map.insert(key, value); // ownership of key and value moves into map

// key and value can no longer be used!
// println!("{}", key); // compile error
```

Copy types (`i32`, `bool`, etc.) are copied rather than moved. For heap types like `String`, ownership is moved, so if you want to keep the original, use `.clone()` or use `&str` as the key.

```rust
let key = String::from("color");
let mut map = HashMap::new();
map.insert(key.clone(), "blue"); // clone and insert a copy
println!("{}", key);              // key is still valid
```

---

## 4. Practical Example: Counting Word Frequencies

Let's implement the same functionality in both TypeScript and Rust: counting how many times each word appears in a sentence.

### TypeScript Implementation

```typescript
function countWords(text: string): Map<string, number> {
    const counter = new Map<string, number>();

    for (const word of text.split(/\s+/)) {
        const trimmed = word.toLowerCase().replace(/[^a-z]/g, "");
        if (trimmed.length === 0) continue;
        counter.set(trimmed, (counter.get(trimmed) ?? 0) + 1);
    }

    return counter;
}

const text = "Rust is fast Rust is safe Rust is fun";
const result = countWords(text);

// sort by frequency descending
const sorted = [...result.entries()].sort((a, b) => b[1] - a[1]);
for (const [word, count] of sorted) {
    console.log(`${word}: ${count}`);
}
// rust: 3
// is: 3
// fast: 1
// safe: 1
// fun: 1
```

### Rust Implementation

```rust
use std::collections::HashMap;

fn count_words(text: &str) -> HashMap<String, u32> {
    let mut counter: HashMap<String, u32> = HashMap::new();

    for word in text.split_whitespace() {
        let trimmed = word.to_lowercase();
        if trimmed.is_empty() {
            continue;
        }
        // count concisely with the entry API
        let count = counter.entry(trimmed).or_insert(0);
        *count += 1;
    }

    counter
}

fn main() {
    let text = "Rust is fast Rust is safe Rust is fun";
    let result = count_words(text);

    // sort by frequency descending
    let mut pairs: Vec<(&String, &u32)> = result.iter().collect();
    pairs.sort_by(|a, b| b.1.cmp(a.1));

    for (word, count) in pairs {
        println!("{}: {}", word, count);
    }
    // rust: 3
    // is: 3
    // fast: 1
    // safe: 1
    // fun: 1
}
```

### Key Differences Between the Two Implementations

| Comparison | TypeScript | Rust |
|------------|-----------|------|
| Handling absent keys | `?? 0` or `\|\|=` | `entry().or_insert(0)` |
| Declaring mutability | `const` is still mutable | `mut` must be explicit |
| Sorting | `Array.sort()` | `Vec::sort_by()` |
| Return type | `Map<string, number>` | `HashMap<String, u32>` |
| Memory | Managed by GC automatically | Freed automatically when out of scope |

In the Rust code, the `count_words` function accepts `&str` to process text without moving ownership, and returns ownership of the `HashMap` it creates internally. The caller takes ownership of the returned `HashMap`, and its memory is automatically freed when it's no longer needed.

---

## Summary

| | TypeScript | Rust |
|---|---|---|
| Dynamic array | `Array<T>` | `Vec<T>` |
| String (literal) | `string` | `&str` |
| String (owned) | `string` | `String` |
| Key-value store | `Map<K, V>` | `HashMap<K, V>` |

Three things to remember when using Rust collections:

1. **`mut` to modify**: Unlike TypeScript's `const`, variables in Rust are immutable by default.
2. **`.get()` instead of indexing**: Prefer methods that return `Option` for safe access.
3. **Watch ownership**: Inserting a `String` into a `HashMap` or `Vec` moves ownership. Use `.clone()` or references (`&`) to keep the original.

---

## Chapter Navigation

Now that you've seen enum and match from the previous chapter, you've seen how those concepts are used with collections. The next chapter expands into the trait system.
