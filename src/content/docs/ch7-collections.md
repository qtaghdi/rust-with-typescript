---
title: "Ch.7 — 컬렉션"
description: "Array/Map/String vs Vec/HashMap/String — Rust의 컬렉션 타입 완전 정복"
---

TypeScript에서 배열, 문자열, Map을 자유자재로 다뤘다면, Rust에서도 비슷한 컬렉션 타입들이 있습니다. 다만 소유권 시스템 때문에 동작 방식이 조금 다릅니다. 이 챕터에서는 TypeScript 개발자 눈높이에서 Rust의 세 가지 핵심 컬렉션을 비교해봅니다.

---

## 1. `Vec<T>` — TypeScript Array와 비교

`Vec<T>`는 TypeScript의 `Array<T>`와 가장 비슷한 타입입니다. 힙에 데이터를 저장하며, 크기를 동적으로 늘리거나 줄일 수 있습니다.

### 생성

```typescript
// TypeScript
const nums: number[] = [];
const nums2 = [1, 2, 3];
const nums3 = Array.from({ length: 5 }, (_, i) => i * 2); // [0, 2, 4, 6, 8]
```

```rust
// Rust
let nums: Vec<i32> = Vec::new();       // 빈 벡터
let nums2 = vec![1, 2, 3];             // vec! 매크로로 초기화
let nums3: Vec<i32> = (0..5).map(|i| i * 2).collect(); // [0, 2, 4, 6, 8]
```

`vec![]` 매크로는 TypeScript의 배열 리터럴 `[]`과 똑같이 편합니다. `Vec::new()`는 빈 벡터를 만들고, 나중에 타입을 추론할 수 없는 상황에서 타입 어노테이션이 필요합니다.

### 추가 / 삭제

```typescript
// TypeScript
const arr = [1, 2, 3];
arr.push(4);          // 끝에 추가
arr.pop();            // 끝에서 제거
arr.splice(1, 1);     // 인덱스 1에서 1개 제거
```

```rust
// Rust
let mut arr = vec![1, 2, 3];
arr.push(4);          // 끝에 추가
arr.pop();            // 끝에서 제거 → Option<T> 반환
arr.remove(1);        // 인덱스 1의 요소 제거 (나머지가 왼쪽으로 이동)
```

Rust에서 `pop()`은 `Option<T>`를 반환합니다. 벡터가 비어 있으면 `None`, 값이 있으면 `Some(값)`을 돌려줍니다. TypeScript처럼 `undefined`가 그냥 나오는 게 아니라, 명시적으로 처리해야 합니다.

```rust
let mut arr = vec![1, 2, 3];
if let Some(last) = arr.pop() {
    println!("꺼낸 값: {}", last);
}
```

또한 `Vec`을 수정하려면 반드시 `mut`를 붙여야 합니다. TypeScript에서 `const arr = []`로 선언해도 `arr.push()`가 가능한 것과 다릅니다.

### 읽기 — 인덱싱 vs `.get()`

```typescript
// TypeScript
const arr = [10, 20, 30];
console.log(arr[1]);    // 20
console.log(arr[99]);   // undefined (런타임 에러 없음)
```

```rust
// Rust
let arr = vec![10, 20, 30];

// 방법 1: 직접 인덱싱 — 범위 초과 시 패닉(panic) 발생!
println!("{}", arr[1]);   // 20

// 방법 2: .get() — Option<&T> 반환, 안전함
match arr.get(99) {
    Some(val) => println!("값: {}", val),
    None      => println!("범위를 벗어났습니다"),
}
```

TypeScript는 범위를 벗어난 인덱스에 접근하면 `undefined`를 반환하지만, Rust에서 `arr[99]`처럼 직접 인덱싱하면 프로그램이 패닉을 일으키며 종료됩니다. 안전하게 접근하려면 `.get()`을 써서 `Option`으로 처리하세요.

### 이터레이션

```typescript
// TypeScript
const arr = [1, 2, 3];
arr.forEach(x => console.log(x));
const doubled = arr.map(x => x * 2);
```

```rust
// Rust
let arr = vec![1, 2, 3];

// for 루프
for x in &arr {
    println!("{}", x);
}

// 이터레이터 체이닝
let doubled: Vec<i32> = arr.iter().map(|x| x * 2).collect();
```

`&arr`로 순회하면 벡터의 소유권이 이동하지 않습니다. 만약 `for x in arr`처럼 참조 없이 쓰면, 루프가 끝난 뒤 `arr`는 더 이상 사용할 수 없습니다(소유권이 루프로 이동). 대부분의 경우 `&arr` 또는 `.iter()`를 사용하세요.

