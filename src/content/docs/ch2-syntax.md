---
title: "Ch.3 — 문법 기초"
description: "변수, 함수, 타입, async/await 등 핵심 문법 대조"
---

## 2-1. 변수와 타입

### 기본 선언

TypeScript에서는 `let`과 `const`로 변수를 선언합니다. Rust에서는 둘 다 `let`이지만, **기본이 불변(immutable)** 입니다.

```typescript
// TypeScript
let count = 0;          // 타입 추론: number
const name = "Alice";   // 재할당 불가
let age: number = 30;   // 명시적 타입

count = 1;  // OK
// name = "Bob"; // 에러: const는 재할당 불가
```

```rust
// Rust
let count = 0;        // 타입 추론: i32, 그리고 기본이 불변!
let name = "Alice";   // 불변
let age: u32 = 30;    // 명시적 타입

// count = 1; // 컴파일 에러: cannot assign twice to immutable variable

let mut count = 0;    // mut을 붙여야 변경 가능
count = 1;            // OK
```

> **핵심 차이**: TypeScript의 `let`은 "재할당 가능", Rust의 `let`은 기본이 "재할당 불가". Rust에서 변경이 필요하면 `let mut`을 써야 합니다.

### 변수와 타입 비교표

| 개념 | TypeScript | Rust |
|------|-----------|------|
| 불변 변수 | `const x = 1` | `let x = 1` |
| 가변 변수 | `let x = 1` | `let mut x = 1` |
| 타입 명시 | `let x: number = 1` | `let x: i32 = 1` |
| 타입 추론 | O (number, string 등) | O (i32, &str 등) |
| 전역 상수 | `const MAX = 100` | `const MAX: u32 = 100` |
| 사용 전 선언 | 선택적 | 필수 |

### 숫자 타입

TypeScript는 `number` 하나지만, Rust는 크기와 부호에 따라 나뉩니다.

```typescript
// TypeScript: number 하나로 모든 숫자
let a: number = 42;
let b: number = 3.14;
let c: number = -10;
```

```rust
// Rust: 정수와 부동소수점이 구분되고, 크기도 지정
let a: i32 = 42;      // 32비트 정수 (부호 있음)
let b: f64 = 3.14;    // 64비트 부동소수점
let c: i64 = -10;     // 64비트 정수 (부호 있음)
let d: u32 = 100;     // 32비트 정수 (부호 없음, 0 이상)
let e: usize = 10;    // 플랫폼 크기 (배열 인덱스에 사용)
```

### Shadowing: Rust만의 특이한 기능

Rust에서는 같은 이름으로 새 변수를 선언(shadowing)할 수 있습니다. TypeScript에서는 같은 스코프에서 불가능합니다.

```typescript
// TypeScript — 같은 스코프에서 재선언 불가
let value = "42";
// let value = parseInt(value); // 에러: 중복 선언
let numValue = parseInt(value); // 다른 이름 써야 함
```

```rust
// Rust — Shadowing: 같은 이름, 다른 타입도 OK
let value = "42";
let value = value.parse::<i32>().unwrap(); // 타입이 &str → i32로 바뀜
// 이전 value는 사라지고 새 value(i32)가 됨
println!("{}", value); // 42
```

Shadowing은 "같은 개념의 값을 변환할 때" 유용합니다. `mut`과 달리 타입을 바꿀 수 있고, 변환 후에는 원래 값에 접근할 수 없습니다.

---

## 2-2. 함수

### 기본 함수 문법

```typescript
// TypeScript
function add(a: number, b: number): number {
  return a + b;
}

// 화살표 함수
const multiply = (a: number, b: number): number => a * b;

// 기본값 매개변수
function greet(name: string, greeting: string = "Hello"): string {
  return `${greeting}, ${name}!`;
}

// 선택적 매개변수
function log(message: string, level?: string): void {
  console.log(`[${level ?? "INFO"}] ${message}`);
}
```

