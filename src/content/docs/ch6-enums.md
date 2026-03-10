---
title: "Ch.4 — Enum & 패턴 매칭"
description: "TypeScript union type vs Rust enum, 그리고 match의 힘"
---

TypeScript를 쓰다 보면 `string | number | null` 같은 union type이나 discriminated union을 자주 쓰게 됩니다. Rust의 `enum`은 그 개념을 한 단계 더 밀어붙인 것입니다. 그리고 `match`는 TypeScript의 `switch`와 비슷해 보이지만, 훨씬 강력하고 안전합니다.

이 챕터에서는 TypeScript 개발자의 눈으로 Rust의 `enum`과 패턴 매칭을 살펴봅니다.

---

## 6-1. TypeScript union type vs Rust enum — 기본 비교

### TypeScript: union type

TypeScript에서 "이 값은 여러 타입 중 하나다"라고 표현할 때 union type을 씁니다.

```typescript
// TypeScript — 방향을 나타내는 union type
type Direction = "North" | "South" | "East" | "West";

function move(dir: Direction): string {
  return `Moving ${dir}`;
}

move("North");  // OK
move("Up");     // 컴파일 에러: '"Up"'은 'Direction' 타입에 할당 불가
```

이렇게 string literal union을 쓰면 허용된 값만 들어올 수 있습니다. 하지만 이건 타입 시스템 위의 제약이고, 런타임에서 이 값은 그냥 `string`입니다.

### Rust: enum

Rust에서는 같은 개념을 `enum`으로 표현합니다.

```rust
// Rust — 방향을 나타내는 enum
enum Direction {
    North,
    South,
    East,
    West,
}

fn move_player(dir: Direction) -> String {
    format!("Moving {:?}", dir)  // 실제로는 match를 써야 합니다
}

move_player(Direction::North);  // OK
// move_player("Up");  // 컴파일 에러: 타입이 맞지 않음
```

차이점이 보이시나요? Rust의 `enum`은 **진짜 타입**입니다. `Direction::North`는 `string`이 아니라 `Direction` 타입의 값입니다. 런타임에도 이 타입 정보가 유지됩니다.

### 비교표

| 개념 | TypeScript | Rust |
|------|-----------|------|
| 정의 | `type Dir = "A" \| "B"` | `enum Dir { A, B }` |
| 값 사용 | `"North"` (string) | `Direction::North` |
| 런타임 타입 | string | Direction (enum) |
| 메서드 추가 | 불가 (type alias) | `impl Direction { ... }` |
| 패턴 매칭 | switch/if 수동 | match (컴파일러 강제) |

> **핵심 차이**: TypeScript의 union type은 컴파일 시 사라지는 타입 레이어입니다. Rust의 enum은 진짜 타입으로, 컴파일 후에도 그 구조가 유지됩니다.

### Rust enum에 메서드 붙이기

Rust enum은 `impl` 블록으로 메서드를 붙일 수 있습니다. TypeScript의 string union에는 불가능한 일이죠.

```rust
enum Direction {
    North,
    South,
    East,
    West,
}

impl Direction {
    fn is_vertical(&self) -> bool {
        match self {
            Direction::North | Direction::South => true,
            Direction::East | Direction::West => false,
        }
    }

    fn opposite(&self) -> Direction {
        match self {
            Direction::North => Direction::South,
            Direction::South => Direction::North,
            Direction::East => Direction::West,
            Direction::West => Direction::East,
        }
    }
}

let dir = Direction::North;
println!("{}", dir.is_vertical()); // true
```

---

## 6-2. Enum에 데이터 담기 — Discriminated Union vs Rust Enum with Data

이 부분이 Rust enum이 TypeScript union보다 훨씬 강력한 이유입니다.

### TypeScript: Discriminated Union

TypeScript에서 각 케이스가 다른 데이터를 가져야 할 때 discriminated union 패턴을 씁니다. `kind` 또는 `type` 같은 공통 필드로 어떤 케이스인지 구분합니다.