```rust
let arr = vec![1, 2, 3];

// 값을 수정하면서 순회
let mut arr2 = vec![1, 2, 3];
for x in &mut arr2 {
    *x *= 2;
}
// arr2 == [2, 4, 6]
```

### 슬라이스 `&[T]` — TypeScript에는 없는 개념

Rust에는 `&[T]`라는 슬라이스 타입이 있습니다. 벡터나 배열의 일부를 복사 없이 빌려오는 방법입니다.

```rust
let arr = vec![1, 2, 3, 4, 5];

// 슬라이스: 인덱스 1~3 (3은 미포함)
let slice: &[i32] = &arr[1..3]; // [2, 3]

// 함수에 Vec 대신 슬라이스를 받으면 더 유연함
fn sum(slice: &[i32]) -> i32 {
    slice.iter().sum()
}

sum(&arr);           // Vec 전체 전달
sum(&arr[1..3]);     // 일부만 전달
```

TypeScript에서 `Array.prototype.slice()`는 새 배열을 복사해서 반환하지만, Rust의 `&[T]`는 복사 없이 원본 데이터를 참조합니다. 메모리 효율이 훨씬 좋습니다.

---

## 2. `String` — TypeScript string과의 차이

Rust의 문자열은 TypeScript보다 복잡합니다. 핵심은 두 가지 타입이 있다는 것입니다.

| 타입 | 특징 |
|------|------|
| `&str` | 문자열 슬라이스 (불변 참조, 주로 리터럴) |
| `String` | 힙에 저장된 소유 문자열 (가변 가능) |

### `&str` vs `String`

```typescript
// TypeScript — 문자열은 항상 불변 값 타입
const greeting: string = "안녕하세요";
let mutable = "Hello";
mutable = mutable + " World"; // 새 문자열 생성
```

```rust
// Rust
let literal: &str = "안녕하세요";        // 문자열 슬라이스 (프로그램 바이너리에 저장)
let owned: String = String::from("안녕하세요"); // 힙에 저장된 소유 문자열
let owned2 = "안녕하세요".to_string();   // 동일한 결과
```

함수 파라미터로 문자열을 받을 때는 `&str`을 쓰는 게 관례입니다. `&str`은 `String`의 슬라이스도 받을 수 있어 더 유연합니다.

```rust
// &str을 받으면 String과 &str 모두 전달 가능
fn greet(name: &str) {
    println!("안녕하세요, {}!", name);
}

greet("철수");                      // &str 직접 전달
greet(&String::from("영희"));       // String의 참조 전달
```

### 문자열 생성 및 연결

```typescript
// TypeScript
const s1 = "Hello";
const s2 = " World";
const s3 = s1 + s2;                  // "Hello World"
const s4 = `${s1}, ${s2}!`;          // 템플릿 리터럴
```

```rust
// Rust
let s1 = String::from("Hello");
let s2 = String::from(" World");

// + 연산자: s1의 소유권이 이동함에 주의!
let s3 = s1 + &s2;  // s1은 이후 사용 불가

// format! 매크로: 소유권 이동 없이 편리하게 연결
let s4 = String::from("Hello");
let s5 = format!("{}, {}!", s4, s2); // s4, s2 모두 이후에도 사용 가능
```

`+` 연산자를 쓸 때 주의하세요. 왼쪽 피연산자(`s1`)의 소유권이 이동합니다. 여러 문자열을 조합할 때는 `format!` 매크로가 훨씬 편하고 안전합니다.

### UTF-8 인덱싱이 안 되는 이유

TypeScript의 문자열은 UTF-16으로 인코딩되고, Rust의 `String`은 UTF-8로 인코딩됩니다. 때문에 Rust에서는 바이트 인덱스로 문자를 직접 가져올 수 없습니다.

```typescript
// TypeScript — 인덱싱 가능
const s = "한글";
console.log(s[0]); // "한"
```

```rust
// Rust — 인덱스 접근 불가 (컴파일 에러)
let s = String::from("한글");
// let c = s[0]; // 에러! String은 인덱싱 불가

// 이유: "한" 한 글자가 UTF-8로 3바이트를 차지함
// s[0]이 첫 번째 바이트인지 첫 번째 문자인지 모호함
```

왜 그럴까요? "한"은 UTF-8로 인코딩하면 `0xED 0xB5 0x9C` 세 바이트를 차지합니다. 만약 `s[0]`을 허용한다면 바이트를 반환할지, 문자를 반환할지 불명확합니다. Rust는 이 모호함을 컴파일 에러로 차단합니다.

### `chars()` / `bytes()` 이터레이션

