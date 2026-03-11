---
title: "Ch.9 — Trait 심화"
description: "TypeScript interface의 한계와 Rust trait의 힘 — Display, Clone, From/Into까지"
---

## 1. Trait 복습 & interface와의 차이점

TypeScript를 쓰다 보면 `interface`가 정말 편하다는 걸 느낀다. 객체가 특정 메서드나 프로퍼티를 가지고 있으면 그냥 그 인터페이스를 만족한다고 본다. Rust의 `trait`는 비슷해 보이지만, 철학이 근본적으로 다르다.

### TypeScript interface: 구조적 타이핑 (Duck Typing)

TypeScript는 **구조적 타이핑(structural typing)** 을 사용한다. 타입의 이름이 아니라 **구조(shape)** 가 맞으면 OK다. "오리처럼 걷고 오리처럼 꽥꽥거리면 오리다"라는 덕 타이핑 철학이다.

```typescript
interface Greet {
  greet(): string;
}

// 명시적으로 Greet를 구현한다고 선언하지 않아도 된다
class Dog {
  greet() {
    return "멍멍!";
  }
}

class Robot {
  greet() {
    return "삑삑!";
  }
}

function sayHello(thing: Greet) {
  console.log(thing.greet());
}

sayHello(new Dog());   // OK — Dog는 greet()를 가지고 있으니까
sayHello(new Robot()); // OK — Robot도 마찬가지
sayHello({ greet: () => "안녕!" }); // 리터럴도 OK
```

편리하지만 **실수의 여지**가 있다. `greet()`라는 메서드가 우연히 같은 이름이라면 의도치 않게 interface를 만족해 버릴 수 있다.

### Rust trait: 명시적 구현 필요 (Nominal Typing)

Rust는 **명시적 구현(explicit implementation)** 을 요구한다. 구조가 맞더라도 `impl Trait for Type`을 직접 작성해야 한다. 이게 **명목적 타이핑(nominal typing)** 에 가깝다.

```rust
trait Greet {
    fn greet(&self) -> String;
}

struct Dog;
struct Robot;

// 명시적으로 구현해야만 Greet trait을 쓸 수 있다
impl Greet for Dog {
    fn greet(&self) -> String {
        String::from("멍멍!")
    }
}

impl Greet for Robot {
    fn greet(&self) -> String {
        String::from("삑삑!")
    }
}

fn say_hello(thing: &impl Greet) {
    println!("{}", thing.greet());
}

fn main() {
    say_hello(&Dog);   // OK
    say_hello(&Robot); // OK
}
```

### Trait 기본 구현 (Default Implementation)

TypeScript의 interface는 메서드 구현을 가질 수 없지만(abstract class로 우회), Rust trait은 **기본 구현**을 제공할 수 있다.

```rust
trait Greet {
    fn name(&self) -> String;

    // 기본 구현 제공
    fn greet(&self) -> String {
        format!("안녕하세요, 저는 {}입니다!", self.name())
    }
}

struct Person {
    name: String,
}

impl Greet for Person {
    fn name(&self) -> String {
        self.name.clone()
    }
    // greet()는 기본 구현을 그대로 사용
}

fn main() {
    let p = Person { name: String::from("철수") };
    println!("{}", p.greet()); // "안녕하세요, 저는 철수입니다!"
}
```

### 왜 Rust가 더 안전한가?

| 비교 항목 | TypeScript | Rust |
|---|---|---|
| 타이핑 방식 | 구조적 (duck typing) | 명목적 (explicit impl) |
| 우발적 구현 | 가능 (이름이 같으면 자동) | 불가 (명시적 선언 필수) |
| 기본 구현 | 불가 (abstract class 필요) | 가능 (trait 내부에 작성) |
| 외부 타입 확장 | 불가 (선언 병합 예외) | 가능 (orphan rule 내에서) |
| 컴파일 타임 보장 | 부분적 | 완전함 |

Rust의 명시적 구현 방식은 코드를 읽는 사람이 "이 타입이 어떤 trait을 구현하는지" 를 명확하게 알 수 있게 해 준다. 우연의 일치로 인한 버그가 원천 차단된다.