```rust
// Rust
fn add(a: i32, b: i32) -> i32 {
    a + b  // return 키워드 생략 가능 (마지막 표현식이 반환값)
}

// 클로저 (화살표 함수 대응)
let multiply = |a: i32, b: i32| -> i32 { a * b };
let multiply_short = |a: i32, b: i32| a * b; // 단일 표현식은 중괄호 생략

// 기본값은 없음 → 별도 함수나 Option으로 처리
fn greet(name: &str, greeting: &str) -> String {
    format!("{}, {}!", greeting, name)
}

fn greet_default(name: &str) -> String {
    greet(name, "Hello")
}

// 선택적 매개변수 → Option<T> 사용
fn log(message: &str, level: Option<&str>) {
    println!("[{}] {}", level.unwrap_or("INFO"), message);
}

// 호출 시
log("Server started", Some("DEBUG"));
log("Server started", None);
```

### 반환 타입: return vs 마지막 표현식

Rust에서 `return`은 조기 반환(early return)에만 씁니다. 함수 마지막 표현식은 자동으로 반환됩니다.

```rust
fn classify(n: i32) -> &'static str {
    if n < 0 {
        return "negative"; // 조기 반환
    }
    if n == 0 {
        "zero"  // return 없음 — 마지막 표현식
    } else {
        "positive"
    }
}
```

> 세미콜론(`;`)에 주의: Rust에서 세미콜론이 있으면 "문(statement)", 없으면 "식(expression)"입니다. 반환값이 되려면 마지막 줄에 세미콜론이 없어야 합니다.

### 클로저 비교

```typescript
// TypeScript 클로저
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
const evens = numbers.filter(n => n % 2 === 0);
const sum = numbers.reduce((acc, n) => acc + n, 0);
```

```rust
// Rust 클로저
let numbers = vec![1, 2, 3, 4, 5];
let doubled: Vec<i32> = numbers.iter().map(|n| n * 2).collect();
let evens: Vec<&i32> = numbers.iter().filter(|n| *n % 2 == 0).collect();
let sum: i32 = numbers.iter().sum();
// 또는
let sum: i32 = numbers.iter().fold(0, |acc, n| acc + n);
```

---

## 2-3. 인터페이스 → struct / trait

### TypeScript interface vs Rust struct

TypeScript의 `interface`는 객체의 형태(shape)를 정의합니다. Rust에서 데이터 구조는 `struct`로, 동작은 `impl`과 `trait`으로 분리합니다.

```typescript
// TypeScript
interface User {
  id: number;
  name: string;
  email: string;
}

interface Greetable {
  greet(): string;
}

class User implements Greetable {
  constructor(
    public id: number,
    public name: string,
    public email: string,
  ) {}

  greet(): string {
    return `Hi, I'm ${this.name}`;
  }
}

const user = new User(1, "Alice", "alice@example.com");
console.log(user.greet()); // "Hi, I'm Alice"
```

```rust
// Rust: 데이터(struct)와 동작(impl, trait)을 분리
struct User {
    id: u32,
    name: String,
    email: String,
}

// 메서드 구현 (class의 메서드와 유사)
impl User {
    // 생성자 패턴 (new는 관례적 이름, 특별한 키워드 아님)
    fn new(id: u32, name: String, email: String) -> User {
        User { id, name, email }
    }
}

// trait = TypeScript의 interface (동작 정의)
trait Greetable {
    fn greet(&self) -> String;
}

// User가 Greetable을 구현
impl Greetable for User {
    fn greet(&self) -> String {
        format!("Hi, I'm {}", self.name)
    }
}

let user = User::new(1, "Alice".to_string(), "alice@example.com".to_string());
println!("{}", user.greet()); // "Hi, I'm Alice"
```

### 핵심 차이: 데이터와 동작의 분리

| 개념 | TypeScript | Rust |
|------|-----------|------|
| 데이터 구조 | `interface` / `class` | `struct` |
| 동작 정의 | `interface` (메서드 시그니처) | `trait` |
| 동작 구현 | `class implements Interface` | `impl Trait for Struct` |
| 생성자 | `constructor` | `fn new()`(관례) |
| `this` | `this` | `self` / `&self` / `&mut self` |
| 상속 | `extends` | 없음 (조합으로 대체) |

### 여러 trait 구현

```typescript
// TypeScript
interface Printable {
  print(): void;
}
interface Serializable {
  serialize(): string;
}

