---
title: "Ch.7 — Ownership & Borrowing"
description: "Rust의 메모리 모델과 소유권 시스템"
---

Rust를 처음 배울 때 가장 많이 막히는 부분이 바로 여기입니다. Borrow Checker와 싸우다 포기하는 분들도 많습니다. 하지만 이 개념들은 "Rust가 이상한 것"이 아니라 "메모리를 안전하게 관리하는 체계적인 방법"입니다. 차근차근 살펴봅시다.

---

## 3-1. 메모리 기초: 스택, 힙, 그리고 GC

Rust의 Ownership을 이해하려면 먼저 메모리가 어떻게 작동하는지 알아야 합니다. JavaScript 개발자 입장에서 직접 몰라도 되는 개념이었지만, 여기서 한 번 짚고 가겠습니다.

### 스택 (Stack): 빠르고 예측 가능한 메모리

스택은 **책 더미**와 같습니다. 책을 위에서 쌓고(push), 위에서 꺼냅니다(pop). 순서가 명확합니다.

```
함수 호출 시:
┌─────────────────┐
│   add(3, 5)     │  ← 가장 위: 현재 실행 중인 함수
│   main()        │
└─────────────────┘

add() 완료 시:
┌─────────────────┐
│   main()        │  ← add()가 스택에서 제거됨
└─────────────────┘
```

- 크기를 **컴파일 타임에 알아야** 합니다
- 매우 빠릅니다 (CPU 캐시 친화적)
- 함수가 끝나면 자동으로 메모리 해제
- `i32`, `f64`, `bool` 같은 기본 타입은 스택에 저장

### 힙 (Heap): 유연하지만 관리가 필요한 메모리

힙은 **커다란 창고**와 같습니다. 필요할 때 공간을 빌리고(allocate), 다 쓰면 반납해야(free) 합니다.

```
힙 메모리:
┌────────────────────────────────────┐
│  [사용 중: String "hello"]         │
│  [비어 있음]                        │
│  [사용 중: Vec<User> ...]          │
│  [비어 있음]                        │
└────────────────────────────────────┘
```

- 크기를 런타임에 결정할 수 있습니다
- 스택보다 느립니다 (메모리 할당 비용)
- `String`, `Vec<T>`, `Box<T>` 같은 동적 크기 타입은 힙에 저장
- **반납하지 않으면 메모리 누수 (leak)**

### JavaScript/TypeScript: GC가 창고 관리인

JavaScript에서는 직접 메모리를 반납하지 않아도 됩니다. **Garbage Collector(GC)** 가 주기적으로 돌면서 "더 이상 아무도 참조하지 않는" 메모리를 자동으로 회수합니다.

```
GC 없는 세계 (C/C++):
  창고를 빌림 → 작업 → 직접 반납
  반납 까먹으면? → 메모리 누수
  이미 반납한 공간 또 쓰면? → 버그 (use-after-free)

GC 있는 세계 (JavaScript):
  창고를 빌림 → 작업 → 그냥 두면 됨
  GC가 주기적으로 청소 → 편리하지만...
  청소할 때 잠깐 멈춤 (GC pause)
  청소 시점 예측 불가
```

### Rust: 컴파일러가 창고 관리인

Rust는 GC도 없고 수동 메모리 관리도 없습니다. 대신 **컴파일러가 Ownership 규칙을 검사**하여, 각 메모리가 언제 해제되어야 하는지 빌드 타임에 결정합니다.

```
Ownership 세계 (Rust):
  창고를 빌림 → 소유자가 생김
  소유자가 스코프를 벗어나면 → 자동으로 반납 (drop)
  컴파일러가 이 모든 걸 검사
  GC pause 없음, 메모리 누수 없음
```

```rust
fn main() {
    let s = String::from("hello"); // 힙에 "hello" 할당, s가 소유자
    println!("{}", s);
    // main()이 끝나면 s가 스코프를 벗어남 → drop() 자동 호출 → 메모리 해제
}
```

---

## 3-2. Ownership의 3가지 규칙

Rust의 Ownership 시스템은 딱 세 가지 규칙으로 이루어집니다.

### 규칙 1: 모든 값은 소유자(owner)가 있다