---

## 2. 기본 제공 Trait들 (표준 라이브러리)

Rust 표준 라이브러리에는 자주 쓰는 동작들이 trait으로 정의되어 있다. TypeScript에서 `console.log`, `===`, 타입 캐스팅을 쓰듯이, Rust에서는 이 trait들을 구현해서 같은 동작을 얻는다.

### Display / Debug — `console.log` 대응

TypeScript에서 `console.log(obj)`를 하면 자동으로 객체를 출력해 준다. Rust에서는 `Display`와 `Debug` trait을 구현해야 한다.

```typescript
class Point {
  constructor(public x: number, public y: number) {}

  toString() {
    return `Point(${this.x}, ${this.y})`;
  }
}

const p = new Point(3, 4);
console.log(p.toString()); // "Point(3, 4)"
console.log(p);            // Point { x: 3, y: 4 } (개발용 출력)
```

```rust
use std::fmt;

struct Point {
    x: f64,
    y: f64,
}

// 사용자에게 보여주는 출력 (println!("{}", p))
impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "Point({}, {})", self.x, self.y)
    }
}

// 개발자용 디버그 출력 (println!("{:?}", p))
impl fmt::Debug for Point {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "Point {{ x: {}, y: {} }}", self.x, self.y)
    }
}

fn main() {
    let p = Point { x: 3.0, y: 4.0 };
    println!("{}", p);   // "Point(3, 4)"
    println!("{:?}", p); // "Point { x: 3, y: 4 }"
}
```

`Debug`는 `#[derive(Debug)]`로 자동 생성할 수 있다. 대부분의 경우 이걸 쓰면 된다.

```rust
#[derive(Debug)]
struct Point {
    x: f64,
    y: f64,
}
// 이제 println!("{:?}", p) 가능
```

### Clone / Copy

TypeScript에서는 객체 복사가 참조 복사인지 값 복사인지 명확하지 않을 때가 많다. Rust는 명확하게 구분한다.

```typescript
// TypeScript: 얕은 복사 (shallow copy)
const a = { x: 1, y: 2 };
const b = { ...a }; // 새 객체지만 중첩 객체는 공유
const c = a;        // 같은 참조
```

```rust
#[derive(Debug, Clone, Copy)]
struct Point {
    x: f64,
    y: f64,
}

fn main() {
    let a = Point { x: 1.0, y: 2.0 };

    // Copy: 스택에서 비트 단위 복사 (암묵적)
    let b = a; // a도 여전히 사용 가능 (Copy이므로)

    // Clone: 명시적 복제 (힙 데이터 포함)
    let c = a.clone();

    println!("{:?} {:?} {:?}", a, b, c);
}
```

**Copy**는 스택에만 있는 단순 타입(숫자, bool 등)에 쓰고, **Clone**은 힙 데이터(`String`, `Vec` 등)를 포함할 때 쓴다.

### PartialEq / Eq / PartialOrd / Ord — 비교 연산자

```typescript
// TypeScript: == 와 === 의 혼란
const a = { x: 1 };
const b = { x: 1 };
console.log(a === b); // false! (참조 비교)
console.log(a == b);  // false! (TypeScript에서도 참조 비교)

// 직접 구현해야 함
function pointEquals(a: Point, b: Point) {
  return a.x === b.x && a.y === b.y;
}
```

```rust
#[derive(Debug, Clone, PartialEq, PartialOrd)]
struct Point {
    x: f64,
    y: f64,
}

fn main() {
    let a = Point { x: 1.0, y: 2.0 };
    let b = Point { x: 1.0, y: 2.0 };
    let c = Point { x: 3.0, y: 4.0 };

    println!("{}", a == b); // true
    println!("{}", a != c); // true
    println!("{}", a < c);  // true (x 필드 먼저 비교)
}
```

`PartialEq`와 `Eq`의 차이: `f64`는 `NaN != NaN`이라 완전한 동등성(`Eq`)을 보장할 수 없다. 정수처럼 완전한 동등성이 보장될 때만 `Eq`를 추가로 구현한다.

### Default — 기본값

