---
title: "Ch.9 — Traits In Depth"
description: "The limits of TypeScript interfaces and the power of Rust traits — Display, Clone, From/Into, and beyond"
---

## 1. Trait Review & Differences from interface

Working with TypeScript, you quickly appreciate how convenient `interface` is. If an object has the right methods or properties, it simply satisfies that interface. Rust's `trait` looks similar, but the philosophy is fundamentally different.

### TypeScript interface: Structural Typing (Duck Typing)

TypeScript uses **structural typing**. What matters is not the type's name but its **shape**. This is the duck-typing philosophy: "if it walks like a duck and quacks like a duck, it's a duck."

```typescript
interface Greet {
  greet(): string;
}

// no need to explicitly declare that this implements Greet
class Dog {
  greet() {
    return "Woof!";
  }
}

class Robot {
  greet() {
    return "Beep!";
  }
}

function sayHello(thing: Greet) {
  console.log(thing.greet());
}

sayHello(new Dog());   // OK — Dog has greet()
sayHello(new Robot()); // OK — Robot does too
sayHello({ greet: () => "Hello!" }); // object literals work too
```

This is convenient, but it leaves **room for mistakes**. If two unrelated methods happen to share a name, one type might accidentally satisfy an interface it was never meant to.

### Rust trait: Explicit Implementation Required (Nominal Typing)

Rust requires **explicit implementation**. Even if the structure matches, you must write `impl Trait for Type` yourself. This is closer to **nominal typing**.

```rust
trait Greet {
    fn greet(&self) -> String;
}

struct Dog;
struct Robot;

// must explicitly implement to use the Greet trait
impl Greet for Dog {
    fn greet(&self) -> String {
        String::from("Woof!")
    }
}

impl Greet for Robot {
    fn greet(&self) -> String {
        String::from("Beep!")
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

### Trait Default Implementations

TypeScript interfaces cannot contain method implementations (you'd need an abstract class for that), but Rust traits can provide **default implementations**.

```rust
trait Greet {
    fn name(&self) -> String;

    // default implementation provided
    fn greet(&self) -> String {
        format!("Hello, I'm {}!", self.name())
    }
}

struct Person {
    name: String,
}

impl Greet for Person {
    fn name(&self) -> String {
        self.name.clone()
    }
    // greet() uses the default implementation as-is
}

fn main() {
    let p = Person { name: String::from("Alice") };
    println!("{}", p.greet()); // "Hello, I'm Alice!"
}
```

### Why Is Rust Safer?

| Comparison | TypeScript | Rust |
|---|---|---|
| Typing style | Structural (duck typing) | Nominal (explicit impl) |
| Accidental implementation | Possible (same name = auto-satisfied) | Impossible (explicit declaration required) |
| Default implementations | Not possible (need abstract class) | Possible (written inside the trait) |
| Extending external types | Not possible (declaration merging aside) | Possible (within the orphan rule) |
| Compile-time guarantees | Partial | Complete |

Rust's explicit implementation approach makes it clear to anyone reading the code which traits a given type implements. Bugs from coincidental name matches are completely prevented at the source.

---

## 2. Built-in Traits (Standard Library)

The Rust standard library defines commonly needed behaviors as traits. Just as you use `console.log`, `===`, and type casting in TypeScript, in Rust you implement these traits to get the same behaviors.

### Display / Debug — Equivalent to `console.log`

In TypeScript, `console.log(obj)` automatically prints the object. In Rust, you need to implement the `Display` and `Debug` traits.

```typescript
class Point {
  constructor(public x: number, public y: number) {}

  toString() {
    return `Point(${this.x}, ${this.y})`;
  }
}

const p = new Point(3, 4);
console.log(p.toString()); // "Point(3, 4)"
console.log(p);            // Point { x: 3, y: 4 } (developer-facing output)
```

```rust
use std::fmt;

struct Point {
    x: f64,
    y: f64,
}

// user-facing output (println!("{}", p))
impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "Point({}, {})", self.x, self.y)
    }
}

// developer debug output (println!("{:?}", p))
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