```typescript
// TypeScript — discriminated union으로 도형 표현
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rectangle"; width: number; height: number }
  | { kind: "triangle"; base: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      return shape.width * shape.height;
    case "triangle":
      return (shape.base * shape.height) / 2;
    default:
      // TypeScript는 여기서 `never` 타입으로 처리됩니다
      const _exhaustive: never = shape;
      throw new Error("Unknown shape");
  }
}

const c: Shape = { kind: "circle", radius: 5 };
console.log(area(c)); // 78.54...
```

동작은 하지만 몇 가지 불편한 점이 있습니다. `kind` 필드를 수동으로 관리해야 하고, `default: never` 패턴을 잊으면 exhaustive 검사가 빠질 수 있습니다.

### Rust: Enum with Data

Rust에서는 각 enum variant에 데이터를 직접 담을 수 있습니다. `kind` 같은 구분자 필드가 필요 없습니다.

```rust
// Rust — enum variant에 데이터를 직접 담기
enum Shape {
    Circle { radius: f64 },
    Rectangle { width: f64, height: f64 },
    Triangle { base: f64, height: f64 },
}

fn area(shape: &Shape) -> f64 {
    match shape {
        Shape::Circle { radius } => std::f64::consts::PI * radius * radius,
        Shape::Rectangle { width, height } => width * height,
        Shape::Triangle { base, height } => base * height / 2.0,
        // 모든 케이스를 처리하지 않으면 컴파일 에러!
    }
}

let c = Shape::Circle { radius: 5.0 };
println!("{:.2}", area(&c)); // 78.54
```

`match`에서 케이스 하나라도 빠지면 **컴파일 자체가 안 됩니다**. `default` 처리를 잊을 걱정이 없습니다.

### Enum Variant의 다양한 형태

Rust enum variant는 세 가지 형태를 가질 수 있습니다.

```rust
enum Message {
    // 1. 데이터 없음 (unit variant)
    Quit,

    // 2. 이름 없는 데이터 (tuple variant)
    Move(i32, i32),

    // 3. 이름 있는 데이터 (struct variant)
    Write { text: String, urgent: bool },
}

// 생성 방법
let q = Message::Quit;
let m = Message::Move(10, 20);
let w = Message::Write {
    text: String::from("hello"),
    urgent: false,
};
```

TypeScript로 비교하면 이렇습니다.

```typescript
// TypeScript 동등 코드
type Message =
  | { kind: "quit" }
  | { kind: "move"; x: number; y: number }
  | { kind: "write"; text: string; urgent: boolean };

const q: Message = { kind: "quit" };
const m: Message = { kind: "move", x: 10, y: 20 };
const w: Message = { kind: "write", text: "hello", urgent: false };
```

Rust 쪽이 더 간결하고, `kind` 같은 discriminant 필드를 별도로 쓸 필요가 없습니다.

### 실행해보기

```rust runnable
enum Direction {
    North,
    South,
    East,
    West,
}

fn main() {
    let dir = Direction::West;
    let label = match dir {
        Direction::North => "N",
        Direction::South => "S",
        Direction::East => "E",
        Direction::West => "W",
    };
    println!("dir = {}", label);
}
```

---

## 6-3. match 표현식 — TypeScript switch vs Rust match

### TypeScript: switch 문

TypeScript의 `switch`는 JavaScript에서 물려받은 문(statement)입니다. 값을 반환하려면 변수에 담아야 하고, `break`를 빠뜨리면 fall-through가 발생합니다.

```typescript
// TypeScript — switch 문
type Color = "red" | "green" | "blue";

function colorToHex(color: Color): string {
  let hex: string;  // 외부 변수가 필요

  switch (color) {
    case "red":
      hex = "#FF0000";
      break;
    case "green":
      hex = "#00FF00";
      break;
    case "blue":
      hex = "#0000FF";
      break;
    // default를 안 써도 컴파일 에러 없음!
    // 새 케이스 추가 시 이걸 잊으면 hex가 undefined가 됨
  }

  return hex!; // non-null assertion이 필요 (위험 신호)
}
```

