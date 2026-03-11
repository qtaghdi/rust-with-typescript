---
title: "용어 사전"
description: "TypeScript ↔ Rust 핵심 개념 대응표 — 막힐 때 바로 찾아보는 레퍼런스"
---

TypeScript 코드를 짜다가 Rust를 배울 때 "이건 Rust에서 뭐지?"라는 질문이 자주 생깁니다. 이 페이지는 TypeScript 개념과 Rust 개념을 1:1로 대응시킨 레퍼런스입니다.

---

## 타입 시스템

| TypeScript | Rust | 설명 |
|---|---|---|
| `string` | `String` / `&str` | `String`은 소유 문자열, `&str`은 borrowed 문자열 슬라이스 |
| `number` | `i32`, `f64`, `u64` 등 | Rust는 정수/부동소수 크기를 명시 |
| `boolean` | `bool` | 동일 |
| `null` / `undefined` | `Option<T>` | `None`으로 표현, unwrap 필요 |
| `T \| null` | `Option<T>` | `Some(T)` 또는 `None` |
| `T \| Error` | `Result<T, E>` | `Ok(T)` 또는 `Err(E)` |
| `any` | (없음) | Rust에는 any 타입 없음. 가장 가까운 건 `Box<dyn Any>` |
| `unknown` | (없음) | 컴파일타임에 모든 타입이 결정 |
| `never` | `!` | 반환하지 않는 타입 (`loop`, `panic` 등) |
| `void` | `()` | unit 타입 |
| `Array<T>` / `T[]` | `Vec<T>` | 동적 배열 |
| `[T, U]` (tuple) | `(T, U)` | 튜플 |
| `Record<K, V>` / `Map<K, V>` | `HashMap<K, V>` | 해시맵 |
| `Set<T>` | `HashSet<T>` | 해시셋 |
| `readonly T[]` | `&[T]` | 불변 슬라이스 |
| Generics `<T>` | Generics `<T>` | 비슷하지만 Rust는 trait bound 필요 |
| `interface Foo {}` | `trait Foo {}` | 행동 정의 |
| `class Foo {}` | `struct Foo {}` + `impl Foo {}` | 데이터 + 메서드 분리 |
| Type union `A \| B \| C` | `enum { A, B, C }` | Rust enum은 데이터 포함 가능 |

---

## 변수 & 제어 흐름

| TypeScript | Rust | 설명 |
|---|---|---|
| `const x = 1` | `let x = 1` | Rust `let`은 기본 불변 |
| `let x = 1` | `let mut x = 1` | 가변 변수에 `mut` 필요 |
| `const` (재할당 불가) | `let` (기본 불변) | 개념적으로 유사 |
| `if / else if / else` | `if / else if / else` | 동일. 단 Rust는 expression |
| `switch` | `match` | Rust `match`는 exhaustive 강제, 값 반환 가능 |
| `for...of` | `for x in iter` | 이터레이터 순회 |
| `while` | `while` | 동일 |
| `for...in` (key 순회) | `.iter().enumerate()` | 인덱스 필요 시 |
| `try / catch / finally` | `Result<T, E>` + `?` 연산자 | 예외 없음, 값으로 에러 처리 |
| `throw new Error()` | `return Err(...)` / `panic!()` | `panic!`은 복구 불가 |
| `?.` (optional chaining) | `.map()` / `if let Some(x) =` | `Option` 체이닝 |
| `??` (nullish coalescing) | `.unwrap_or(default)` | `None`일 때 기본값 |

---

## 함수 & 클로저