```rust
let s = String::from("안녕Rust");

// 유니코드 문자 단위로 순회
for c in s.chars() {
    print!("{} ", c); // 안 녕 R u s t
}

// 바이트 단위로 순회
for b in s.bytes() {
    print!("{} ", b); // 각 바이트의 숫자 값
}

// n번째 문자 가져오기
let third = s.chars().nth(2); // Some('R')
```

문자 단위 처리가 필요하면 `.chars()`, 바이너리 처리가 필요하면 `.bytes()`를 쓰세요. TypeScript처럼 `[n]`으로 바로 접근하는 것보다 명시적이지만, 의도가 훨씬 명확합니다.

---

## 3. HashMap\<K, V\> — TypeScript Map/Record와 비교

`HashMap<K, V>`는 TypeScript의 `Map<K, V>` 또는 `Record<string, V>`와 대응되는 타입입니다.

### 생성 및 삽입

```typescript
// TypeScript
const map = new Map<string, number>();
map.set("apple", 3);
map.set("banana", 5);

const record: Record<string, number> = { apple: 3, banana: 5 };
```

```rust
use std::collections::HashMap;

// Rust
let mut map: HashMap<String, i32> = HashMap::new();
map.insert(String::from("apple"), 3);
map.insert(String::from("banana"), 5);

// 초기값과 함께 생성
let map2: HashMap<&str, i32> = [("apple", 3), ("banana", 5)]
    .into_iter()
    .collect();
```

`HashMap`은 표준 라이브러리에 있지만 `use`로 가져와야 합니다. `Vec`이나 `String`과 달리 자동으로 스코프에 포함되지 않습니다.

### 값 읽기 — `get()` → `Option<&V>`

```typescript
// TypeScript
const map = new Map([["apple", 3]]);
const count = map.get("apple"); // number | undefined
if (count !== undefined) {
    console.log(count);
}
```

```rust
// Rust
let mut map = HashMap::new();
map.insert("apple", 3);

// .get()은 Option<&V>를 반환
match map.get("apple") {
    Some(count) => println!("개수: {}", count),
    None        => println!("없는 키입니다"),
}

// 또는 간단하게
if let Some(count) = map.get("apple") {
    println!("개수: {}", count);
}
```

TypeScript의 `map.get()`은 `T | undefined`를 반환하고, Rust는 `Option<&V>`를 반환합니다. 개념은 같지만, Rust에서는 명시적으로 패턴 매칭이나 `if let`으로 처리해야 합니다.

### entry API — TypeScript의 `||=` 대응

TypeScript에서 "없으면 기본값 설정, 있으면 업데이트" 패턴은 이렇게 씁니다.

```typescript
// TypeScript
const counter = new Map<string, number>();
const word = "hello";
counter.set(word, (counter.get(word) ?? 0) + 1);

// 또는 ||= (논리 할당 연산자)
counter.set(word, (counter.get(word) || 0) + 1);
```

Rust에서는 `entry` API가 이 역할을 훨씬 우아하게 처리합니다.

```rust
// Rust
let mut counter: HashMap<String, i32> = HashMap::new();
let word = String::from("hello");

// entry: 키가 없으면 삽입, 있으면 그 값을 가져옴
counter.entry(word).or_insert(0);

// 더 관용적인 패턴: 값을 바로 수정
let mut counter: HashMap<&str, i32> = HashMap::new();
let text = "hello world hello rust hello";
for word in text.split_whitespace() {
    let count = counter.entry(word).or_insert(0);
    *count += 1; // 역참조로 값 수정
}
// {"hello": 3, "world": 1, "rust": 1}
```

`entry().or_insert(0)`은 키가 없으면 0을 삽입하고, 있으면 기존 값의 가변 참조를 반환합니다.

`*count += 1`로 역참조해서 값을 직접 수정할 수 있습니다.

### 이터레이션

```typescript
// TypeScript
const map = new Map([["a", 1], ["b", 2]]);
map.forEach((value, key) => console.log(`${key}: ${value}`));
for (const [key, value] of map) {
    console.log(`${key}: ${value}`);
}
```

```rust
// Rust
let mut map = HashMap::new();
map.insert("a", 1);
map.insert("b", 2);

for (key, value) in &map {
    println!("{}: {}", key, value);
}

// 키만 순회
for key in map.keys() { println!("{}", key); }

// 값만 순회
for val in map.values() { println!("{}", val); }
```

순회 순서는 TypeScript의 `Map`과 달리 삽입 순서가 보장되지 않습니다. 
순서가 필요하다면 `BTreeMap`을 사용하세요.

### 소유권과 HashMap

HashMap에 값을 넣으면 소유권이 이동합니다. 이 점은 TypeScript와 크게 다릅니다.