새로운 색상을 `Color` union에 추가했을 때, `switch`에 추가하는 걸 잊어도 TypeScript는 기본적으로 경고하지 않습니다.

### Rust: match 표현식

Rust의 `match`는 **표현식(expression)** 입니다. 값을 직접 반환하고, 모든 케이스를 빠짐없이 처리해야만 컴파일됩니다.

```rust
// Rust — match 표현식
enum Color {
    Red,
    Green,
    Blue,
}

fn color_to_hex(color: Color) -> &'static str {
    match color {
        Color::Red   => "#FF0000",
        Color::Green => "#00FF00",
        Color::Blue  => "#0000FF",
        // 새 variant 추가 시 여기도 추가하지 않으면 컴파일 에러!
    }
}

// match는 표현식이므로 바로 할당 가능
let hex = match Color::Red {
    Color::Red   => "#FF0000",
    Color::Green => "#00FF00",
    Color::Blue  => "#0000FF",
};
```

만약 `Color` enum에 `Yellow`를 추가하면 어떻게 될까요?

```rust
enum Color {
    Red,
    Green,
    Blue,
    Yellow,  // 새로 추가
}

fn color_to_hex(color: Color) -> &'static str {
    match color {
        Color::Red   => "#FF0000",
        Color::Green => "#00FF00",
        Color::Blue  => "#0000FF",
        // Color::Yellow를 처리 안 하면...
        // error[E0004]: non-exhaustive patterns: `Color::Yellow` not covered
    }
}
```

컴파일러가 정확히 어떤 케이스가 빠졌는지 알려줍니다. 새 케이스 추가 시 관련 코드를 모두 업데이트하도록 **강제**됩니다.

### match의 다양한 패턴

Rust의 `match`는 단순 값 비교를 넘어서 다양한 패턴을 지원합니다.

```rust
let num = 7;

let description = match num {
    // 단일 값
    1 => "one",

    // OR 패턴 (|)
    2 | 3 => "two or three",

    // 범위 패턴 (..=)
    4..=6 => "four to six",

    // 조건 추가 (guard)
    n if n % 2 == 0 => "even, greater than 6",

    // 나머지 (wildcard)
    _ => "odd, greater than 6",
};

println!("{}", description); // "odd, greater than 6"
```

TypeScript로 같은 걸 쓰면 훨씬 장황해집니다.

```typescript
// TypeScript 동등 코드
const num = 7;

const description =
  num === 1 ? "one"
  : num === 2 || num === 3 ? "two or three"
  : num >= 4 && num <= 6 ? "four to six"
  : num > 6 && num % 2 === 0 ? "even, greater than 6"
  : "odd, greater than 6";
```

### 구조 분해 패턴

`match`는 enum variant의 내부 데이터를 꺼내는 것도 한 번에 처리합니다.

```rust
enum Point {
    TwoD { x: f64, y: f64 },
    ThreeD { x: f64, y: f64, z: f64 },
}

fn describe_point(p: Point) -> String {
    match p {
        // struct variant 구조 분해
        Point::TwoD { x, y } => {
            format!("2D point at ({}, {})", x, y)
        }
        // 특정 값 매칭 + 나머지 캡처
        Point::ThreeD { x: 0.0, y: 0.0, z } => {
            format!("On the Z-axis at z={}", z)
        }
        Point::ThreeD { x, y, z } => {
            format!("3D point at ({}, {}, {})", x, y, z)
        }
    }
}
```

```typescript
// TypeScript 동등 코드
type Point =
  | { kind: "2d"; x: number; y: number }
  | { kind: "3d"; x: number; y: number; z: number };

function describePoint(p: Point): string {
  if (p.kind === "2d") {
    return `2D point at (${p.x}, ${p.y})`;
  } else if (p.x === 0 && p.y === 0) {
    return `On the Z-axis at z=${p.z}`;
  } else {
    return `3D point at (${p.x}, ${p.y}, ${p.z})`;
  }
}
```