```typescript
// TypeScript: 기본값은 함수 파라미터나 || 연산자로
interface Config {
  timeout?: number;
  retries?: number;
}

function createConfig(config: Config = {}) {
  return {
    timeout: config.timeout ?? 3000,
    retries: config.retries ?? 3,
  };
}
```

```rust
#[derive(Debug)]
struct Config {
    timeout: u64,
    retries: u32,
}

impl Default for Config {
    fn default() -> Self {
        Config {
            timeout: 3000,
            retries: 3,
        }
    }
}

fn main() {
    let config = Config::default();
    println!("{:?}", config); // Config { timeout: 3000, retries: 3 }

    // 일부만 커스터마이즈 (struct update syntax)
    let custom = Config {
        timeout: 5000,
        ..Config::default()
    };
    println!("{:?}", custom); // Config { timeout: 5000, retries: 3 }
}
```

### From / Into — 타입 변환

TypeScript에서 타입 캐스팅은 `as`로 강제하거나, 변환 함수를 직접 만든다. Rust는 `From`과 `Into` trait으로 **안전한 타입 변환**을 표준화한다.

```typescript
// TypeScript: 타입 변환이 명확하지 않음
const numStr = "42";
const num = Number(numStr); // 변환 성공 여부를 런타임에만 알 수 있음
const bad = Number("hello"); // NaN — 타입 오류가 아님!

// 직접 변환 함수를 만들어야 함
function stringToPoint(s: string): { x: number; y: number } {
  const [x, y] = s.split(",").map(Number);
  return { x, y };
}
```

```rust
#[derive(Debug)]
struct Wrapper(i32);

// From을 구현하면 Into가 자동으로 생긴다!
impl From<i32> for Wrapper {
    fn from(val: i32) -> Self {
        Wrapper(val)
    }
}

fn main() {
    // From 사용
    let w1 = Wrapper::from(42);

    // Into 사용 (From을 구현하면 자동)
    let w2: Wrapper = 42.into();

    println!("{:?} {:?}", w1, w2); // Wrapper(42) Wrapper(42)

    // 표준 라이브러리 예시
    let s = String::from("안녕하세요"); // &str -> String
    let n: i64 = 42i32.into();          // i32 -> i64
}
```

`From`을 구현하면 `Into`는 **자동으로 생긴다**. 반대로 구현할 필요가 없다. Rust의 우아한 설계 중 하나다.

---

## 3. Trait 객체 (동적 디스패치)

제네릭은 컴파일 타임에 타입이 결정되지만, 때로는 **런타임에 다양한 타입**을 다뤄야 할 때가 있다. TypeScript에서 interface를 타입으로 쓰는 것처럼, Rust에서는 `dyn Trait`을 사용한다.

### TypeScript: interface를 타입으로 쓰기

```typescript
interface Shape {
  area(): number;
  name(): string;
}

class Circle implements Shape {
  constructor(private radius: number) {}
  area() { return Math.PI * this.radius ** 2; }
  name() { return "원"; }
}

class Rectangle implements Shape {
  constructor(private w: number, private h: number) {}
  area() { return this.w * this.h; }
  name() { return "사각형"; }
}

// 런타임에 다양한 Shape를 담을 수 있음
const shapes: Shape[] = [new Circle(5), new Rectangle(3, 4)];

for (const shape of shapes) {
  console.log(`${shape.name()}: 넓이 = ${shape.area().toFixed(2)}`);
}
```

### Rust: `dyn Trait`과 `Box<dyn Trait>`

```rust
trait Shape {
    fn area(&self) -> f64;
    fn name(&self) -> &str;
}

struct Circle {
    radius: f64,
}

struct Rectangle {
    width: f64,
    height: f64,
}

impl Shape for Circle {
    fn area(&self) -> f64 {
        std::f64::consts::PI * self.radius * self.radius
    }
    fn name(&self) -> &str { "원" }
}

impl Shape for Rectangle {
    fn area(&self) -> f64 {
        self.width * self.height
    }
    fn name(&self) -> &str { "사각형" }
}

fn main() {
    // Box<dyn Shape>: 힙에 할당된 trait 객체
    let shapes: Vec<Box<dyn Shape>> = vec![
        Box::new(Circle { radius: 5.0 }),
        Box::new(Rectangle { width: 3.0, height: 4.0 }),
    ];

    for shape in &shapes {
        println!("{}: 넓이 = {:.2}", shape.name(), shape.area());
    }
}
```

