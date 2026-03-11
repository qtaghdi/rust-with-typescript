---
title: "Ch.11 — Concurrency"
description: Threads, channels, Mutex — how Rust prevents data races at compile time
---

Node.js runs on a **single thread with an event loop**. It handles asynchronous I/O well, but distributing CPU work across multiple cores requires `worker_threads` or separate processes.

Rust supports **true multithreading**. And unlike TypeScript — where data races are only caught at runtime — Rust **prevents data races at compile time**.

## Thread Basics

```typescript
// TypeScript (Node.js Worker)
import { Worker } from 'worker_threads';

const worker = new Worker('./worker.js');
worker.postMessage({ data: [1, 2, 3] });
worker.on('message', (result) => console.log(result));
```

```rust
use std::thread;

fn main() {
    let handle = thread::spawn(|| {
        println!("Running in a new thread!");
        42
    });

    // main thread continues running
    println!("Main thread");

    // wait for the thread to finish and retrieve its return value
    let result = handle.join().unwrap();
    println!("Thread result: {}", result);
}
```

### move Closures: Moving Data Into a Thread

Threads run independently, so passing a reference (`&`) risks the original being dropped before the thread finishes. Use `move` to transfer ownership into the thread:

```rust
use std::thread;

fn main() {
    let data = vec![1, 2, 3];

    // without move, this would be a compile error:
    // "closure may outlive the current function, but it borrows `data`"
    let handle = thread::spawn(move || {
        println!("In thread: {:?}", data); // ownership of data moves into the thread
    });

    // println!("{:?}", data); // error! data has already been moved

    handle.join().unwrap();
}
```

---

## Channels — Message Passing Between Threads

Similar to Go channels and Node.js `postMessage`. This is the **"communicate by transferring ownership"** approach.

```rust
use std::sync::mpsc; // multiple producer, single consumer
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel(); // sender (tx), receiver (rx)

    thread::spawn(move || {
        let messages = vec!["first", "second", "third"];
        for msg in messages {
            tx.send(msg).unwrap();
            thread::sleep(std::time::Duration::from_millis(100));
        }
    });

    // rx acts like an Iterator — waits until the channel closes
    for received in rx {
        println!("Received: {}", received);
    }
}
```

### Multiple Senders (mpsc = Multiple Producer, Single Consumer)

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    for i in 0..3 {
        let tx = tx.clone(); // clone the sender for each thread
        thread::spawn(move || {
            tx.send(format!("Thread {} done", i)).unwrap();
        });
    }

    drop(tx); // drop the original tx (rx loop ends only when all senders are closed)

    for msg in rx {
        println!("{}", msg);
    }
}
```

---

## Mutex&lt;T&gt; — Safe Mutation of Shared Memory

While channels transfer ownership, a `Mutex` allows "sharing, but only one at a time."

```rust
use std::sync::Mutex;

fn main() {
    let m = Mutex::new(5);

    {
        let mut val = m.lock().unwrap(); // acquire lock
        *val = 6;
    } // lock automatically released (RAII)

    println!("{:?}", m); // Mutex { data: 6 }
}
```

:::caution[Watch Out for Deadlocks]
Locking two Mutexes in opposite orders causes a deadlock. `lock()` blocks until another thread releases the lock.
:::

### [`Arc<Mutex<T>>`](/glossary/#boxt-vs-rct-vs-arct) — The Practical Pattern

When multiple threads need to mutate shared data:

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let h = thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
        });
        handles.push(h);
    }

    for h in handles {
        h.join().unwrap();
    }

    println!("Final counter: {}", *counter.lock().unwrap()); // 10
}
```

The TypeScript equivalent:

```typescript
// TypeScript: single-threaded, so no race condition
let counter = 0;
const promises = Array.from({ length: 10 }, () =>
  Promise.resolve().then(() => { counter++; })
);
await Promise.all(promises);
console.log(counter); // 10 (but: a real multithreaded version would have a race condition)
```

---

## The Send and Sync Traits

