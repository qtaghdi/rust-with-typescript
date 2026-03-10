---
title: "Ch.8 — 이터레이터 & 클로저"
description: "Array 메서드 체이닝 vs Rust 이터레이터 — 제로코스트 추상화의 힘"
---

TypeScript에서 `array.filter().map().reduce()`를 즐겨 쓰신다면, Rust의 이터레이터가 굉장히 친숙하게 느껴질 겁니다. 문법만 조금 다를 뿐, 개념은 거의 같습니다. 그리고 Rust 이터레이터는 **제로코스트 추상화(zero-cost abstraction)** 덕분에 중간 배열을 전혀 만들지 않습니다. 어떻게 그게 가능한지 함께 알아봅시다.

---

## 1. 클로저 심화

### TypeScript 화살표 함수 vs Rust 클로저

TypeScript에서 화살표 함수는 매우 익숙합니다.

```typescript
const double = (x: number) => x * 2;
const greet = (name: string) => `Hello, ${name}!`;
```

Rust의 클로저는 `|파라미터| 표현식` 문법을 사용합니다. `||` 안에 매개변수를 넣는다고 기억하세요.

```rust
let double = |x: i32| x * 2;
let greet = |name: &str| format!("Hello, {}!", name);

println!("{}", double(5));   // 10
println!("{}", greet("Rust")); // Hello, Rust!
```

여러 줄이 필요하면 중괄호로 감싸면 됩니다.

```rust
let process = |x: i32| {
    let doubled = x * 2;
    let added = doubled + 10;
    added // 마지막 표현식이 반환값
};

println!("{}", process(5)); // 20
```

Rust 클로저는 타입 추론이 강력해서, 대부분의 경우 타입을 생략할 수 있습니다.

```rust
let numbers = vec![1, 2, 3, 4, 5];
let doubled: Vec<i32> = numbers.iter().map(|x| x * 2).collect();
// |x: &i32| (*x) * 2 라고 쓰지 않아도 컴파일러가 알아서 추론합니다
```

---

### 환경 캡처: move vs borrow

TypeScript의 화살표 함수는 외부 변수를 **항상 자동으로** 캡처합니다.

```typescript
const multiplier = 3;
const multiply = (x: number) => x * multiplier; // multiplier를 자동 캡처
console.log(multiply(5)); // 15
```

Rust는 기본적으로 **빌림(borrow)** 으로 캡처하지만, 필요할 때 `move` 키워드로 소유권을 클로저 안으로 이동시킬 수 있습니다.

```rust
fn main() {
    let multiplier = 3;

    // 기본: 참조로 캡처 (borrow)
    let multiply = |x| x * multiplier;
    println!("{}", multiply(5)); // 15
    println!("{}", multiplier);  // multiplier는 여전히 사용 가능

    // move: 소유권을 클로저로 이동
    let name = String::from("Alice");
    let greet = move || format!("Hello, {}!", name);
    // println!("{}", name); // 오류! name의 소유권이 클로저로 이동했습니다
    println!("{}", greet()); // Hello, Alice!
}
```

`move`가 꼭 필요한 대표적인 상황은 **스레드(thread)** 입니다. 스레드는 클로저가 캡처한 값의 생명주기를 보장할 수 없기 때문에, 소유권을 넘겨야 합니다.

```rust
use std::thread;

fn main() {
    let data = vec![1, 2, 3];

    // move 없이는 컴파일 오류
    let handle = thread::spawn(move || {
        println!("스레드에서 데이터: {:?}", data);
    });

    handle.join().unwrap();
}
```

---

### FnOnce / FnMut / Fn 트레이트

Rust의 클로저는 캡처 방식에 따라 세 가지 트레이트를 구현합니다. TypeScript에는 이런 구분이 없지만, 개념적으로는 이해할 수 있습니다.