```rust
let s = String::from("hello"); // s가 "hello"의 소유자
```

### 규칙 2: 소유자는 동시에 하나만 존재한다

```typescript
// TypeScript — 복사가 자유로움
let a = "hello";
let b = a;       // a와 b 모두 "hello"를 가리킴
console.log(a);  // OK
console.log(b);  // OK
```

```rust
// Rust — 소유권 이전(move)
let a = String::from("hello");
let b = a;       // "hello"의 소유권이 a에서 b로 이전됨
// println!("{}", a); // 컴파일 에러! a는 더 이상 소유자가 아님
println!("{}", b);   // OK
```

"JS에서는 되는데 Rust에서는 왜 안 되지?"의 첫 번째 사례입니다.

Rust에서 `let b = a;`는 단순 복사가 아닙니다. 힙에 있는 값의 **소유권이 a에서 b로 이동**합니다. 이후 a는 유효하지 않습니다.

> 왜 이렇게 할까요? a와 b 둘 다 같은 힙 메모리를 가리킨다면, 둘 다 스코프를 벗어날 때 같은 메모리를 두 번 해제하는 **double free** 버그가 생깁니다. Rust는 이를 소유자가 하나라는 규칙으로 원천 차단합니다.

스택에 저장되는 기본 타입(`i32`, `f64`, `bool`, `char`)은 복사가 저렴하므로 Move 대신 **Copy**가 일어납니다.

```rust
let x: i32 = 5;
let y = x;       // i32는 Copy — x도 y도 유효
println!("{} {}", x, y); // OK
```

### 규칙 3: 소유자가 스코프를 벗어나면 값이 드롭된다

```rust
fn main() {
    {
        let s = String::from("world"); // s가 소유자
        println!("{}", s);
    } // ← 이 중괄호에서 s가 스코프를 벗어남 → 자동 drop → 메모리 해제

    // println!("{}", s); // 컴파일 에러: s는 이미 드롭됨
}
```

### 함수에 값을 넘길 때

```typescript
// TypeScript — 함수에 넘겨도 원본 사용 가능
function printUser(user: User): void {
  console.log(user.name);
}

const user = { id: 1, name: "Alice" };
printUser(user);
console.log(user.name); // 여전히 사용 가능
```

```rust
// Rust — 소유권이 함수로 이동됨
fn print_user(user: User) {    // user의 소유권이 이 함수로 이동
    println!("{}", user.name);
} // 함수가 끝나면 user drop

let user = User { id: 1, name: "Alice".to_string() };
print_user(user);            // 소유권 이전
// println!("{}", user.name); // 컴파일 에러! 소유권이 없음
```

이 문제를 해결하는 방법이 다음 섹션의 **Borrowing**입니다.

---

## 3-3. Borrowing과 References

소유권을 넘기지 않고 값을 잠깐 "빌려주는" 개념이 **Borrowing**입니다. `&`(앰퍼샌드)를 붙여 참조(reference)를 만듭니다.

### 불변 참조 (Immutable Reference): `&T`

```typescript
// TypeScript — 객체는 참조로 전달됨 (기본)
function printUser(user: User): void {
  console.log(user.name);
  // user를 수정하면 원본도 수정됨 (참조이므로)
}

const user = { id: 1, name: "Alice" };
printUser(user);
console.log(user.name); // OK
```

```rust
// Rust — 명시적으로 참조를 전달 (&)
fn print_user(user: &User) {  // 소유권이 아닌 참조를 받음
    println!("{}", user.name);
    // user.name = "Bob".to_string(); // 에러: 불변 참조로는 수정 불가
}

let user = User { id: 1, name: "Alice".to_string() };
print_user(&user);           // &user: 참조를 전달
println!("{}", user.name);   // OK: 소유권은 여전히 user에게 있음
```

불변 참조는 **동시에 여러 개**가 존재할 수 있습니다.

```rust
let s = String::from("hello");
let r1 = &s;
let r2 = &s;
let r3 = &s;
println!("{} {} {}", r1, r2, r3); // OK: 불변 참조는 여러 개 가능
```

### 가변 참조 (Mutable Reference): `&mut T`