| TypeScript | Rust | 설명 |
|---|---|---|
| `function f(x: number): number` | `fn f(x: i32) -> i32` | 함수 선언 |
| `const f = (x) => x + 1` | `\|x\| x + 1` | 클로저 |
| `async function f()` | `async fn f()` | 비동기 함수 |
| `await promise` | `.await` | 비동기 대기 |
| `Promise<T>` | `Future<T>` | 비동기 값 |
| Default params `f(x = 0)` | (없음, `Option<T>` 또는 오버로딩) | 기본값 파라미터 |
| Rest params `...args` | (없음, slice나 `Vec` 사용) | 가변 인자 |
| Destructuring `{ a, b }` | 패턴 매칭 `let (a, b) = ...` | 구조 분해 |

---

## 메모리 & 소유권

| TypeScript 개념 | Rust 개념 | 설명 |
|---|---|---|
| GC (Garbage Collector) | Ownership 시스템 | 컴파일타임 메모리 관리 |
| 참조 (자유롭게 전달) | 소유권 이전 (move) | Rust: 한 번에 하나의 소유자 |
| 참조 (자유롭게 공유) | 불변 참조 `&T` | 여러 개 동시 가능 |
| (없음) | 가변 참조 `&mut T` | 동시에 하나만 가능 |
| (없음) | 라이프타임 `'a` | 참조 유효 기간 명시 |
| Shallow copy | `Clone` trait | 명시적 깊은 복사 |
| (자동 복사) | `Copy` trait | 스택 타입 자동 복사 (`i32`, `bool` 등) |
| `WeakRef` | `Weak<T>` | 순환 참조 방지 |

---

## 패키지 & 도구

| TypeScript / Node.js | Rust | 설명 |
|---|---|---|
| `package.json` | `Cargo.toml` | 패키지 설정 파일 |
| `npm` / `yarn` / `pnpm` | `cargo` | 패키지 매니저 |
| `npmjs.com` | `crates.io` | 패키지 레지스트리 |
| `node_modules/` | `~/.cargo/` + `target/` | 의존성 저장 위치 |
| `npm install foo` | `cargo add foo` | 의존성 추가 |
| `npm run build` | `cargo build` | 빌드 |
| `npm run build` (prod) | `cargo build --release` | 최적화 빌드 |
| `npm test` | `cargo test` | 테스트 실행 |
| `tsc` | `rustc` (직접 쓸 일 거의 없음) | 컴파일러 |
| `tsconfig.json` | `Cargo.toml` + `rustfmt.toml` | 설정 |
| `eslint` | `cargo clippy` | 린터 |
| `prettier` | `rustfmt` | 포매터 |
| `npm workspaces` | `Cargo workspaces` | 모노레포 |

---

## 에러 처리

| TypeScript | Rust | 설명 |
|---|---|---|
| `throw new Error("msg")` | `return Err("msg".into())` | 에러 반환 |
| `try { ... } catch(e) { ... }` | `match result { Ok(v) => ..., Err(e) => ... }` | 에러 처리 |
| `e instanceof TypeError` | `match e { MyError::Type => ... }` | 에러 타입 구분 |
| Error subclassing | `enum MyError { ... }` + `thiserror` | 커스텀 에러 |
| `e.message` | `e.to_string()` | 에러 메시지 |
| (없음) | `?` 연산자 | 에러 전파 (try/catch 없이) |
| `Promise.reject()` | `Err(...)` | 비동기 에러 |

---

## 자주 헷갈리는 Rust 개념

### `String` vs `&str`

`String`은 힙에 할당된 소유 가능한 문자열이고, `&str`은 어딘가에 이미 존재하는 문자열을 가리키는 읽기 전용 슬라이스입니다. 함수 인자로는 대부분 `&str`을 받는 것이 유연하고, 소유권이 필요한 경우에만 `String`을 씁니다.

```rust
fn greet(name: &str) {          // &str: 소유하지 않고 빌려서 읽기
    println!("Hello, {}!", name);
}

let owned: String = String::from("Alice");  // String: 소유
let borrowed: &str = &owned;               // &str: 빌림

greet(&owned);   // String → &str 자동 변환 (Deref coercion)
greet("Bob");    // 문자열 리터럴도 &str
```

