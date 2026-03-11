---
title: "Ch.11 — 동시성"
description: 스레드, 채널, Mutex — Rust가 데이터 레이스를 컴파일 타임에 막는 방법
---

Node.js는 **싱글 스레드 + 이벤트 루프**입니다. 비동기 I/O는 잘 처리하지만, CPU를 여러 코어에 분산시키려면 `worker_threads`나 별도 프로세스가 필요합니다.

Rust는 **진짜 멀티스레드**입니다. 그리고 TypeScript에서는 런타임에나 알 수 있는 **데이터 레이스(data race)를 컴파일 타임에 방지**합니다.

## 스레드 기초

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
        println!("새 스레드에서 실행!");
        42
    });

    // 메인 스레드는 계속 실행됨
    println!("메인 스레드");

    // 스레드 완료 대기, 반환값 가져오기
    let result = handle.join().unwrap();
    println!("스레드 결과: {}", result);
}
```

### move 클로저: 데이터를 스레드로 이동

스레드는 독립적으로 실행되므로, 참조(&)를 넘기면 원본이 먼저 드롭될 수 있습니다. `move`로 소유권을 스레드 안으로 이동합니다:

```rust
use std::thread;

fn main() {
    let data = vec![1, 2, 3];

    // move 없으면 컴파일 에러:
    // "closure may outlive the current function, but it borrows `data`"
    let handle = thread::spawn(move || {
        println!("스레드에서: {:?}", data); // data 소유권이 스레드로 이동
    });

    // println!("{:?}", data); // 에러! data를 이미 이동함

    handle.join().unwrap();
}
```

---

## 채널 (Channel) — 스레드 간 메시지 전달

Go의 채널, Node.js의 `postMessage`와 유사합니다. **"소유권을 넘기며 통신"**하는 방식입니다.

```rust
use std::sync::mpsc; // multiple producer, single consumer
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel(); // 송신자(tx), 수신자(rx)

    thread::spawn(move || {
        let messages = vec!["첫 번째", "두 번째", "세 번째"];
        for msg in messages {
            tx.send(msg).unwrap();
            thread::sleep(std::time::Duration::from_millis(100));
        }
    });

    // rx는 Iterator처럼 동작 — 채널이 닫힐 때까지 대기
    for received in rx {
        println!("받음: {}", received);
    }
}
```

### 여러 송신자 (mpsc = Multiple Producer, Single Consumer)

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    for i in 0..3 {
        let tx = tx.clone(); // 각 스레드마다 송신자 클론
        thread::spawn(move || {
            tx.send(format!("스레드 {} 완료", i)).unwrap();
        });
    }

    drop(tx); // 원본 tx 드롭 (모든 송신자가 닫혀야 rx 루프가 끝남)

    for msg in rx {
        println!("{}", msg);
    }
}
```

---

## Mutex&lt;T&gt; — 공유 메모리 안전하게 변경

채널이 "소유권을 넘기는" 방식이라면, `Mutex`는 "공유하되 한 번에 하나씩만 접근"하는 방식입니다.

```rust
use std::sync::Mutex;

fn main() {
    let m = Mutex::new(5);

    {
        let mut val = m.lock().unwrap(); // lock 획득
        *val = 6;
    } // lock 자동 해제 (RAII)

    println!("{:?}", m); // Mutex { data: 6 }
}
```

:::caution[데드락 주의]
두 Mutex를 역순으로 lock하면 데드락이 발생합니다. `lock()`은 다른 스레드가 해제할 때까지 블로킹됩니다.
:::

### Arc&lt;Mutex&lt;T&gt;&gt; — 실전 패턴

여러 스레드가 같은 데이터를 변경해야 할 때:

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

    println!("최종 카운터: {}", *counter.lock().unwrap()); // 10
}
```

TypeScript에서 같은 작업:

```typescript
// TypeScript: 싱글 스레드라 race condition 없음
let counter = 0;
const promises = Array.from({ length: 10 }, () =>
  Promise.resolve().then(() => { counter++; })
);
await Promise.all(promises);
console.log(counter); // 10 (but: 실제 멀티스레드였다면 race condition)
```

---

## Send와 Sync 트레이트

Rust가 데이터 레이스를 컴파일 타임에 막는 핵심 메커니즘입니다.

| 트레이트 | 의미 | 예시 |
|----------|------|------|
| `Send` | 스레드 간 소유권 이전 가능 | `String`, `Vec<T>`, `Arc<T>` |
| `Sync` | 스레드 간 참조 공유 가능 (`&T`가 Send) | `i32`, `Mutex<T>` |
| `!Send` | 스레드 간 이전 불가 | `Rc<T>`, `*const T` |
| `!Sync` | 스레드 간 참조 불가 | `Cell<T>`, `RefCell<T>` |

```rust
use std::rc::Rc;
use std::thread;