class User implements Printable, Serializable {
  print(): void { console.log(this.name); }
  serialize(): string { return JSON.stringify(this); }
}
```

```rust
// Rust
trait Printable {
    fn print(&self);
}
trait Serializable {
    fn serialize(&self) -> String;
}

impl Printable for User {
    fn print(&self) { println!("{}", self.name); }
}
impl Serializable for User {
    fn serialize(&self) -> String {
        format!(r#"{{"id":{},"name":"{}"}}"#, self.id, self.name)
    }
}
```

---

## 2-4. null/undefined → Option\<T\>

### TypeScript의 null/undefined

```typescript
// TypeScript
function findUser(id: number): User | null {
  const user = users.find(u => u.id === id);
  return user ?? null;
}

const user = findUser(1);

// optional chaining
const city = user?.profile?.address?.city;

// nullish coalescing
const displayName = user?.name ?? "Anonymous";

// null 체크 후 사용
if (user !== null && user !== undefined) {
  console.log(user.name); // user가 User임이 보장됨
}
```

### Rust의 Option\<T\>

Rust에는 `null`이 없습니다. 대신 값이 있을 수도 없을 수도 있는 상황을 `Option<T>`로 표현합니다.

```rust
// Rust
fn find_user(id: u32) -> Option<User> {
    users.iter().find(|u| u.id == id).cloned()
}

let user = find_user(1);

// match로 분기
match user {
    Some(u) => println!("{}", u.name),
    None => println!("User not found"),
}

// if let — 값이 있을 때만 실행
if let Some(u) = find_user(1) {
    println!("{}", u.name);
}

// unwrap_or — 기본값 제공 (nullish coalescing ??)
let name = find_user(1)
    .map(|u| u.name.clone())
    .unwrap_or_else(|| "Anonymous".to_string());

// ? 연산자 — Option을 체이닝 (optional chaining과 유사)
fn get_city(user_id: u32) -> Option<String> {
    let user = find_user(user_id)?;  // None이면 즉시 None 반환
    let profile = user.profile?;
    let address = profile.address?;
    Some(address.city.clone())
}
```

### 대응 관계 정리

| TypeScript | Rust | 의미 |
|-----------|------|------|
| `T \| null` | `Option<T>` | 값이 없을 수 있음 |
| `null` / `undefined` | `None` | 값 없음 |
| 값 있음 | `Some(value)` | 값 있음 |
| `?.` (optional chaining) | `?` 연산자 | None이면 조기 반환 |
| `?? "default"` | `.unwrap_or("default")` | 없으면 기본값 |
| `?? fn()` | `.unwrap_or_else(\|\| fn())` | 없으면 함수 실행 |
| null 체크 후 사용 | `if let Some(x) = ...` | 패턴 매칭 |
| `!` (non-null assertion) | `.unwrap()` | 값 있다고 강제 (panic 위험) |

> **왜 이게 더 나을까?** TypeScript에서 `string | null`은 `string`을 기대하는 곳에 실수로 넘길 수 있고, 컴파일러가 모든 경로를 강제하지 않습니다. Rust의 `Option<T>`는 반드시 `Some` / `None` 케이스를 처리해야 컴파일됩니다.

---

## 2-5. try/catch → Result\<T, E\>

### TypeScript의 예외 처리

```typescript
// TypeScript
function readFile(path: string): string {
  try {
    return fs.readFileSync(path, "utf-8");
  } catch (e) {
    // e의 타입이 unknown... 뭔지 모름
    throw new Error(`Failed to read file: ${e}`);
  }
}

async function processData(path: string): Promise<Data> {
  try {
    const raw = readFile(path);
    const json = JSON.parse(raw); // 파싱 실패 가능
    return validate(json);        // 검증 실패 가능
  } catch (e) {
    // 어디서 실패했는지 알기 어려움
    console.error(e);
    throw e;
  }
}
```

**문제점:**
- `catch`의 `e`는 `unknown` 타입 — 뭔지 모름
- 함수 시그니처에 "이 함수는 에러를 던질 수 있다"는 정보가 없음
- 에러를 처리했는지 안 했는지 컴파일러가 강제하지 않음

### Rust의 Result\<T, E\>

```rust
use std::fs;
use std::io;
use serde_json;

// 함수 시그니처에 에러 타입이 명시됨
fn read_file(path: &str) -> Result<String, io::Error> {
    fs::read_to_string(path) // Result<String, io::Error> 반환
}

fn parse_json(content: &str) -> Result<serde_json::Value, serde_json::Error> {
    serde_json::from_str(content)
}

// ? 연산자: 에러면 즉시 반환, 성공이면 값을 꺼냄
fn process_data(path: &str) -> Result<Data, Box<dyn std::error::Error>> {
    let raw = read_file(path)?;       // 실패하면 io::Error 반환
    let json = parse_json(&raw)?;     // 실패하면 serde_json::Error 반환
    let data = validate(json)?;       // 실패하면 ValidationError 반환
    Ok(data)
}

// 호출부에서 반드시 처리
match process_data("config.json") {
    Ok(data) => println!("Loaded: {:?}", data),
    Err(e) => eprintln!("Error: {}", e),
}

// 또는 짧게
let data = process_data("config.json").expect("Failed to load config");
```

### ? 연산자: try/catch 체이닝의 깔끔한 대안

```typescript
// TypeScript — 중첩 try/catch
async function loadConfig(): Promise<Config> {
  let raw: string;
  try {
    raw = await fs.readFile("config.json", "utf-8");
  } catch (e) {
    throw new Error(`Read failed: ${e}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Parse failed: ${e}`);
  }

  return validateConfig(parsed);
}
```

```rust
// Rust — ? 연산자로 깔끔하게
async fn load_config() -> Result<Config, AppError> {
    let raw = fs::read_to_string("config.json")?;  // 실패 시 즉시 Err 반환
    let parsed: serde_json::Value = serde_json::from_str(&raw)?;
    let config = validate_config(parsed)?;
    Ok(config)
}
```

### 대응 관계 정리

| TypeScript | Rust | 의미 |
|-----------|------|------|
| `try { ... }` | `Result<T, E>` | 실패 가능 연산 |
| `throw new Error(...)` | `Err(MyError::...)` | 에러 반환 |
| 성공 값 반환 | `Ok(value)` | 성공 값 래핑 |
| `catch (e)` | `match res { Err(e) => ... }` | 에러 처리 |
| `finally` | `Drop` trait (자동 정리) | 정리 코드 |
| 에러 전파 | 수동 `throw` | `?` 연산자 |
| 에러 타입 | 없음 (런타임에 알게 됨) | 컴파일 타임에 명시 |

---

## 2-6. async/await

### TypeScript의 비동기

```typescript
// TypeScript + Node.js
async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }
  return response.json() as Promise<User>;
}