```typescript
// TypeScript — 함수 안에서 객체 수정
function updateUser(user: User): void {
  user.name = "Bob"; // 원본도 수정됨
}

const user = { id: 1, name: "Alice" };
updateUser(user);
console.log(user.name); // "Bob"
```

```rust
// Rust — 가변 참조 명시
fn update_user(user: &mut User) {
    user.name = "Bob".to_string(); // OK: 가변 참조로는 수정 가능
}

let mut user = User { id: 1, name: "Alice".to_string() }; // 변수도 mut이어야 함
update_user(&mut user);  // &mut: 가변 참조 전달
println!("{}", user.name); // "Bob"
```

가변 참조는 **동시에 하나만** 존재할 수 있습니다.

```rust
let mut s = String::from("hello");

let r1 = &mut s;
// let r2 = &mut s; // 컴파일 에러! 가변 참조는 동시에 하나만

r1.push_str(" world");
println!("{}", r1); // OK
```

### 왜 이런 제약이 있을까? — 데이터 레이스 방지

```
동시에 가변 참조가 여러 개라면?
 → 스레드 A와 스레드 B가 동시에 같은 값을 수정
 → 결과가 예측 불가 (데이터 레이스)
 → 멀티스레드 프로그램의 가장 골치 아픈 버그

Rust의 규칙:
 → 가변 참조는 동시에 하나만
 → 불변 참조와 가변 참조가 동시에 존재 불가
 → 컴파일 타임에 데이터 레이스를 원천 차단
```

| 상황 | TypeScript | Rust |
|------|-----------|------|
| 읽기만 하는 참조 | 제한 없음 | `&T` — 여러 개 가능 |
| 수정 가능한 참조 | 제한 없음 | `&mut T` — 동시에 하나만 |
| 불변+가변 혼용 | 제한 없음 | 동시 존재 불가 |
| 원본 유효성 | 암묵적 | 컴파일러가 보장 |

### Dangling Reference 방지

```typescript
// TypeScript — 이런 상황이 런타임에 생길 수 있음
function getRef(): { value: string } {
  const obj = { value: "hello" };
  return obj; // 참조를 반환
}
// TypeScript/JS에서는 GC가 obj를 살려둠
```

```rust
// Rust — 컴파일 에러로 방지
fn get_ref() -> &String {
    let s = String::from("hello");
    &s  // 컴파일 에러! s가 이 함수 스코프에서 drop되는데 참조를 반환할 수 없음
}

// 해결책: 소유권을 반환
fn get_string() -> String {
    let s = String::from("hello");
    s  // 소유권 이전 (OK)
}
```

---

## 3-4. Lifetimes 맛보기

Lifetime(수명)은 Rust에서 가장 어렵게 느껴지는 개념입니다. 깊이 들어가기 전에 핵심 아이디어만 잡겠습니다.

### Lifetime이 뭔가요?

Lifetime은 **참조가 유효한 기간**입니다. Rust 컴파일러는 모든 참조의 유효 기간을 추적하여 "이미 drop된 값을 참조하는" 상황을 방지합니다.

```
비유: 도서관 책 빌리기

책(값) → 소유자: 도서관
독자(함수) → 참조: 책을 빌림
수명: 대출 기간

규칙:
- 대출 기간 중에는 책이 폐기될 수 없음
- 대출 기간이 끝나면 책 반납
- 컴파일러 = 도서관 사서 (대출 규칙 관리)
```

### Lifetime이 명시적으로 필요한 경우

대부분의 경우 컴파일러가 lifetime을 추론합니다. 하지만 여러 참조가 관계될 때는 명시가 필요합니다.

```rust
// 이 함수: 두 문자열 중 더 긴 것을 반환
// 반환된 참조가 어느 쪽 참조와 같은 수명인지 컴파일러가 모름
fn longest(x: &str, y: &str) -> &str { // 컴파일 에러
    if x.len() > y.len() { x } else { y }
}
```

```rust
// lifetime 매개변수 'a를 명시
// "반환 참조의 수명은 x와 y 중 더 짧은 것과 같다"
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

fn main() {
    let s1 = String::from("long string");
    let result;
    {
        let s2 = String::from("xyz");
        result = longest(s1.as_str(), s2.as_str());
        println!("{}", result); // OK: s2가 아직 살아 있음
    }
    // println!("{}", result); // 에러: s2가 drop됐으므로 result 무효
}
```