`Debug` can be auto-generated with `#[derive(Debug)]`. In most cases this is all you need.

```rust
#[derive(Debug)]
struct Point {
    x: f64,
    y: f64,
}
// println!("{:?}", p) is now available
```

### [Clone / Copy](/glossary/#clone-vs-copy)

In TypeScript it's often unclear whether copying an object results in a reference copy or a value copy. Rust makes this distinction explicit.

```typescript
// TypeScript: shallow copy
const a = { x: 1, y: 2 };
const b = { ...a }; // new object but nested objects are shared
const c = a;        // same reference
```

```rust
#[derive(Debug, Clone, Copy)]
struct Point {
    x: f64,
    y: f64,
}

fn main() {
    let a = Point { x: 1.0, y: 2.0 };

    // Copy: bitwise copy on the stack (implicit)
    let b = a; // a is still usable (because it's Copy)

    // Clone: explicit deep copy (including heap data)
    let c = a.clone();

    println!("{:?} {:?} {:?}", a, b, c);
}
```

**Copy** is used for simple stack-only types (numbers, bool, etc.), while **Clone** is used for types that include heap data (`String`, `Vec`, etc.).

### PartialEq / Eq / PartialOrd / Ord — Comparison Operators

```typescript
// TypeScript: the confusion of == and ===
const a = { x: 1 };
const b = { x: 1 };
console.log(a === b); // false! (reference comparison)
console.log(a == b);  // false! (also reference comparison in TypeScript)

// must implement manually
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
    println!("{}", a < c);  // true (compares x field first)
}
```

The difference between `PartialEq` and `Eq`: `f64` cannot guarantee total equality (`Eq`) because `NaN != NaN`. Only add `Eq` when complete equality is guaranteed, such as for integers.

### Default — Default Values

```typescript
// TypeScript: defaults via function parameters or the || operator
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

    // customize only some fields (struct update syntax)
    let custom = Config {
        timeout: 5000,
        ..Config::default()
    };
    println!("{:?}", custom); // Config { timeout: 5000, retries: 3 }
}
```

### From / Into — Type Conversion

In TypeScript, type casting is done by forcing with `as` or writing your own conversion function. Rust standardizes **safe type conversion** through the `From` and `Into` traits.

```typescript
// TypeScript: type conversion is not always clear
const numStr = "42";
const num = Number(numStr); // whether it succeeds is only known at runtime
const bad = Number("hello"); // NaN — not a type error!

// must write conversion functions manually
function stringToPoint(s: string): { x: number; y: number } {
  const [x, y] = s.split(",").map(Number);
  return { x, y };
}
```

```rust
#[derive(Debug)]
struct Wrapper(i32);

// implementing From automatically gives you Into!
impl From<i32> for Wrapper {
    fn from(val: i32) -> Self {
        Wrapper(val)
    }
}

fn main() {
    // using From
    let w1 = Wrapper::from(42);

    // using Into (automatic once From is implemented)
    let w2: Wrapper = 42.into();

    println!("{:?} {:?}", w1, w2); // Wrapper(42) Wrapper(42)

    // standard library examples
    let s = String::from("Hello"); // &str -> String
    let n: i64 = 42i32.into();     // i32 -> i64
}
```

Implementing `From` gives you `Into` **automatically** — no need to implement it in reverse. This is one of Rust's elegant design choices.

---

## 3. Trait Objects (Dynamic Dispatch)

Generics have their types determined at compile time, but sometimes you need to handle **a variety of types at runtime**. Just as you use an interface as a type in TypeScript, Rust uses [`dyn Trait`](/glossary/#impl-trait-vs-dyn-trait) for this.

### TypeScript: Using an interface as a Type

```typescript
interface Shape {
  area(): number;
  name(): string;
}

class Circle implements Shape {
  constructor(private radius: number) {}
  area() { return Math.PI * this.radius ** 2; }
  name() { return "Circle"; }
}

class Rectangle implements Shape {
  constructor(private w: number, private h: number) {}
  area() { return this.w * this.h; }
  name() { return "Rectangle"; }
}

// can hold various Shapes at runtime
const shapes: Shape[] = [new Circle(5), new Rectangle(3, 4)];

for (const shape of shapes) {
  console.log(`${shape.name()}: area = ${shape.area().toFixed(2)}`);
}
```

### Rust: `dyn Trait` and `Box<dyn Trait>`

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
    fn name(&self) -> &str { "Circle" }
}