TypeScript 쪽은 `p.kind` 체크와 프로퍼티 접근이 분리되어 있고, exhaustive 검사를 위해 별도 작업이 필요합니다. Rust의 `match`는 이것을 하나의 표현식으로 통합합니다.

---

## 6-4. Option\<T\>와 match — null 안전성의 핵심

Ch.2에서 잠깐 봤던 `Option<T>`를 이제 더 깊이 살펴봅니다. Rust에는 `null`이나 `undefined`가 없습니다. "값이 없을 수 있다"는 상황은 항상 `Option<T>`로 표현합니다.

### TypeScript: null / undefined

```typescript
// TypeScript — null이 여기저기 숨어있을 수 있음
function findUser(id: number): { name: string } | null {
  if (id === 1) {
    return { name: "Alice" };
  }
  return null;
}

const user = findUser(2);

// 깜빡하고 null 체크를 안 하면?
// console.log(user.name); // 런타임 에러: Cannot read properties of null

// null 체크 필요
if (user !== null) {
  console.log(user.name); // 안전
}

// Optional chaining으로 단축
console.log(user?.name); // undefined (에러 없음)
```

TypeScript strict 모드에서는 null 체크를 강제하지만, `as any`나 `!` 연산자로 우회할 수 있습니다.

### Rust: Option\<T\>

```rust
// Rust — "값이 없을 수 있음"을 타입으로 표현
struct User {
    name: String,
}

fn find_user(id: u32) -> Option<User> {
    if id == 1 {
        Some(User { name: String::from("Alice") })
    } else {
        None
    }
}

let user = find_user(2); // Option<User> 타입

// Option을 무시하고 값을 쓸 수 없음 — 컴파일 에러
// println!("{}", user.name);

// match로 명시적 처리
match user {
    Some(u) => println!("Found: {}", u.name),
    None    => println!("User not found"),
}
```

`Option<T>`는 그냥 Rust 표준 라이브러리에 정의된 enum입니다.

```rust
// 표준 라이브러리의 Option 정의 (개념적으로)
enum Option<T> {
    Some(T),
    None,
}
```

`Some(value)`와 `None` 두 케이스만 있고, `match`로 둘 다 처리해야만 컴파일됩니다.

### Option의 유용한 메서드

매번 `match`를 쓰면 장황해질 수 있어서, `Option`에는 편리한 메서드들이 많습니다.

```rust
let maybe_name: Option<String> = Some(String::from("Alice"));
let no_name: Option<String> = None;

// unwrap_or: None일 때 기본값 반환
let name1 = maybe_name.unwrap_or(String::from("Anonymous"));
let name2 = no_name.unwrap_or(String::from("Anonymous"));
println!("{}, {}", name1, name2); // Alice, Anonymous

// map: Some 안의 값을 변환 (None은 그대로)
let length: Option<usize> = maybe_name.as_ref().map(|s| s.len());
println!("{:?}", length); // Some(5)

// unwrap_or_else: None일 때 클로저 실행
let name3 = no_name.unwrap_or_else(|| String::from("Guest"));
println!("{}", name3); // Guest

// is_some(), is_none(): 확인만 할 때
if maybe_name.is_some() {
    println!("값이 있음");
}
```

TypeScript의 `??`, `?.`, `|| defaultValue`와 대응됩니다.

```typescript
// TypeScript 비교
const maybeName: string | null = "Alice";
const noName: string | null = null;

const name1 = maybeName ?? "Anonymous"; // "Alice"
const name2 = noName ?? "Anonymous";    // "Anonymous"

const length = maybeName?.length;       // 5 | undefined

if (maybeName !== null) {
  console.log("값이 있음");
}
```

---

## 6-5. if let — match의 단축 문법

값이 하나의 특정 패턴일 때만 처리하고 나머지는 무시하고 싶을 때, `match`를 쓰면 조금 장황합니다.