fn main() {
    let rc = Rc::new(5);

    // 컴파일 에러!
    // thread::spawn(move || {
    //     println!("{}", rc); // Rc<T>는 Send가 아님
    // });

    // Arc를 써야 함
    let arc = std::sync::Arc::new(5);
    thread::spawn(move || {
        println!("{}", arc); // OK
    }).join().unwrap();
}
```

컴파일러가 `Rc<T>`를 스레드로 보내려 하면 **"Rc&lt;i32&gt; cannot be sent between threads safely"** 라는 에러를 냅니다. 런타임 크래시 대신 빌드 단계에서 막습니다.

---

## RwLock&lt;T&gt; — 읽기/쓰기 분리

`Mutex`는 읽기도 독점합니다. 읽기가 많고 쓰기가 드문 경우 `RwLock`이 더 효율적입니다:

```rust
use std::sync::{Arc, RwLock};
use std::thread;

fn main() {
    let data = Arc::new(RwLock::new(vec![1, 2, 3]));
    let mut handles = vec![];

    // 읽기 스레드 여럿 동시 실행 가능
    for i in 0..3 {
        let data = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            let r = data.read().unwrap(); // 읽기 lock (동시에 여럿 가능)
            println!("스레드 {} 읽기: {:?}", i, *r);
        }));
    }

    // 쓰기 스레드 (독점 lock)
    {
        let data = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            let mut w = data.write().unwrap(); // 쓰기 lock (단독)
            w.push(4);
        }));
    }

    for h in handles {
        h.join().unwrap();
    }
}
```

---

## 실전 패턴: 병렬 처리

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

실무에서는 [rayon](https://github.com/rayon-rs/rayon) 크레이트가 위 패턴을 `.par_iter()`로 단순화해줍니다:

```rust
// rayon 사용 시
use rayon::prelude::*;

fn main() {
    let data: Vec<u64> = (0..10).collect();
    let sum: u64 = data.par_iter().map(|&x| x * x).sum();
    println!("{}", sum);
}
```

---

## Tokio와의 관계

지금까지 다룬 것은 **OS 스레드** 기반 동시성입니다. Tokio는 **비동기(async/await)** 기반으로, I/O 집약적 작업에 적합합니다.

| | OS 스레드 | Tokio async |
|---|---|---|
| 적합한 작업 | CPU 집약적 | I/O 집약적 |
| 스레드 수 | 수십~수백 | 수만 동시 작업 |
| 비용 | 스택 메모리 (기본 2MB) | 킬로바이트 단위 |
| 문법 | 일반 코드 | `async/await` |
| TypeScript 비유 | `worker_threads` | `Promise`, `async/await` |

```rust
// OS 스레드: CPU 작업
thread::spawn(|| heavy_cpu_work());

// Tokio: 네트워크/파일 I/O
#[tokio::main]
async fn main() {
    tokio::spawn(async { fetch_from_api().await });
}
```

:::tip[Tokio에서 CPU 작업하기]
Tokio의 비동기 런타임 안에서 CPU 집약적 작업을 하면 이벤트 루프가 블로킹됩니다. `spawn_blocking`을 사용하세요:
```rust
let result = tokio::task::spawn_blocking(|| heavy_cpu_work()).await.unwrap();
```
:::

---

## 요약

| 필요 | 도구 |
|------|------|
| 스레드 생성 | `thread::spawn` |
| 스레드 간 메시지 전달 | `mpsc::channel` |
| 공유 데이터 보호 | `Mutex<T>` |
| 멀티스레드 공유 | `Arc<T>` |
| 멀티스레드 공유 + 변경 | `Arc<Mutex<T>>` |
| 읽기 많은 공유 데이터 | `Arc<RwLock<T>>` |
| 병렬 반복자 | `rayon` |
| 비동기 I/O | `tokio` |

**핵심**: `Send`와 `Sync` 트레이트 덕분에 Rust는 데이터 레이스를 **컴파일 타임에** 잡습니다. TypeScript에서 멀티스레드 코드를 짜면서 봤던 미묘한 버그들이 Rust에서는 빌드 자체가 안 됩니다.