async function main() {
  const user = await fetchUser(1);
  console.log(user.name);
}

// Promise.all — 병렬 실행
const [user, posts] = await Promise.all([
  fetchUser(1),
  fetchPosts(1),
]);
```

### Rust의 비동기 (Tokio 런타임)

```rust
// Rust + Tokio + reqwest
use tokio;
use reqwest;

async fn fetch_user(id: u32) -> Result<User, reqwest::Error> {
    let url = format!("http://api/users/{}", id);
    let user = reqwest::get(&url)
        .await?           // .await로 Future를 실행
        .json::<User>()
        .await?;
    Ok(user)
}

#[tokio::main]  // main 함수를 비동기로 만드는 매크로
async fn main() {
    let user = fetch_user(1).await.expect("Failed to fetch user");
    println!("{}", user.name);
}

// 병렬 실행 — tokio::join!
let (user, posts) = tokio::join!(
    fetch_user(1),
    fetch_posts(1),
);
```

### Promise vs Future

| 개념 | TypeScript | Rust |
|------|-----------|------|
| 비동기 타입 | `Promise<T>` | `Future<Output = T>` |
| 비동기 함수 | `async function` | `async fn` |
| 기다리기 | `await` | `.await` |
| 즉시 실행 | O (생성 시 실행) | X (폴링될 때 실행) |
| 런타임 | Node.js (내장) | Tokio, async-std 등 (선택) |
| 병렬 실행 | `Promise.all()` | `tokio::join!()` |
| 에러 처리 | `try/catch` | `?` + `Result` |

**중요한 차이**: JavaScript의 `Promise`는 생성되자마자 실행을 시작합니다. Rust의 `Future`는 `.await`로 폴링될 때까지 아무것도 하지 않습니다(lazy evaluation).

```rust
// Rust에서 .await를 빠뜨리면 아무 일도 안 일어남
let future = fetch_user(1); // Future 생성, 아직 실행 안 됨
// future를 사용하지 않으면 컴파일러가 경고를 줌
let user = fetch_user(1).await?; // 이래야 실제로 실행됨
```

---

## 2-7. 제네릭

### TypeScript 제네릭

```typescript
// TypeScript
function identity<T>(value: T): T {
  return value;
}