### match vs if let 비교

```rust
let config: Option<u32> = Some(42);

// match로 쓰면: None 케이스도 명시해야 함
match config {
    Some(value) => println!("설정값: {}", value),
    None => {}  // 아무것도 안 해도 이 줄이 있어야 함
}

// if let으로 단축: 관심 있는 케이스만 처리
if let Some(value) = config {
    println!("설정값: {}", value);
}
// None일 때는 그냥 넘어감
```

TypeScript로 비교하면 `if (x !== null)` 패턴과 유사합니다.

```typescript
// TypeScript 비교
const config: number | null = 42;

if (config !== null) {
  console.log(`설정값: ${config}`);
}
```

하지만 `if let`은 단순 null 체크를 넘어서 복잡한 구조도 한 번에 처리합니다.

```rust
// if let으로 enum variant 매칭
enum Response {
    Ok { body: String, status: u16 },
    Error { code: u32, message: String },
}

let resp = Response::Ok {
    body: String::from("Hello"),
    status: 200,
};

if let Response::Ok { body, status } = resp {
    println!("성공: {} ({})", body, status);
}
// Response::Error는 무시

// else 브랜치도 추가 가능
let resp2 = Response::Error { code: 404, message: String::from("Not Found") };

if let Response::Ok { body, status } = resp2 {
    println!("성공: {} ({})", body, status);
} else {
    println!("요청 실패");
}
```

### while let

루프에도 같은 패턴을 적용할 수 있습니다. 특정 패턴이 맞는 동안 계속 실행합니다.

```rust
let mut stack = vec![1, 2, 3, 4, 5];

// stack.pop()은 Option<i32>를 반환
// Some(value)인 동안 계속 실행, None이 되면 종료
while let Some(top) = stack.pop() {
    print!("{} ", top); // 5 4 3 2 1
}
```

TypeScript로 쓰면 이렇습니다.

```typescript
// TypeScript 비교
const stack = [1, 2, 3, 4, 5];

let top: number | undefined;
while ((top = stack.pop()) !== undefined) {
  process.stdout.write(`${top} `); // 5 4 3 2 1
}
```

Rust 쪽이 의도가 더 명확하게 드러납니다.

### if let chains (Rust 1.64+)

여러 조건을 연달아 확인할 때 `if let`을 체인으로 연결할 수 있습니다.

```rust
struct Config {
    host: Option<String>,
    port: Option<u16>,
}

let cfg = Config {
    host: Some(String::from("localhost")),
    port: Some(8080),
};

// if let chain: 둘 다 Some일 때만 실행
if let Some(host) = &cfg.host
    && let Some(port) = cfg.port
{
    println!("접속: {}:{}", host, port); // 접속: localhost:8080
}
```

```typescript
// TypeScript 비교
interface Config {
  host: string | null;
  port: number | null;
}

const cfg: Config = { host: "localhost", port: 8080 };

if (cfg.host !== null && cfg.port !== null) {
  console.log(`접속: ${cfg.host}:${cfg.port}`);
}
```

---

## 6-6. 실전: 상태 머신 — HTTP 요청 상태

이제까지 배운 것을 모아서 실전 예제를 만들어봅니다. HTTP 요청의 상태를 표현하는 상태 머신입니다. 프론트엔드 개발에서 아주 흔한 패턴입니다.

### TypeScript 구현