### TypeScript와의 비교

TypeScript에는 Lifetime 개념이 없습니다. JavaScript의 GC가 참조 관계를 추적하여 "아직 참조되는" 객체를 메모리에 유지하기 때문입니다.

```typescript
// TypeScript — GC가 참조 수명을 관리
function longest(a: string, b: string): string {
  return a.length > b.length ? a : b;
}
// GC가 반환된 string이 참조되는 한 메모리에 유지함
// 개발자가 신경 쓸 필요 없음
```

| 개념 | TypeScript | Rust |
|------|-----------|------|
| 참조 유효기간 관리 | GC (자동) | Lifetime (컴파일 타임) |
| 명시 필요 | 없음 | 대부분 불필요, 일부 필요 |
| 무효 참조(dangling) | GC가 방지 | 컴파일러가 방지 |
| 런타임 비용 | GC 비용 있음 | 없음 (zero-cost) |

### Lifetime, 처음엔 어렵습니다

솔직히 말하면, Lifetime은 Rust를 배우는 대부분의 사람들이 막히는 지점입니다. 처음에는 컴파일러 에러 메시지와 씨름하는 시간이 많습니다.

좋은 소식은 두 가지입니다:

1. **실제로 lifetime을 직접 쓸 일은 생각보다 적습니다.** 컴파일러가 대부분 추론해줍니다.
2. **컴파일러 에러 메시지가 매우 친절합니다.** 어떤 수명이 문제인지, 어떻게 고치면 되는지 설명해줍니다.

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

컴파일러가 직접 해결책까지 제시해줍니다. 이 정도면 든든한 페어 프로그래머가 생긴 셈입니다.

---

## Ownership 요약

Rust의 Ownership 시스템은 처음에는 답답하게 느껴집니다. JS처럼 자유롭게 참조를 넘기고 수정하던 습관을 고쳐야 하니까요. 하지만 이 규칙들 덕분에 Rust는:

- **메모리 안전성**을 런타임 비용 없이 보장
- **데이터 레이스**를 컴파일 타임에 방지
- **Null 포인터 역참조**, **Use-after-free**, **Double-free** 같은 고전적 버그를 원천 차단

Borrow Checker와 싸우다 지칠 때, 이 규칙들이 "당신을 괴롭히려는 게 아니라 당신의 코드를 안전하게 만들려는 것"이라고 기억해주세요. 익숙해지면 Borrow Checker가 없는 언어로 돌아가기 어려워집니다.

---

## 프론트 관점 매핑

- React에서 state를 직접 mutate 하면 버그가 난다 → Rust의 `&mut` 규칙이 그 버그를 컴파일 단계에서 막는다.
- 컴포넌트가 같은 객체를 참조하면 예측 불가능하다 → Rust는 "동시에 하나의 가변 소유자"로 강제한다.
- 상태를 전달할 때 복사/참조를 의식해야 한다 → Rust의 move/borrow가 그대로 대응된다.

## 요약

- Ownership은 "누가 이 값을 책임지는가"를 명확히 한다.
- 소유자는 동시에 하나만 존재한다.
- 참조는 빌리기이며, 규칙을 어기면 컴파일이 실패한다.
- `&mut`는 강력하지만 동시성 안전을 위해 제한된다.
- 이 모델이 데이터 레이스와 use-after-free를 막는다.

## 핵심 코드

```rust runnable
fn main() {
    let s = String::from("hello");
    let len = s.len();
    println!("len = {}", len);
}
```

## 자주 하는 실수

- move와 copy를 구분하지 못하고 값이 사라졌다고 당황한다.
- `&mut`를 여러 곳에서 동시에 쓰려다 막힌다.
- 참조의 수명(lifetime) 문제를 "문법"으로만 본다.

## 연습

1. `String`을 함수에 넘긴 뒤 다시 쓰는 코드를 작성해보고 컴파일 에러를 확인하자.
2. 같은 코드를 `&str` 참조로 바꿔서 에러를 해결해보자.

## 챕터 연결

이전 챕터에서는 문법을 훑었다.
다음 챕터에서는 enum/match 같은 제어 흐름 패턴을 더 깊게 본다.