| 트레이트 | 호출 가능 횟수 | 캡처 방식 | TypeScript 비유 |
|---------|------------|---------|--------------|
| `FnOnce` | 한 번만 | 소유권 이동 | 일회용 콜백 |
| `FnMut` | 여러 번 (값 변경 가능) | 가변 빌림 | 상태를 수정하는 콜백 |
| `Fn` | 여러 번 | 불변 빌림 | 순수 함수 |

```rust
fn call_once<F: FnOnce()>(f: F) {
    f(); // 한 번만 호출 가능
}

fn call_multiple<F: Fn()>(f: F) {
    f();
    f(); // 여러 번 호출 가능
}

fn main() {
    let name = String::from("Alice");

    // FnOnce: 소유권을 소비하는 클로저
    let consume = || {
        let owned = name; // name의 소유권을 가져옴
        println!("이름: {}", owned);
    };
    call_once(consume);
    // call_once(consume); // 오류! 이미 소비됨

    // FnMut: 내부 상태를 변경하는 클로저
    let mut count = 0;
    let mut increment = || {
        count += 1;
        println!("카운트: {}", count);
    };
    increment();
    increment();
    // count는 이제 2

    // Fn: 순수하게 읽기만 하는 클로저
    let base = 10;
    let add_base = |x| x + base;
    println!("{}", add_base(5));  // 15
    println!("{}", add_base(20)); // 30
}
```

---

## 2. 이터레이터 기초

### Iterator 트레이트와 next() 메서드

Rust의 이터레이터는 `Iterator` 트레이트를 구현한 모든 타입입니다. 핵심은 단 하나의 메서드, `next()`입니다.

```rust
pub trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;
    // 나머지 수십 개의 메서드는 next()를 바탕으로 자동 구현됨
}
```

직접 `next()`를 호출할 수도 있습니다.

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

TypeScript의 이터레이터 프로토콜과 거의 동일한 구조입니다.

```typescript
const numbers = [1, 2, 3];
const iter = numbers[Symbol.iterator]();

console.log(iter.next()); // { value: 1, done: false }
console.log(iter.next()); // { value: 2, done: false }
console.log(iter.next()); // { value: 3, done: false }
console.log(iter.next()); // { value: undefined, done: true }
```

---

### iter() / into_iter() / iter_mut() 차이

세 메서드는 비슷해 보이지만 중요한 차이가 있습니다.

```rust
fn main() {
    let mut numbers = vec![1, 2, 3, 4, 5];

    // iter(): 불변 참조(&T)로 이터레이션 — 원본 유지
    for n in numbers.iter() {
        print!("{} ", n); // n: &i32
    }
    println!(); // numbers는 여전히 사용 가능

    // iter_mut(): 가변 참조(&mut T)로 이터레이션 — 값 수정 가능
    for n in numbers.iter_mut() {
        *n *= 2; // n: &mut i32, 역참조로 값 수정
    }
    println!("{:?}", numbers); // [2, 4, 6, 8, 10]

    // into_iter(): 소유권(T)을 가져감 — 원본 소비
    for n in numbers.into_iter() {
        print!("{} ", n); // n: i32 (소유)
    }
    // println!("{:?}", numbers); // 오류! numbers는 이미 소비됨
}
```

| 메서드 | 요소 타입 | 원본 사용 가능? | 용도 |
|-------|---------|-------------|-----|
| `iter()` | `&T` | 예 | 읽기 전용 순회 |
| `iter_mut()` | `&mut T` | 예 (수정 후) | 값 수정 |
| `into_iter()` | `T` | 아니오 | 소유권 이전 |

---

### 지연 평가 (Lazy Evaluation)

TypeScript 배열 메서드는 **즉시 평가(eager evaluation)** 입니다. 각 단계마다 새 배열을 생성합니다.

```typescript
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// 매 단계마다 새 배열 생성: [2,4,6,8,10] → [4,8] → [4]
const result = numbers
  .filter(x => x % 2 === 0) // 새 배열: [2, 4, 6, 8, 10]
  .map(x => x * 2)          // 새 배열: [4, 8, 12, 16, 20]
  .slice(0, 2);              // 새 배열: [4, 8]

console.log(result); // [4, 8]
```