These are the core mechanism by which Rust prevents data races at compile time. `Send` and `Sync` are an extension of the [`Ownership`](/glossary/#메모리--소유권) system — the compiler guarantees thread safety.

| Trait | Meaning | Examples |
|----------|------|------|
| `Send` | Ownership can be transferred across threads | `String`, `Vec<T>`, `Arc<T>` |
| `Sync` | References can be shared across threads (`&T` is Send) | `i32`, `Mutex<T>` |
| `!Send` | Cannot be transferred across threads | `Rc<T>`, `*const T` |
| `!Sync` | References cannot be shared across threads | `Cell<T>`, `RefCell<T>` |

```rust
use std::rc::Rc;
use std::thread;

fn main() {
    let rc = Rc::new(5);

    // compile error!
    // thread::spawn(move || {
    //     println!("{}", rc); // Rc<T> is not Send
    // });

    // use Arc instead
    let arc = std::sync::Arc::new(5);
    thread::spawn(move || {
        println!("{}", arc); // OK
    }).join().unwrap();
}
```

When you try to send `Rc<T>` to another thread, the compiler emits **"Rc&lt;i32&gt; cannot be sent between threads safely"**. The problem is caught at build time rather than as a runtime crash.

---

## RwLock&lt;T&gt; — Separate Read/Write Locking

`Mutex` gives exclusive access even for reads. When reads are frequent and writes are rare, `RwLock` is more efficient:

```rust
use std::sync::{Arc, RwLock};
use std::thread;

fn main() {
    let data = Arc::new(RwLock::new(vec![1, 2, 3]));
    let mut handles = vec![];

    // multiple reader threads can run concurrently
    for i in 0..3 {
        let data = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            let r = data.read().unwrap(); // read lock (multiple concurrent readers allowed)
            println!("Thread {} read: {:?}", i, *r);
        }));
    }

    // writer thread (exclusive lock)
    {
        let data = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            let mut w = data.write().unwrap(); // write lock (exclusive)
            w.push(4);
        }));
    }

    for h in handles {
        h.join().unwrap();
    }
}
```

---

## Practical Pattern: Parallel Processing

```rust
use std::thread;

fn heavy_compute(n: u64) -> u64 {
    (0..n).sum()
}

fn main() {
    let chunks = vec![1_000_000u64, 2_000_000, 3_000_000];

    let handles: Vec<_> = chunks
        .into_iter()
        .map(|n| thread::spawn(move || heavy_compute(n)))
        .collect();

    let results: Vec<u64> = handles
        .into_iter()
        .map(|h| h.join().unwrap())
        .collect();

    println!("{:?}", results);
}
```

In production, the [rayon](https://github.com/rayon-rs/rayon) crate simplifies the above pattern down to `.par_iter()`:

```rust
// using rayon
use rayon::prelude::*;

fn main() {
    let data: Vec<u64> = (0..10).collect();
    let sum: u64 = data.par_iter().map(|&x| x * x).sum();
    println!("{}", sum);
}
```

---

## Relationship to Tokio

Everything covered so far is **OS thread**-based concurrency. Tokio is **async/await**-based and is better suited for I/O-intensive workloads.

| | OS Threads | Tokio async |
|---|---|---|
| Best for | CPU-intensive work | I/O-intensive work |
| Thread count | Tens to hundreds | Tens of thousands of concurrent tasks |
| Cost | Stack memory (default 2MB) | Kilobytes |
| Syntax | Regular code | `async/await` |
| TypeScript analog | `worker_threads` | `Promise`, `async/await` |

```rust
// OS threads: CPU work
thread::spawn(|| heavy_cpu_work());

// Tokio: network/file I/O
#[tokio::main]
async fn main() {
    tokio::spawn(async { fetch_from_api().await });
}
```

:::tip[CPU Work Inside Tokio]
Doing CPU-intensive work inside a Tokio async runtime blocks the event loop. Use `spawn_blocking` instead:
```rust
let result = tokio::task::spawn_blocking(|| heavy_cpu_work()).await.unwrap();
```
:::

---

## Summary

| Need | Tool |
|------|------|
| Spawn a thread | `thread::spawn` |
| Message passing between threads | `mpsc::channel` |
| Protect shared data | `Mutex<T>` |
| Multithreaded sharing | `Arc<T>` |
| Multithreaded sharing + mutation | `Arc<Mutex<T>>` |
| Read-heavy shared data | `Arc<RwLock<T>>` |
| Parallel iterators | `rayon` |
| Async I/O | `tokio` |

**The key takeaway**: Thanks to the `Send` and `Sync` traits, Rust catches data races **at compile time**. The subtle bugs you encountered writing multithreaded TypeScript simply won't compile in Rust.