// 제약 조건
function getLength<T extends { length: number }>(value: T): number {
  return value.length;
}

// 제네릭 인터페이스
interface Repository<T, ID> {
  findById(id: ID): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(id: ID): Promise<void>;
}

// 여러 제약
function merge<T extends object, U extends object>(a: T, b: U): T & U {
  return { ...a, ...b };
}
```

### Rust 제네릭

```rust
// Rust
fn identity<T>(value: T) -> T {
    value
}

// 제약 조건: trait bound
fn get_length<T: HasLength>(value: T) -> usize {
    value.len()
}

// 또는 where 절 (가독성 좋음)
fn process<T, E>(value: T) -> Result<String, E>
where
    T: Display + Clone,  // T는 Display와 Clone을 구현해야 함
    E: std::error::Error,
{
    Ok(format!("{}", value))
}

// 제네릭 struct
struct Repository<T> {
    items: Vec<T>,
}

impl<T: Clone> Repository<T> {
    fn new() -> Self {
        Repository { items: Vec::new() }
    }

    fn save(&mut self, item: T) {
        self.items.push(item);
    }

    fn find_by_index(&self, index: usize) -> Option<T> {
        self.items.get(index).cloned()
    }
}
```

### 제약 조건 비교

| TypeScript | Rust | 의미 |
|-----------|------|------|
| `<T extends Type>` | `<T: Trait>` | T는 Trait을 구현해야 함 |
| `<T extends A & B>` | `<T: A + B>` | T는 A와 B 모두 구현 |
| `keyof T` | 없음 (다른 방식으로) | 키 타입 추출 |
| `ReturnType<F>` | 없음 (type inference) | 반환 타입 추출 |
| `Partial<T>` | `Option<T>` 필드 수동 | 선택적 필드 |

### 실용 예제: 제네릭 캐시

```typescript
// TypeScript
class Cache<K, V> {
  private store = new Map<K, V>();

  set(key: K, value: V): void {
    this.store.set(key, value);
  }

  get(key: K): V | undefined {
    return this.store.get(key);
  }
}

const cache = new Cache<string, User>();
cache.set("user:1", user);
```

```rust
// Rust
use std::collections::HashMap;

struct Cache<K, V> {
    store: HashMap<K, V>,
}

impl<K: Eq + std::hash::Hash, V> Cache<K, V> {
    fn new() -> Self {
        Cache { store: HashMap::new() }
    }

    fn set(&mut self, key: K, value: V) {
        self.store.insert(key, value);
    }

    fn get(&self, key: &K) -> Option<&V> {
        self.store.get(key)
    }
}

let mut cache: Cache<String, User> = Cache::new();
cache.set("user:1".to_string(), user);
```

> Rust의 `HashMap` 키로 쓰이려면 `Eq + Hash` trait을 구현해야 합니다. TypeScript의 `Map`은 어떤 값이든 키로 쓸 수 있지만, Rust는 컴파일 타임에 이 제약을 강제합니다.