Rust 이터레이터는 **지연 평가(lazy evaluation)** 입니다. `.collect()` 같은 소비 어댑터를 호출하기 전까지는 아무것도 실행되지 않습니다.

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // 이 시점에서는 아무것도 실행되지 않음
    let lazy_chain = numbers.iter()
        .filter(|&&x| x % 2 == 0)
        .map(|&x| x * 2)
        .take(2);

    // collect()를 호출할 때 비로소 실행됨
    let result: Vec<i32> = lazy_chain.collect();
    println!("{:?}", result); // [4, 8]
}
```

지연 평가 덕분에 중간 컬렉션이 전혀 생성되지 않습니다. 요소 하나씩 파이프라인을 통과시키는 방식입니다.

---

## 3. 이터레이터 어댑터 (TypeScript Array 메서드와 1:1 비교)

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
// Some(&4) 또는 None
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
// TypeScript (zip은 기본 내장 없음, 직접 구현)
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

## 4. 소비 어댑터 (collect, sum, count, fold)

이터레이터 어댑터는 새 이터레이터를 반환하지만, **소비 어댑터(consuming adapter)** 는 이터레이터를 소비하고 최종 값을 반환합니다.

### collect()

`collect()`는 이터레이터를 컬렉션으로 변환합니다. 어떤 타입으로 수집할지 명시해야 합니다.

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // 타입 어노테이션으로 명시
    let doubled: Vec<i32> = numbers.iter().map(|&x| x * 2).collect();

    // 터보피시(turbofish) 문법으로 명시
    let doubled = numbers.iter().map(|&x| x * 2).collect::<Vec<i32>>();

    // 와일드카드로 일부만 명시
    let doubled = numbers.iter().map(|&x| x * 2).collect::<Vec<_>>();

    println!("{:?}", doubled); // [2, 4, 6, 8, 10]

    // HashMap으로 수집
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

// 조건부 합계
let even_sum: i32 = vec![1, 2, 3, 4, 5]
    .iter()
    .filter(|&&x| x % 2 == 0)
    .sum();
println!("{}", even_sum); // 6 (2 + 4)
```

### fold() — TypeScript reduce와 비교

```typescript
// TypeScript reduce
const numbers = [1, 2, 3, 4, 5];
const product = numbers.reduce((acc, x) => acc * x, 1); // 120

// 문자열 연결
const joined = ["a", "b", "c"].reduce((acc, x) => acc + x, ""); // "abc"
```

```rust
// Rust fold
let numbers = vec![1, 2, 3, 4, 5];
let product = numbers.iter().fold(1, |acc, &x| acc * x);
println!("{}", product); // 120

// 문자열 연결
let joined = vec!["a", "b", "c"]
    .iter()
    .fold(String::new(), |mut acc, &x| {
        acc.push_str(x);
        acc
    });
println!("{}", joined); // "abc"

// 더 관용적인 방법
let joined = vec!["a", "b", "c"].join("");
println!("{}", joined); // "abc"
```

`fold`는 `reduce`와 거의 동일하지만, 초기값(`init`)을 항상 제공해야 한다는 점이 다릅니다. TypeScript의 `reduce`는 초기값 없이도 호출할 수 있지만, 빈 배열에서 오류가 발생할 수 있습니다. Rust의 `fold`는 항상 안전합니다.

---

## 5. 이터레이터 체이닝 실전 예제

실제 코드에서 자주 보이는 패턴을 비교해 봅시다.

### 예제: 사용자 목록 필터링

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