### `clone()` vs `copy`

`Copy` trait이 구현된 타입(`i32`, `bool`, `f64`, `char` 등)은 대입 시 자동으로 복사되어 원본이 살아있습니다. `Clone` trait은 명시적으로 `.clone()`을 호출해야 하며, `String`이나 `Vec` 같이 힙 데이터를 가진 타입에 사용합니다.

```rust
let a: i32 = 5;
let b = a;        // Copy: a도 여전히 유효

let s1 = String::from("hello");
let s2 = s1.clone();  // Clone: s1도 여전히 유효
// let s2 = s1;       // 이렇게 하면 s1은 move되어 사용 불가
```

### `unwrap()` vs `expect()` vs `?`

| 방법 | 동작 | 언제 쓸까 |
|---|---|---|
| `.unwrap()` | 값이 없으면 `panic!` | 프로토타이핑, 절대 실패 안 할 때 |
| `.expect("msg")` | 값이 없으면 메시지와 함께 `panic!` | 디버깅, 실패 원인을 명확히 할 때 |
| `?` | 에러를 호출자에게 전파 | 실제 프로덕션 코드, 에러 처리 연쇄 |

```rust
// unwrap: 실패 시 "called unwrap on None"
let x = some_option.unwrap();

// expect: 실패 시 지정한 메시지 출력
let x = some_option.expect("값이 반드시 있어야 합니다");

// ?: 에러를 위로 전파, 함수 반환 타입이 Result여야 함
fn parse_config() -> Result<Config, MyError> {
    let raw = std::fs::read_to_string("config.toml")?;  // 에러면 즉시 반환
    let config: Config = toml::from_str(&raw)?;
    Ok(config)
}
```

### `Box<T>` vs `Rc<T>` vs `Arc<T>`

| 타입 | 용도 |
|---|---|
| `Box<T>` | 힙 할당, 단일 소유 |
| `Rc<T>` | 여러 소유자 (단일 스레드) |
| `Arc<T>` | 여러 소유자 (멀티 스레드) |

`Box<T>`는 크기를 알 수 없는 타입을 힙에 올리거나 소유권을 단순히 힙으로 옮길 때 씁니다. `Rc<T>`는 참조 카운팅으로 여러 곳에서 소유할 수 있게 하되 단일 스레드 전용입니다. `Arc<T>`는 `Rc<T>`의 스레드 안전 버전으로, 멀티 스레드 환경에서 데이터를 공유할 때 씁니다.

### `impl Trait` vs `dyn Trait`

| | `impl Trait` | `dyn Trait` |
|---|---|---|
| 디스패치 방식 | 정적 (static dispatch) | 동적 (dynamic dispatch) |
| 성능 | 컴파일타임 최적화, 빠름 | 런타임 vtable 조회, 약간 느림 |
| 타입 | 컴파일타임에 단일 타입으로 확정 | 런타임에 다양한 타입 가능 |
| 반환 타입 사용 | `fn f() -> impl Trait` | `fn f() -> Box<dyn Trait>` |
| 컬렉션 저장 | 불가 (동일 타입만) | 가능 (`Vec<Box<dyn Trait>>`) |

```rust
// impl Trait: 컴파일타임에 타입이 확정됨 (빠름)
fn make_adder(x: i32) -> impl Fn(i32) -> i32 {
    move |y| x + y
}

// dyn Trait: 런타임에 타입 결정 (유연함)
fn get_shape(kind: &str) -> Box<dyn Shape> {
    match kind {
        "circle" => Box::new(Circle::new()),
        "rect"   => Box::new(Rectangle::new()),
        _        => panic!("unknown shape"),
    }
}
```

---

막히는 개념이 생길 때마다 이 페이지로 돌아오세요. TypeScript에서 익숙한 개념의 Rust 대응어를 빠르게 찾고, 코드 흐름을 이어가는 데 도움이 되길 바랍니다.