impl Shape for Rectangle {
    fn area(&self) -> f64 {
        self.width * self.height
    }
    fn name(&self) -> &str { "Rectangle" }
}

fn main() {
    // Box<dyn Shape>: a trait object allocated on the heap
    let shapes: Vec<Box<dyn Shape>> = vec![
        Box::new(Circle { radius: 5.0 }),
        Box::new(Rectangle { width: 3.0, height: 4.0 }),
    ];

    for shape in &shapes {
        println!("{}: area = {:.2}", shape.name(), shape.area());
    }
}
```

Why `Box` is needed in [`Box<dyn Shape>`](/glossary/#boxt-vs-rct-vs-arct): the size of `dyn Shape` is not known at compile time (because `Circle` and `Rectangle` have different sizes). Wrapping in `Box` places it on the heap so it can be handled through a pointer (fixed size).

### Generics vs [`dyn Trait`](/glossary/#impl-trait-vs-dyn-trait) — When to Use Which?

```rust
// option 1: generics (static dispatch, decided at compile time)
fn print_area_generic<T: Shape>(shape: &T) {
    println!("area: {:.2}", shape.area());
}

// option 2: dyn Trait (dynamic dispatch, decided at runtime)
fn print_area_dynamic(shape: &dyn Shape) {
    println!("area: {:.2}", shape.area());
}
```

| Comparison | Generics (`impl Trait` / `T: Trait`) | `dyn Trait` |
|---|---|---|
| Dispatch time | Compile time | Runtime |
| Performance | Fast (inlining possible) | Slightly slower (vtable lookup) |
| Compiled output | Separate code per type | Single code |
| Heterogeneous collections | Not possible (same type only) | Possible |
| When to use | When performance matters and types are known | When types are determined at runtime |

**Rule of thumb:** default to generics, and only use `dyn Trait` when you need to store different types in a single collection.

---

## 4. Trait Inheritance and Composition

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
  name() { return "Max"; }
  owner() { return "Alice"; }
  performTrick() { return "Sit!"; }
}
```

### Rust: Supertraits

```rust
trait Animal {
    fn name(&self) -> String;
}

// Pet requires Animal as a "supertrait"
trait Pet: Animal {
    fn owner(&self) -> String;
}

// TrainedPet requires Pet (and implicitly Animal)
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
        String::from("Sit!")
    }
}
```

### Requiring Multiple Traits at Once

Just as TypeScript uses `&` to create intersection types, Rust uses `+` to combine multiple trait bounds.

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

// require multiple traits simultaneously in a function
fn process_item<T: fmt::Display + Clone + fmt::Debug>(item: T) -> T {
    println!("Display: {}", item);
    println!("Debug: {:?}", item);
    item.clone()
}

// use a where clause for better readability
fn process_item_v2<T>(item: T) -> T
where
    T: fmt::Display + Clone + fmt::Debug,
{
    println!("Display: {}", item);
    item.clone()
}

fn main() {
    let result = process_item(String::from("Hello"));
    println!("result: {}", result);
}
```

When there are many complex bounds, using a `where` clause is much more readable.

---

## 5. In Practice: The Plugin System Pattern

Here's an example that shows how powerful traits can be in a real project. Let's build a plugin system that serializes data into various formats.

### TypeScript: Interface-Based Strategy Pattern

```typescript
// serialization strategy interface
interface Serializer {
  serialize(data: Record<string, unknown>): string;
  contentType(): string;
}

// JSON serialization
class JsonSerializer implements Serializer {
  serialize(data: Record<string, unknown>): string {
    return JSON.stringify(data, null, 2);
  }
  contentType(): string {
    return "application/json";
  }
}