```typescript
// TypeScript — HTTP 요청 상태 관리

// 상태 정의
type RequestState<T> =
  | { status: "pending" }
  | { status: "loading"; progress: number }
  | { status: "success"; data: T; timestamp: Date }
  | { status: "error"; error: Error; retryCount: number };

// 사용자 데이터 타입
interface User {
  id: number;
  name: string;
  email: string;
}

// 상태에 따른 UI 메시지 반환
function renderState(state: RequestState<User>): string {
  switch (state.status) {
    case "pending":
      return "요청 대기 중...";

    case "loading":
      return `로딩 중... ${state.progress}%`;

    case "success":
      return `완료! 사용자: ${state.data.name} (${state.timestamp.toISOString()})`;

    case "error":
      return `에러: ${state.error.message} (재시도: ${state.retryCount}회)`;

    default:
      // exhaustive 검사를 위한 보일러플레이트
      const _exhaustive: never = state;
      throw new Error("Unknown state");
  }
}

// 상태 전환 함수
function startLoading(state: RequestState<User>): RequestState<User> {
  if (state.status !== "pending") {
    throw new Error("pending 상태에서만 loading으로 전환 가능");
  }
  return { status: "loading", progress: 0 };
}

function updateProgress(
  state: RequestState<User>,
  progress: number
): RequestState<User> {
  if (state.status !== "loading") {
    throw new Error("loading 상태에서만 progress 업데이트 가능");
  }
  return { ...state, progress };
}

function complete(
  state: RequestState<User>,
  data: User
): RequestState<User> {
  if (state.status !== "loading") {
    throw new Error("loading 상태에서만 success로 전환 가능");
  }
  return { status: "success", data, timestamp: new Date() };
}

function fail(
  state: RequestState<User>,
  error: Error
): RequestState<User> {
  const retryCount =
    state.status === "error" ? state.retryCount + 1 : 0;
  return { status: "error", error, retryCount };
}

// 사용 예시
let state: RequestState<User> = { status: "pending" };
console.log(renderState(state)); // 요청 대기 중...

state = startLoading(state);
console.log(renderState(state)); // 로딩 중... 0%

state = updateProgress(state, 50);
console.log(renderState(state)); // 로딩 중... 50%

state = complete(state, { id: 1, name: "Alice", email: "alice@example.com" });
console.log(renderState(state)); // 완료! 사용자: Alice (...)
```

### Rust 구현

```rust
// Rust — HTTP 요청 상태 관리

use std::time::SystemTime;

// 사용자 데이터 구조체
#[derive(Debug)]
struct User {
    id: u32,
    name: String,
    email: String,
}

// 상태 enum — 각 variant에 데이터를 직접 담음
#[derive(Debug)]
enum RequestState {
    Pending,
    Loading { progress: u8 },
    Success { data: User, timestamp: SystemTime },
    Error { message: String, retry_count: u32 },
}

impl RequestState {
    // 상태에 따른 UI 메시지 반환
    fn render(&self) -> String {
        match self {
            RequestState::Pending => {
                String::from("요청 대기 중...")
            }
            RequestState::Loading { progress } => {
                format!("로딩 중... {}%", progress)
            }
            RequestState::Success { data, .. } => {
                format!("완료! 사용자: {}", data.name)
            }
            RequestState::Error { message, retry_count } => {
                format!("에러: {} (재시도: {}회)", message, retry_count)
            }
            // 케이스를 하나라도 빠뜨리면 컴파일 에러!
        }
    }

    // 상태 전환: Pending → Loading
    fn start_loading(self) -> Result<RequestState, String> {
        match self {
            RequestState::Pending => Ok(RequestState::Loading { progress: 0 }),
            other => Err(format!(
                "Pending 상태에서만 Loading으로 전환 가능 (현재: {:?})",
                other
            )),
        }
    }

    // 상태 전환: Loading → Loading (progress 업데이트)
    fn update_progress(self, new_progress: u8) -> Result<RequestState, String> {
        match self {
            RequestState::Loading { .. } => {
                Ok(RequestState::Loading { progress: new_progress })
            }
            other => Err(format!(
                "Loading 상태에서만 progress 업데이트 가능 (현재: {:?})",
                other
            )),
        }
    }

    // 상태 전환: Loading → Success
    fn complete(self, data: User) -> Result<RequestState, String> {
        match self {
            RequestState::Loading { .. } => Ok(RequestState::Success {
                data,
                timestamp: SystemTime::now(),
            }),
            other => Err(format!(
                "Loading 상태에서만 Success로 전환 가능 (현재: {:?})",
                other
            )),
        }
    }

    // 상태 전환: 어느 상태에서든 Error로 전환
    fn fail(self, message: String) -> RequestState {
        let retry_count = match &self {
            RequestState::Error { retry_count, .. } => retry_count + 1,
            _ => 0,
        };
        RequestState::Error { message, retry_count }
    }
}

fn main() {
    // 상태 머신 사용
    let state = RequestState::Pending;
    println!("{}", state.render()); // 요청 대기 중...

    let state = state.start_loading().expect("상태 전환 실패");
    println!("{}", state.render()); // 로딩 중... 0%

    let state = state.update_progress(50).expect("상태 전환 실패");
    println!("{}", state.render()); // 로딩 중... 50%

    let user = User {
        id: 1,
        name: String::from("Alice"),
        email: String::from("alice@example.com"),
    };

    let state = state.complete(user).expect("상태 전환 실패");
    println!("{}", state.render()); // 완료! 사용자: Alice

    // 에러 상태로도 테스트
    let error_state = RequestState::Pending
        .start_loading()
        .unwrap()
        .fail(String::from("Network timeout"));
    println!("{}", error_state.render()); // 에러: Network timeout (재시도: 0회)
}
```