`Box<dyn Shape>`에서 `Box`가 필요한 이유: `dyn Shape`는 크기를 컴파일 타임에 알 수 없다(`Circle`과 `Rectangle`의 크기가 다르니까). `Box`로 힙에 올려야 포인터(고정 크기)로 다룰 수 있다.

### 제네릭 vs `dyn Trait` — 언제 써야 하나?

```rust
// 방법 1: 제네릭 (정적 디스패치, 컴파일 타임 결정)
fn print_area_generic<T: Shape>(shape: &T) {
    println!("넓이: {:.2}", shape.area());
}

// 방법 2: dyn Trait (동적 디스패치, 런타임 결정)
fn print_area_dynamic(shape: &dyn Shape) {
    println!("넓이: {:.2}", shape.area());
}
```

| 비교 | 제네릭 (`impl Trait` / `T: Trait`) | `dyn Trait` |
|---|---|---|
| 디스패치 시점 | 컴파일 타임 | 런타임 |
| 성능 | 빠름 (인라이닝 가능) | 약간 느림 (vtable 조회) |
| 컴파일 결과물 | 타입마다 별도 코드 생성 | 단일 코드 |
| 이종 컬렉션 | 불가 (같은 타입만) | 가능 |
| 언제 사용 | 성능이 중요하고 타입이 알려진 경우 | 런타임에 타입이 결정되는 경우 |

**규칙:** 기본은 제네릭을 쓰고, 서로 다른 타입을 하나의 컬렉션에 담아야 할 때만 `dyn Trait`을 쓴다.

---

## 4. Trait 상속과 조합

### TypeScript: `interface extends`

```typescript
interface Animal {
  name(): string;
}

interface Pet extends Animal {
  owner(): string;
}

interface TrainedPet extends Pet {
  performTrick(): string;
}

class GuideDog implements TrainedPet {
  name() { return "맥스"; }
  owner() { return "철수"; }
  performTrick() { return "앉아!"; }
}
```

### Rust: 수퍼트레이트 (Supertrait)

```rust
trait Animal {
    fn name(&self) -> String;
}

// Pet은 Animal을 "수퍼트레이트"로 요구
trait Pet: Animal {
    fn owner(&self) -> String;
}

// TrainedPet은 Pet (그리고 암묵적으로 Animal)을 요구
trait TrainedPet: Pet {
    fn perform_trick(&self) -> String;
}

struct GuideDog {
    name: String,
    owner: String,
}

impl Animal for GuideDog {
    fn name(&self) -> String { self.name.clone() }
}

impl Pet for GuideDog {
    fn owner(&self) -> String { self.owner.clone() }
}

impl TrainedPet for GuideDog {
    fn perform_trick(&self) -> String {
        String::from("앉아!")
    }
}
```

### 여러 Trait을 동시에 요구하기

TypeScript에서 `&`로 intersection type을 만드는 것처럼, Rust는 `+`로 여러 trait 바운드를 조합한다.

```typescript
// TypeScript: intersection type
type Printable = Display & Cloneable & Debuggable;

function processItem<T extends Display & Cloneable>(item: T): T {
  console.log(item.toString());
  return item.clone();
}
```

```rust
use std::fmt;

// 함수에서 여러 trait을 동시에 요구
fn process_item<T: fmt::Display + Clone + fmt::Debug>(item: T) -> T {
    println!("Display: {}", item);
    println!("Debug: {:?}", item);
    item.clone()
}

// where 절로 더 읽기 좋게 쓸 수 있다
fn process_item_v2<T>(item: T) -> T
where
    T: fmt::Display + Clone + fmt::Debug,
{
    println!("Display: {}", item);
    item.clone()
}

fn main() {
    let result = process_item(String::from("안녕"));
    println!("결과: {}", result);
}
```