// CSV serialization (simple version)
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

// XML serialization
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

// plugin registry
class SerializerRegistry {
  private plugins: Map<string, Serializer> = new Map();

  register(name: string, serializer: Serializer): void {
    this.plugins.set(name, serializer);
  }

  serialize(name: string, data: Record<string, unknown>): string {
    const serializer = this.plugins.get(name);
    if (!serializer) throw new Error(`Unknown serializer: ${name}`);
    return serializer.serialize(data);
  }

  listFormats(): string[] {
    return Array.from(this.plugins.keys());
  }
}

// usage example
const registry = new SerializerRegistry();
registry.register("json", new JsonSerializer());
registry.register("csv", new CsvSerializer());
registry.register("xml", new XmlSerializer());

const data = { name: "Alice", age: 30, city: "Seoul" };

for (const format of registry.listFormats()) {
  console.log(`=== ${format} ===`);
  console.log(registry.serialize(format, data));
}
```

### Rust: `Box<dyn Trait>`-Based Plugin

```rust
use std::collections::HashMap;

// serialization trait
trait Serializer {
    fn serialize(&self, data: &HashMap<String, String>) -> String;
    fn content_type(&self) -> &str;
}

// JSON serialization
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

// CSV serialization
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

// XML serialization
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

// plugin registry
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

    // wrap in Box::new() before registering
    registry.register("json", Box::new(JsonSerializer));
    registry.register("csv", Box::new(CsvSerializer));
    registry.register("xml", Box::new(XmlSerializer));

    let mut data = HashMap::new();
    data.insert(String::from("name"), String::from("Alice"));
    data.insert(String::from("age"), String::from("30"));
    data.insert(String::from("city"), String::from("Seoul"));

    let mut formats = registry.list_formats();
    formats.sort(); // for consistent ordering

    for format in formats {
        println!("=== {} ===", format);
        if let Some(output) = registry.serialize(format, &data) {
            println!("{}", output);
        }
    }
}
```

### Side-by-Side Comparison

| Concept | TypeScript | Rust |
|---|---|---|
| Interface/trait definition | `interface Serializer { ... }` | `trait Serializer { ... }` |
| Implementation | `class X implements Serializer` | `impl Serializer for X` |
| Dynamic collection | `Map<string, Serializer>` | `HashMap<String, Box<dyn Serializer>>` |
| Creating an instance | `new JsonSerializer()` | `Box::new(JsonSerializer)` |
| Null handling | `if (!serializer) throw` | `Option<String>` + `map()` |
| Method call | `serializer.serialize(data)` | `s.serialize(data)` (identical) |

### Key Differences

**TypeScript:**
- `interface` can be used directly as a type annotation, which is convenient.
- Class instances live on the heap and are handled by reference, so mixing them in a collection is natural.

**Rust:**
- To use `dyn Trait`, the size must be known, so it must be written as `Box<dyn Trait>`.
- In return, the memory layout and cost are completely transparent. Seeing `Box` immediately tells you "one heap allocation happens here."
- Returning `Option` delegates the handling of a missing serializer to the caller. Rather than throwing an exception like TypeScript, the type system forces the caller to handle it.

---

## Conclusion

Rust's trait system is significantly more powerful and strict than TypeScript's interfaces. At first, writing `impl` blocks one by one can feel tedious, but it makes the code far clearer and allows the compiler to guarantee far more.

**This chapter in summary:**

- Rust traits require explicit implementation. There are no accidental implementations.
- The `derive` macro makes it easy to add `Debug`, `Clone`, `PartialEq`, and more.
- Implementing `From` automatically gives you `Into`.
- Use `Box<dyn Trait>` when you need a collection of heterogeneous types.
- Use generics when performance matters and types are known.
- Supertraits and `+` combinations let you require multiple capabilities at once.

---

## Chapter Navigation

After covering iterators and closures for advanced syntax in the previous chapter, here you learned how to structure code with traits. The next chapter moves on to practical examples to integrate everything you've learned.