// 활성 사용자 중 성인만, 이름 순 정렬, 상위 3명의 이름 추출
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

    // 정렬 먼저 (sort는 이터레이터 체인 밖에서)
    users.sort_by(|a, b| a.name.cmp(&b.name));

    // 활성 성인 사용자 상위 3명의 이름 추출
    let result: Vec<&str> = users.iter()
        .filter(|u| u.active && u.age >= 18)
        .take(3)
        .map(|u| u.name.as_str())
        .collect();

    println!("{:?}", result); // ["Alice", "Diana", "Eve"]
}
```

### 성능 비교: 중간 Vec이 생성되지 않는 이유

TypeScript의 배열 메서드 체인은 각 단계마다 새 배열을 힙에 할당합니다.

```
TypeScript 체이닝:
[1..100] → filter → [새 배열: 짝수 50개] → map → [새 배열: 변환된 50개] → slice → [새 배열: 5개]
            ↑ 힙 할당            ↑ 힙 할당                                    ↑ 힙 할당
```

Rust 이터레이터 체인은 요소를 하나씩 파이프라인에 흘려보냅니다.

```
Rust 이터레이터 체이닝:
요소 1 → filter? No  → 버림
요소 2 → filter? Yes → map → take? count=1 → collect에 추가
요소 3 → filter? No  → 버림
요소 4 → filter? Yes → map → take? count=2 → collect에 추가
...
```

```rust
fn main() {
    // 10만 개 숫자에서 짝수만 두 배로, 상위 5개 추출
    let result: Vec<i32> = (1..=100_000)
        .filter(|x| x % 2 == 0)
        .map(|x| x * 2)
        .take(5)
        .collect();

    // 중간 배열 없음! 메모리는 최종 결과 5개분만 사용
    println!("{:?}", result); // [4, 8, 12, 16, 20]
}
```

`take(5)`가 5개를 수집하는 순간 이터레이터 전체가 즉시 종료됩니다. 나머지 99,990개는 평가조차 되지 않습니다. 이것이 지연 평가의 강력함입니다.

---

## 6. 커스텀 이터레이터 만들기

직접 `Iterator` 트레이트를 구현해 봅시다. 피보나치 수열 이터레이터를 만들겠습니다.

```typescript
// TypeScript — 제너레이터로 구현
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
// Rust — Iterator 트레이트 직접 구현
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
        Some(next) // 무한 이터레이터: None을 반환하지 않음
    }
}

fn main() {
    let fib = Fibonacci::new();

    // Iterator 트레이트를 구현했으므로 모든 어댑터를 바로 사용 가능!
    let first10: Vec<u64> = fib.take(10).collect();
    println!("{:?}", first10); // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

    // 100 미만의 피보나치 수 중 짝수만
    let even_fibs: Vec<u64> = Fibonacci::new()
        .take_while(|&x| x < 100)
        .filter(|x| x % 2 == 0)
        .collect();
    println!("{:?}", even_fibs); // [0, 2, 8, 34]
}
```

`Iterator` 트레이트에서 `next()` 하나만 구현하면, `map`, `filter`, `take`, `fold` 등 수십 개의 메서드가 자동으로 제공됩니다. 이것이 Rust 트레이트 시스템의 강력함입니다.

---

## 정리

| 개념 | TypeScript | Rust |
|-----|-----------|------|
| 클로저 문법 | `(x) => x + 1` | `\|x\| x + 1` |
| 환경 캡처 | 자동 (항상) | borrow 기본, `move`로 소유권 이전 |
| 클로저 트레이트 | 없음 | `Fn` / `FnMut` / `FnOnce` |
| 이터레이션 방식 | 즉시 평가 | 지연 평가 (lazy) |
| 중간 컬렉션 | 각 단계마다 생성 | 생성 안 함 |
| 소비 어댑터 | `.reduce()` 등 | `.collect()`, `.fold()`, `.sum()` 등 |
| 커스텀 이터레이터 | `Symbol.iterator`, 제너레이터 | `Iterator` 트레이트 구현 |

Rust의 이터레이터는 TypeScript의 배열 메서드보다 문법이 조금 낯설 수 있지만, 그 원리는 동일합니다. 그리고 제로코스트 추상화 덕분에 명시적인 `for` 루프와 동일한 성능을 냅니다. 고수준의 표현력과 저수준의 성능, 두 마리 토끼를 모두 잡는 것이 Rust 이터레이터의 핵심입니다.