### TypeScript vs Rust 구현 비교

| 항목 | TypeScript | Rust |
|------|-----------|------|
| 상태 정의 | discriminated union (kind 필드 필요) | enum variant (데이터 직접 담음) |
| exhaustive 검사 | `default: never` 보일러플레이트 수동 | 컴파일러가 자동으로 강제 |
| 잘못된 전환 | 런타임 throw | `Result<T, E>`로 타입 레벨에서 표현 |
| 새 상태 추가 시 | switch 업데이트를 잊을 수 있음 | 컴파일 에러로 모든 match 업데이트 강제 |
| 메서드 | 별도 함수로 분리 | `impl` 블록으로 enum에 직접 붙임 |

---

## 정리

Rust의 `enum`과 `match`는 TypeScript의 discriminated union과 `switch`에서 출발하지만, 훨씬 더 안전하고 표현력 있습니다.

**핵심 포인트:**

1. **Rust enum은 진짜 타입이다** — variant에 데이터를 직접 담을 수 있고, 메서드도 붙일 수 있습니다.

2. **match는 exhaustive가 기본이다** — 케이스를 빠뜨리면 컴파일 자체가 안 됩니다. `default: never` 보일러플레이트가 필요 없습니다.

3. **Option\<T\>은 null의 안전한 대체재다** — `null`이나 `undefined` 대신 `Option<T>`를 쓰면 컴파일러가 null 처리를 강제합니다.

4. **if let은 match의 단축 문법이다** — 하나의 케이스만 관심 있을 때 쓰면 코드가 간결해집니다.

5. **상태 머신은 enum과 match의 최고 활용 사례다** — 상태 전환의 안전성을 컴파일 타임에 보장할 수 있습니다.

TypeScript에서 discriminated union 패턴을 자주 써봤다면, Rust의 enum과 match는 그 패턴을 언어 레벨에서 제대로 지원하는 것처럼 느껴질 것입니다. 한 번 익숙해지면 TypeScript로 돌아갔을 때 exhaustive 검사의 부재가 오히려 불안하게 느껴질 정도입니다.

---

## 프론트 관점 매핑

- UI 상태 머신(loading/success/error) ↔ Rust의 `enum` + `match`
- React에서 상태 전환을 함수로 관리 ↔ Rust는 enum에 메서드를 붙여 전환을 캡슐화
- switch 누락으로 생기는 버그 ↔ Rust는 exhaustive match로 컴파일 단계에서 차단

## 챕터 연결

이전 챕터에서는 기본 문법과 타입 대응을 정리했다.
다음 챕터에서는 Rust의 트레이트(trait) 시스템을 TypeScript의 인터페이스와 비교해 살펴본다.