```rust
let key = String::from("color");
let value = String::from("blue");

let mut map = HashMap::new();
map.insert(key, value); // key와 value의 소유권이 map으로 이동

// 이후 key, value 사용 불가!
// println!("{}", key); // 컴파일 에러
```

복사 가능한 타입(`i32`, `bool` 등)은 소유권이 이동하지 않고 복사됩니다. `String` 같은 힙 타입은 소유권이 이동하므로, 원본을 유지하려면 `.clone()`을 사용하거나 `&str`을 키로 쓰세요.

```rust
let key = String::from("color");
let mut map = HashMap::new();
map.insert(key.clone(), "blue"); // clone으로 복사해서 삽입
println!("{}", key);              // key는 여전히 유효
```

---

## 4. 실전 예제: 단어 빈도수 세기

TypeScript와 Rust로 동일한 기능을 구현해봅시다. 문장에서 각 단어가 몇 번 등장하는지 셉니다.

### TypeScript 구현

```typescript
function countWords(text: string): Map<string, number> {
    const counter = new Map<string, number>();

    for (const word of text.split(/\s+/)) {
        const trimmed = word.toLowerCase().replace(/[^a-z가-힣]/g, "");
        if (trimmed.length === 0) continue;
        counter.set(trimmed, (counter.get(trimmed) ?? 0) + 1);
    }

    return counter;
}

const text = "Rust는 빠르다 Rust는 안전하다 Rust는 재밌다";
const result = countWords(text);

// 빈도수 내림차순 정렬
const sorted = [...result.entries()].sort((a, b) => b[1] - a[1]);
for (const [word, count] of sorted) {
    console.log(`${word}: ${count}`);
}
// rust는: 3
// 빠르다: 1
// 안전하다: 1
// 재밌다: 1
```

### Rust 구현

```rust
use std::collections::HashMap;

fn count_words(text: &str) -> HashMap<String, u32> {
    let mut counter: HashMap<String, u32> = HashMap::new();

    for word in text.split_whitespace() {
        let trimmed = word.to_lowercase();
        if trimmed.is_empty() {
            continue;
        }
        // entry API로 간결하게 카운트
        let count = counter.entry(trimmed).or_insert(0);
        *count += 1;
    }

    counter
}

fn main() {
    let text = "Rust는 빠르다 Rust는 안전하다 Rust는 재밌다";
    let result = count_words(text);

    // 빈도수 내림차순 정렬
    let mut pairs: Vec<(&String, &u32)> = result.iter().collect();
    pairs.sort_by(|a, b| b.1.cmp(a.1));

    for (word, count) in pairs {
        println!("{}: {}", word, count);
    }
    // rust는: 3
    // 빠르다: 1
    // 안전하다: 1
    // 재밌다: 1
}
```

### 두 구현의 핵심 차이점

| 비교 항목 | TypeScript | Rust |
|-----------|-----------|------|
| 없는 키 처리 | `?? 0` 또는 `\|\|=` | `entry().or_insert(0)` |
| 가변성 선언 | `const`도 가변 | `mut` 명시 필요 |
| 정렬 | `Array.sort()` | `Vec::sort_by()` |
| 반환 타입 | `Map<string, number>` | `HashMap<String, u32>` |
| 메모리 | GC가 자동 관리 | 스코프 벗어나면 자동 해제 |

Rust 코드에서 `count_words` 함수는 `&str`을 받아 소유권 이동 없이 텍스트를 처리하고, 내부에서 만든 `HashMap`의 소유권을 반환합니다. 호출자가 반환된 `HashMap`을 소유하게 되며, 더 이상 필요 없어지면 자동으로 메모리가 해제됩니다.

---

## 정리

| | TypeScript | Rust |
|---|---|---|
| 동적 배열 | `Array<T>` | `Vec<T>` |
| 문자열 (리터럴) | `string` | `&str` |
| 문자열 (소유) | `string` | `String` |
| 키-값 저장소 | `Map<K, V>` | `HashMap<K, V>` |

Rust 컬렉션을 쓸 때 기억할 세 가지:

1. **수정하려면 `mut`**: TypeScript의 `const`와 달리, Rust의 변수는 기본이 불변입니다.
2. **인덱싱 대신 `.get()`**: 안전한 접근을 위해 `Option`을 반환하는 메서드를 선호하세요.
3. **소유권 주의**: `HashMap`이나 `Vec`에 `String`을 넣으면 소유권이 이동합니다. 원본을 유지하려면 `.clone()` 또는 참조(`&`)를 활용하세요.

---

## 챕터 연결

이전 챕터에서 enum과 match를 익혔다면, 이제 컬렉션에서 그 개념이 어떻게 쓰이는지 본 것이다.
다음 챕터에서는 trait 시스템으로 확장한다.
