---
title: "Ch.10 — Smart Pointers"
description: Box, Rc, Arc, RefCell — Rust's core tools for safe memory control
---

TypeScript has only one kind of reference. Every object lives on the heap, and the GC manages it all automatically.

Rust is different. It tracks **exactly what owns data and how long references can live** at compile time. Smart pointers are types that enable special ownership patterns on top of this system.

## Why Do We Need Smart Pointers?

There are three situations that a plain reference `&T` cannot handle:

| Situation | Problem | Solution |
|------|------|--------|
| Types whose size is unknown at compile time | `&T` requires a known size | [`Box<T>`](/glossary/#boxt-vs-rct-vs-arct) |
| **Reading** shared data from multiple places | Ownership can only have one owner | [`Rc<T>`](/glossary/#boxt-vs-rct-vs-arct) |
| Safe sharing across multiple threads | `Rc<T>` is not thread-safe | [`Arc<T>`](/glossary/#boxt-vs-rct-vs-arct) |
| Deciding mutability at **runtime** rather than compile time | Borrow checker rules apply at compile time | `RefCell<T>` |

---

## Box&lt;T&gt; — Storing a Single Value on the Heap

`Box<T>` is the simplest smart pointer in Rust. It places a value on the heap while the Box itself lives on the stack.

```rust
fn main() {
    let x = 5;             // stack
    let y = Box::new(5);   // stores 5 on the heap, y is a pointer on the stack

    println!("{}", x);      // 5
    println!("{}", y);      // 5 (auto-dereferenced)
    println!("{}", *y + 1); // 6
}
```

### Why Box Is Required for Recursive Types

In TypeScript, recursive types come naturally:

```typescript
type List = {
  value: number;
  next: List | null;
};
```

Attempting the same in Rust:

```rust
// Compile error!
enum List {
    Cons(i32, List),  // size of List is unknown
    Nil,
}
```

When the compiler tries to calculate the size of `List`, it finds another `List` inside, leading to infinite size. Wrapping it in a `Box` puts it on the heap, fixing the size to a pointer width (8 bytes):

```rust
enum List {
    Cons(i32, Box<List>),  // fixed to pointer size
    Nil,
}

fn main() {
    let list = List::Cons(1,
        Box::new(List::Cons(2,
            Box::new(List::Cons(3,
                Box::new(List::Nil))))));
}
```

### Trait Objects (dyn Trait)

Another key use of Box is **dynamic dispatch**. It is similar to TypeScript interfaces, but in Rust, since sizes must be known at compile time, `Box` is required:

```typescript
// TypeScript
interface Shape {
  area(): number;
}

function printArea(shape: Shape) {
  console.log(shape.area());
}
```

```rust
trait Shape {
    fn area(&self) -> f64;
}

struct Circle { radius: f64 }
struct Rectangle { width: f64, height: f64 }

impl Shape for Circle {
    fn area(&self) -> f64 { std::f64::consts::PI * self.radius * self.radius }
}

impl Shape for Rectangle {
    fn area(&self) -> f64 { self.width * self.height }
}

// Box<dyn Shape>: can hold any type that implements Shape
fn print_area(shape: &Box<dyn Shape>) {
    println!("Area: {:.2}", shape.area());
}

fn main() {
    let shapes: Vec<Box<dyn Shape>> = vec![
        Box::new(Circle { radius: 3.0 }),
        Box::new(Rectangle { width: 4.0, height: 5.0 }),
    ];

    for shape in &shapes {
        print_area(shape);
    }
}
```

---

## Rc&lt;T&gt; — Shared Ownership in a Single Thread

`Rc` stands for Reference Counting. It works the same way Python and Swift manage memory — it counts references and frees memory when the count reaches zero.

:::note
`Rc<T>` is **single-threaded only**. Use `Arc<T>` for multithreaded scenarios.
:::

```rust
use std::rc::Rc;

fn main() {
    let data = Rc::new(vec![1, 2, 3]);

    let a = Rc::clone(&data);  // reference count: 2
    let b = Rc::clone(&data);  // reference count: 3

    println!("Reference count: {}", Rc::strong_count(&data)); // 3

    println!("data: {:?}", data);
    println!("a:    {:?}", a);
    println!("b:    {:?}", b);

    drop(a); // reference count: 2
    drop(b); // reference count: 1

    println!("Remaining references: {}", Rc::strong_count(&data)); // 1
} // data dropped → reference count: 0 → memory freed
```

### Rc's Limitation: Immutable References Only

Data wrapped in `Rc<T>` is immutable. Because multiple references exist, simultaneous mutation would be unsafe. If mutation is also needed, use `RefCell` together with `Rc`.

---

## RefCell&lt;T&gt; — Runtime Borrow Checking

Rust's borrow checker operates at compile time. But sometimes **you only know at runtime** whether a particular borrow is safe.

`RefCell<T>` **defers borrow rules to runtime**. Violating the rules causes a runtime panic instead of a compile error.

```rust
use std::cell::RefCell;

fn main() {
    let data = RefCell::new(vec![1, 2, 3]);

    // borrow(): immutable reference (like &)
    {
        let r1 = data.borrow();
        let r2 = data.borrow(); // multiple immutable references at once are OK
        println!("{:?}, {:?}", r1, r2);
    } // r1, r2 dropped

    // borrow_mut(): mutable reference (like &mut)
    {
        let mut w = data.borrow_mut();
        w.push(4);
    } // w dropped

    println!("{:?}", data.borrow()); // [1, 2, 3, 4]
}
```

### Runtime Panic Example

```rust
use std::cell::RefCell;

fn main() {
    let data = RefCell::new(5);
    let r1 = data.borrow();     // immutable reference
    let r2 = data.borrow_mut(); // ⚠️ panic! already borrowed immutably
}
```

---

## Rc&lt;RefCell&lt;T&gt;&gt; — Shared + Mutable Pattern

The core pattern for "shared from multiple places while also allowing mutation" in a single thread.

```rust
use std::rc::Rc;
use std::cell::RefCell;

#[derive(Debug)]
struct Node {
    value: i32,
    children: Vec<Rc<RefCell<Node>>>,
}

fn main() {
    let root = Rc::new(RefCell::new(Node {
        value: 1,
        children: vec![],
    }));

    let child = Rc::new(RefCell::new(Node {
        value: 2,
        children: vec![],
    }));

    // shared from two places while mutating
    root.borrow_mut().children.push(Rc::clone(&child));

    let root_ref = Rc::clone(&root);
    println!("root: {:?}", root_ref.borrow());
}
```

The TypeScript equivalent:

```typescript
// TypeScript: plain object references handle this naturally
const root = { value: 1, children: [] };
const child = { value: 2, children: [] };
const rootRef = root; // same object reference

root.children.push(child);
console.log(rootRef); // mutation is visible
```

Because of Rust's ownership and borrow rules, the explicit `Rc<RefCell<T>>` pattern is necessary.

---

## Arc&lt;T&gt; — Multithreaded Sharing

The thread-safe version of `Rc<T>`. While `Rc` increments its count with plain operations, `Arc` uses **atomic operations**.

```rust
use std::sync::Arc;
use std::thread;

fn main() {
    let data = Arc::new(vec![1, 2, 3, 4, 5]);

    let mut handles = vec![];

    for i in 0..3 {
        let data = Arc::clone(&data); // clone for each thread
        let handle = thread::spawn(move || {
            println!("Thread {}: {:?}", i, data);
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }
}
```

### Arc + Mutex: Shared Mutation Across Threads

`RefCell` is not thread-safe. When you need shared mutation across threads, use `Mutex`:

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..5 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap(); // acquire lock
            *num += 1;
        }); // lock automatically released
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Result: {}", *counter.lock().unwrap()); // 5
}
```

---

## Side-by-Side Comparison

| Type | Owners | Thread-Safe | Mutable | When to Use |
|------|-----------|------------|-----------|-----------|
| `T` | 1 | - | ✓ | Basic ownership |
| `&T` | - | ✓ | ✗ | Short-lived read reference |
| `&mut T` | - | ✗ | ✓ | Short-lived mutable reference |
| `Box<T>` | 1 | - | ✓ | Heap allocation, recursive types |
| `Rc<T>` | Many | ✗ | ✗ | Single-thread shared ownership |
| `Rc<RefCell<T>>` | Many | ✗ | ✓ | Single-thread shared + mutable |
| `Arc<T>` | Many | ✓ | ✗ | Multithreaded shared ownership |
| `Arc<Mutex<T>>` | Many | ✓ | ✓ | Multithreaded shared + mutable |

## Choosing the Right Tool

```
Do you need to share data from multiple places?
├── No  → Plain ownership or &T reference
└── Yes
    ├── Across multiple threads?
    │   ├── Need mutation? → Arc<Mutex<T>>
    │   └── Read only?     → Arc<T>
    └── Single thread?
        ├── Need mutation? → Rc<RefCell<T>>
        └── Read only?     → Rc<T>
```

## Summary

- **`Box<T>`**: Put on the heap, recursive types, `dyn Trait`
- **`Rc<T>`**: Shared read access in a single thread
- **`RefCell<T>`**: Interior mutability with runtime borrow checking
- **`Rc<RefCell<T>>`**: Single-thread shared + mutable
- **`Arc<T>`**: Shared read access across threads
- **`Arc<Mutex<T>>`**: Multithreaded shared + mutable
