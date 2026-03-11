---
title: "Ch.10 — 스마트 포인터"
description: Box, Rc, Arc, RefCell — 메모리를 안전하게 제어하는 Rust의 핵심 도구
---

TypeScript에는 참조(reference)가 하나뿐입니다. 모든 객체는 힙에 있고, GC가 알아서 관리합니다.

Rust는 다릅니다. **무엇이 데이터를 소유하는지, 누가 얼마나 오래 참조할 수 있는지**를 컴파일 타임에 정확히 추적합니다. 스마트 포인터는 이 시스템 위에서 특별한 소유권 패턴을 가능하게 해주는 타입들입니다.

## 왜 스마트 포인터가 필요한가?

일반 참조 `&T`로 해결 안 되는 세 가지 상황이 있습니다:

| 상황 | 문제 | 해결책 |
|------|------|--------|
| 컴파일 타임에 크기를 알 수 없는 타입 | `&T`는 크기를 알아야 함 | [`Box<T>`](/glossary/#boxt-vs-rct-vs-arct) |
| 여러 곳에서 같은 데이터를 **읽기** 공유 | 소유권은 하나뿐 | [`Rc<T>`](/glossary/#boxt-vs-rct-vs-arct) |
| 여러 스레드에서 안전하게 공유 | `Rc<T>`는 스레드 불안전 | [`Arc<T>`](/glossary/#boxt-vs-rct-vs-arct) |
| 컴파일 타임이 아닌 **런타임에** 변경 가능성 결정 | borrow checker 규칙은 컴파일 타임 | `RefCell<T>` |

---

## Box&lt;T&gt; — 힙에 단일 값 저장

`Box<T>`는 Rust에서 가장 단순한 스마트 포인터입니다. 값을 힙에 올리고, Box 자체는 스택에 둡니다.

```rust
fn main() {
    let x = 5;             // 스택
    let y = Box::new(5);   // 힙에 5를 저장, y는 스택의 포인터

    println!("{}", x);      // 5
    println!("{}", y);      // 5 (역참조 자동 처리)
    println!("{}", *y + 1); // 6
}
```

### 재귀 타입에 Box가 필수인 이유

TypeScript에서는 재귀 타입이 자연스럽습니다:

```typescript
type List = {
  value: number;
  next: List | null;
};
```

Rust에서 같은 시도를 하면:

```rust
// 컴파일 에러!
enum List {
    Cons(i32, List),  // List의 크기를 알 수 없음
    Nil,
}
```

컴파일러가 `List`의 크기를 계산하려면 `List` 안에 `List`가 있으므로 무한히 커집니다. `Box`로 힙에 넣으면 포인터 크기(8바이트)로 고정됩니다:

```rust
enum List {
    Cons(i32, Box<List>),  // 포인터 크기로 고정
    Nil,
}

fn main() {
    let list = List::Cons(1,
        Box::new(List::Cons(2,
            Box::new(List::Cons(3,
                Box::new(List::Nil))))));
}
```

### 트레이트 객체 (dyn Trait)

Box의 또 다른 핵심 용도는 **동적 디스패치**입니다. TypeScript의 인터페이스와 비슷하지만, Rust에서는 크기를 컴파일 타임에 알아야 하므로 `Box`가 필요합니다:

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

// Box<dyn Shape>: 어떤 Shape 구현체든 담을 수 있음
fn print_area(shape: &Box<dyn Shape>) {
    println!("넓이: {:.2}", shape.area());
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

## Rc&lt;T&gt; — 단일 스레드에서 소유권 공유

`Rc`는 Reference Counting의 약자입니다. Python이나 Swift가 메모리를 관리하는 방식과 같습니다 — 참조 횟수를 세고, 0이 되면 메모리를 해제합니다.

:::note
`Rc<T>`는 **단일 스레드 전용**입니다. 멀티스레드에서는 `Arc<T>`를 사용하세요.
:::

```rust
use std::rc::Rc;

fn main() {
    let data = Rc::new(vec![1, 2, 3]);

    let a = Rc::clone(&data);  // 참조 카운트: 2
    let b = Rc::clone(&data);  // 참조 카운트: 3

    println!("참조 카운트: {}", Rc::strong_count(&data)); // 3

    println!("data: {:?}", data);
    println!("a:    {:?}", a);
    println!("b:    {:?}", b);

    drop(a); // 참조 카운트: 2
    drop(b); // 참조 카운트: 1

    println!("남은 참조: {}", Rc::strong_count(&data)); // 1
} // data 드롭 → 참조 카운트: 0 → 메모리 해제
```

### Rc의 제약: 불변 참조만 가능

`Rc<T>`로 감싼 데이터는 불변입니다. 참조가 여러 개이므로 동시에 변경하면 안 되기 때문입니다. 변경도 필요하다면 `RefCell`을 함께 사용합니다.

---

## RefCell&lt;T&gt; — 런타임 borrow 검사

Rust의 borrow checker는 컴파일 타임에 동작합니다. 하지만 때로는 **런타임에야 알 수 있는 경우**가 있습니다.

`RefCell<T>`은 borrow 규칙을 **런타임으로 미룹니다**. 규칙을 위반하면 컴파일 에러 대신 런타임 패닉이 발생합니다.

```rust
use std::cell::RefCell;

fn main() {
    let data = RefCell::new(vec![1, 2, 3]);

    // borrow(): 불변 참조 (& 역할)
    {
        let r1 = data.borrow();
        let r2 = data.borrow(); // 동시에 여러 불변 참조 OK
        println!("{:?}, {:?}", r1, r2);
    } // r1, r2 드롭

    // borrow_mut(): 가변 참조 (&mut 역할)
    {
        let mut w = data.borrow_mut();
        w.push(4);
    } // w 드롭

    println!("{:?}", data.borrow()); // [1, 2, 3, 4]
}
```

### 런타임 패닉 예시

```rust
use std::cell::RefCell;

fn main() {
    let data = RefCell::new(5);
    let r1 = data.borrow();     // 불변 참조
    let r2 = data.borrow_mut(); // ⚠️ 패닉! 이미 불변 참조 중
}
```

---

## Rc&lt;RefCell&lt;T&gt;&gt; — 공유 + 변경 패턴

단일 스레드에서 "여러 곳에서 공유하면서 변경도 가능"하게 하는 핵심 패턴입니다.

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

    // root를 두 곳에서 공유하면서 변경
    root.borrow_mut().children.push(Rc::clone(&child));

    let root_ref = Rc::clone(&root);
    println!("root: {:?}", root_ref.borrow());
}
```

TypeScript로 비유하면:

```typescript
// TypeScript: 그냥 객체 참조로 됨
const root = { value: 1, children: [] };
const child = { value: 2, children: [] };
const rootRef = root; // 같은 객체 참조

root.children.push(child);
console.log(rootRef); // 변경 사항 보임
```

Rust에서 소유권과 borrow 규칙이 있기 때문에 `Rc<RefCell<T>>`라는 명시적 패턴이 필요합니다.

---

## Arc&lt;T&gt; — 멀티스레드 공유

`Rc<T>`의 스레드 안전(thread-safe) 버전입니다. `Rc`가 카운트를 일반 연산으로 하는 반면, `Arc`는 **원자적(atomic) 연산**으로 합니다.

```rust
use std::sync::Arc;
use std::thread;

fn main() {
    let data = Arc::new(vec![1, 2, 3, 4, 5]);

    let mut handles = vec![];

    for i in 0..3 {
        let data = Arc::clone(&data); // 각 스레드에 클론
        let handle = thread::spawn(move || {
            println!("스레드 {}: {:?}", i, data);
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }
}
```

### Arc + Mutex: 멀티스레드에서 공유 + 변경

`RefCell`은 스레드 불안전합니다. 멀티스레드에서 공유 변경이 필요하면 `Mutex`를 사용합니다:

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..5 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap(); // lock 획득
            *num += 1;
        }); // lock 자동 해제
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("결과: {}", *counter.lock().unwrap()); // 5
}
```

---

## 한눈에 비교

| 타입 | 소유자 수 | 스레드 안전 | 변경 가능 | 사용 시기 |
|------|-----------|------------|-----------|-----------|
| `T` | 1 | - | ✓ | 기본 소유 |
| `&T` | - | ✓ | ✗ | 짧은 읽기 참조 |
| `&mut T` | - | ✗ | ✓ | 짧은 변경 참조 |
| `Box<T>` | 1 | - | ✓ | 힙 할당, 재귀 타입 |
| `Rc<T>` | 여럿 | ✗ | ✗ | 단일 스레드 공유 |
| `Rc<RefCell<T>>` | 여럿 | ✗ | ✓ | 단일 스레드 공유+변경 |
| `Arc<T>` | 여럿 | ✓ | ✗ | 멀티스레드 공유 |
| `Arc<Mutex<T>>` | 여럿 | ✓ | ✓ | 멀티스레드 공유+변경 |

## 언제 무엇을 쓸까?

```
데이터를 여러 곳에서 써야 하나?
├── 아니오 → 일반 소유권 또는 &T 참조
└── 예
    ├── 여러 스레드에서?
    │   ├── 변경 필요? → Arc<Mutex<T>>
    │   └── 읽기만? → Arc<T>
    └── 단일 스레드에서?
        ├── 변경 필요? → Rc<RefCell<T>>
        └── 읽기만? → Rc<T>
```

## 요약

- **`Box<T>`**: 힙에 올리기, 재귀 타입, `dyn Trait`
- **`Rc<T>`**: 단일 스레드에서 읽기 공유
- **`RefCell<T>`**: 런타임 borrow 검사로 내부 변경
- **`Rc<RefCell<T>>`**: 단일 스레드 공유 + 변경
- **`Arc<T>`**: 멀티스레드 읽기 공유
- **`Arc<Mutex<T>>`**: 멀티스레드 공유 + 변경