복잡한 바운드가 많을 때는 `where` 절을 쓰는 게 훨씬 읽기 좋다.

---

## 5. 실전: 플러그인 시스템 패턴

실제 프로젝트에서 trait이 얼마나 강력한지 보여주는 예시다. 데이터를 다양한 포맷으로 직렬화하는 플러그인 시스템을 만들어 보자.

### TypeScript: interface 기반 전략 패턴

```typescript
// 직렬화 전략 interface
interface Serializer {
  serialize(data: Record<string, unknown>): string;
  contentType(): string;
}

// JSON 직렬화
class JsonSerializer implements Serializer {
  serialize(data: Record<string, unknown>): string {
    return JSON.stringify(data, null, 2);
  }
  contentType(): string {
    return "application/json";
  }
}

// CSV 직렬화 (간단한 버전)
class CsvSerializer implements Serializer {
  serialize(data: Record<string, unknown>): string {
    const headers = Object.keys(data).join(",");
    const values = Object.values(data).join(",");
    return `${headers}\n${values}`;
  }
  contentType(): string {
    return "text/csv";
  }
}

// XML 직렬화
class XmlSerializer implements Serializer {
  serialize(data: Record<string, unknown>): string {
    const fields = Object.entries(data)
      .map(([k, v]) => `  <${k}>${v}</${k}>`)
      .join("\n");
    return `<root>\n${fields}\n</root>`;
  }
  contentType(): string {
    return "application/xml";
  }
}

// 플러그인 레지스트리
class SerializerRegistry {
  private plugins: Map<string, Serializer> = new Map();

  register(name: string, serializer: Serializer): void {
    this.plugins.set(name, serializer);
  }

  serialize(name: string, data: Record<string, unknown>): string {
    const serializer = this.plugins.get(name);
    if (!serializer) throw new Error(`알 수 없는 직렬화기: ${name}`);
    return serializer.serialize(data);
  }

  listFormats(): string[] {
    return Array.from(this.plugins.keys());
  }
}

// 사용 예시
const registry = new SerializerRegistry();
registry.register("json", new JsonSerializer());
registry.register("csv", new CsvSerializer());
registry.register("xml", new XmlSerializer());

const data = { name: "철수", age: 30, city: "서울" };

for (const format of registry.listFormats()) {
  console.log(`=== ${format} ===`);
  console.log(registry.serialize(format, data));
}
```

### Rust: `Box<dyn Trait>` 기반 플러그인

```rust
use std::collections::HashMap;

// 직렬화 trait
trait Serializer {
    fn serialize(&self, data: &HashMap<String, String>) -> String;
    fn content_type(&self) -> &str;
}

// JSON 직렬화
struct JsonSerializer;

impl Serializer for JsonSerializer {
    fn serialize(&self, data: &HashMap<String, String>) -> String {
        let fields: Vec<String> = data
            .iter()
            .map(|(k, v)| format!("  \"{}\": \"{}\"", k, v))
            .collect();
        format!("{{\n{}\n}}", fields.join(",\n"))
    }
    fn content_type(&self) -> &str {
        "application/json"
    }
}

// CSV 직렬화
struct CsvSerializer;

impl Serializer for CsvSerializer {
    fn serialize(&self, data: &HashMap<String, String>) -> String {
        let headers: Vec<&str> = data.keys().map(|k| k.as_str()).collect();
        let values: Vec<&str> = data.values().map(|v| v.as_str()).collect();
        format!("{}\n{}", headers.join(","), values.join(","))
    }
    fn content_type(&self) -> &str {
        "text/csv"
    }
}

// XML 직렬화
struct XmlSerializer;

impl Serializer for XmlSerializer {
    fn serialize(&self, data: &HashMap<String, String>) -> String {
        let fields: Vec<String> = data
            .iter()
            .map(|(k, v)| format!("  <{}>{}</{}>", k, v, k))
            .collect();
        format!("<root>\n{}\n</root>", fields.join("\n"))
    }
    fn content_type(&self) -> &str {
        "application/xml"
    }
}

// 플러그인 레지스트리
struct SerializerRegistry {
    plugins: HashMap<String, Box<dyn Serializer>>,
}

impl SerializerRegistry {
    fn new() -> Self {
        SerializerRegistry {
            plugins: HashMap::new(),
        }
    }

    fn register(&mut self, name: &str, serializer: Box<dyn Serializer>) {
        self.plugins.insert(name.to_string(), serializer);
    }

    fn serialize(&self, name: &str, data: &HashMap<String, String>) -> Option<String> {
        self.plugins.get(name).map(|s| s.serialize(data))
    }

    fn list_formats(&self) -> Vec<&str> {
        self.plugins.keys().map(|k| k.as_str()).collect()
    }
}

fn main() {
    let mut registry = SerializerRegistry::new();

    // Box::new()로 감싸서 등록
    registry.register("json", Box::new(JsonSerializer));
    registry.register("csv", Box::new(CsvSerializer));
    registry.register("xml", Box::new(XmlSerializer));

    let mut data = HashMap::new();
    data.insert(String::from("name"), String::from("철수"));
    data.insert(String::from("age"), String::from("30"));
    data.insert(String::from("city"), String::from("서울"));

    let mut formats = registry.list_formats();
    formats.sort(); // 순서 일관성을 위해

    for format in formats {
        println!("=== {} ===", format);
        if let Some(output) = registry.serialize(format, &data) {
            println!("{}", output);
        }
    }
}
```

### 나란히 비교

| 개념 | TypeScript | Rust |
|---|---|---|
| 인터페이스/trait 정의 | `interface Serializer { ... }` | `trait Serializer { ... }` |
| 구현 | `class X implements Serializer` | `impl Serializer for X` |
| 동적 컬렉션 | `Map<string, Serializer>` | `HashMap<String, Box<dyn Serializer>>` |
| 인스턴스 생성 | `new JsonSerializer()` | `Box::new(JsonSerializer)` |
| null 처리 | `if (!serializer) throw` | `Option<String>` + `map()` |
| 메서드 호출 | `serializer.serialize(data)` | `s.serialize(data)` (동일) |

### 핵심 차이점 정리

**TypeScript:**
- `interface`를 그냥 타입 어노테이션으로 쓸 수 있어 편하다.
- 클래스 인스턴스는 힙에 올라가고 참조로 다루기 때문에 컬렉션에 섞어 담기가 자연스럽다.

**Rust:**
- `dyn Trait`을 쓰려면 반드시 크기를 알 수 있어야 해서 `Box<dyn Trait>` 형태로 써야 한다.
- 대신 메모리 레이아웃과 비용이 완전히 명확하다. `Box`를 보는 순간 "힙 할당이 한 번 일어나는구나"를 바로 알 수 있다.
- `Option`을 반환함으로써 없는 직렬화기를 요청했을 때의 처리를 **호출자에게 위임**한다. TypeScript처럼 예외를 던지는 게 아니라, 타입 시스템이 처리를 강제한다.

---

## 마무리

Rust의 trait 시스템은 TypeScript의 interface보다 훨씬 강력하고 엄격하다. 처음에는 `impl` 블록을 일일이 써야 하는 게 번거롭게 느껴질 수 있지만, 그만큼 코드가 명확해지고 컴파일러가 더 많은 것을 보장해 준다.

**이번 챕터 요약:**

- Rust trait은 명시적 구현이 필요하다. 우연한 구현은 없다.
- `derive` 매크로로 `Debug`, `Clone`, `PartialEq` 등을 쉽게 추가할 수 있다.
- `From`을 구현하면 `Into`가 자동으로 생긴다.
- 이종 타입 컬렉션이 필요하면 `Box<dyn Trait>`을 쓴다.
- 성능이 중요하고 타입이 알려져 있다면 제네릭을 쓴다.
- 수퍼트레이트와 `+` 조합으로 여러 능력을 동시에 요구할 수 있다.

---

## 챕터 연결

이전 챕터에서 이터레이터/클로저로 고급 문법을 다뤘다면, 여기서는 trait로 구조화하는 방법을 익힌 것이다.
다음 챕터에서는 실전 예제로 넘어가 지식을 통합한다.
