---
title: "Ch.2 — 멘탈 모델"
description: "TypeScript와 Rust의 철학 차이"
---

Rust를 배울 때 가장 먼저 바꿔야 하는 건 문법이 아닙니다. **생각하는 방식**입니다.

TypeScript와 Rust는 둘 다 강타입 언어지만, 안전성을 달성하는 방법과 그 철학이 근본적으로 다릅니다. 이 차이를 이해하면 Rust의 "이상한" 제약들이 왜 존재하는지 납득이 됩니다.

---

## 축 1: 런타임 안전성 vs 컴파일타임 안전성

### TypeScript의 방식: 최선을 다하지만 런타임은 JavaScript

TypeScript는 JavaScript에 타입을 얹은 언어입니다. 컴파일하면 `.js` 파일이 나오고, 실제 실행은 JavaScript 엔진이 합니다. 이 말은 TypeScript의 타입 정보가 런타임에는 사라진다는 뜻입니다.

```typescript
// TypeScript — 컴파일은 통과
function greet(name: string): string {
  return `Hello, ${name}!`;
}

// 런타임에 이렇게 호출되면? → 그냥 실행됨
greet(42 as any); // "Hello, 42!" 출력
```

TypeScript는 `as any`나 타입 단언(type assertion)으로 타입 시스템을 우회할 수 있습니다. 외부 데이터(API 응답, localStorage 등)는 런타임까지 실제 타입을 알 수 없습니다.

### Rust의 방식: 컴파일이 통과하면 런타임이 보장됨

Rust는 컴파일러가 훨씬 더 강하게 검사합니다. 컴파일이 성공하면 메모리 안전성, null 참조 없음, 데이터 레이스 없음이 **보장**됩니다.

```rust
// Rust — 타입이 맞지 않으면 컴파일 자체가 안 됨
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

greet(42); // 컴파일 에러: expected `&str`, found integer
           // "우회" 방법이 없음 (unsafe 블록 제외)
```

| 관점 | TypeScript | Rust |
|------|-----------|------|
| 타입 검사 시점 | 컴파일 타임 (부분적) | 컴파일 타임 (전면적) |
| 런타임 타입 정보 | 사라짐 (type erasure) | 없음 (zero-cost) |
| 우회 가능 여부 | `any`, 타입 단언으로 가능 | `unsafe` 블록 (의도적으로 어렵게) |
| 런타임 에러 가능성 | 있음 | 극히 제한적 |

---

## 축 2: GC vs Ownership

### TypeScript/JavaScript의 방식: Garbage Collector가 알아서

JavaScript는 메모리를 신경 쓰지 않아도 됩니다. 변수를 만들면 메모리가 할당되고, 더 이상 쓰지 않으면 GC가 나중에 정리합니다.

```typescript
// TypeScript — 메모리? 신경 쓰지 않아도 됨
function createUsers(count: number): User[] {
  const users: User[] = [];
  for (let i = 0; i < count; i++) {
    users.push({ id: i, name: `User ${i}` }); // 메모리 어디서 할당? 몰라도 됨
  }
  return users; // GC가 언젠가 정리해줄 거야
}
```

편리하지만 트레이드오프가 있습니다:
- **GC pause**: GC가 돌 때 프로그램이 잠깐 멈춤 (P99 레이턴시 스파이크 원인)
- **예측 불가**: 메모리 해제 시점을 개발자가 제어할 수 없음
- **오버헤드**: GC 자체가 CPU와 메모리를 씀

### Rust의 방식: Ownership으로 컴파일러가 메모리 관리

Rust는 GC가 없습니다. 대신 **Ownership** 시스템으로 컴파일러가 어느 시점에 메모리를 해제할지를 빌드 타임에 결정하고, 그 해제 코드를 자동으로 삽입합니다.

```rust
// Rust — 컴파일러가 메모리 해제 코드를 자동 삽입
fn create_users(count: usize) -> Vec<User> {
    let mut users = Vec::new(); // 힙에 메모리 할당
    for i in 0..count {
        users.push(User { id: i, name: format!("User {}", i) });
    }
    users // 소유권이 호출자에게 이전됨
} // 이 블록을 벗어나면 users의 메모리가 해제됨 (단, 소유권이 이전되지 않았다면)
```

GC pause가 없으니 레이턴시가 안정적입니다. 메모리 해제 시점이 코드를 보면 바로 알 수 있습니다.

| 관점 | TypeScript (GC) | Rust (Ownership) |
|------|----------------|-----------------|
| 메모리 해제 시점 | GC 마음대로 | 스코프 종료 시 즉시 |
| 개발자 부담 | 없음 | 중간 (Borrow Checker와 협력) |
| 런타임 오버헤드 | GC 비용 | 없음 |
| 메모리 누수 | 가능 (참조 유지 시) | 거의 불가능 |
| 레이턴시 예측성 | GC pause로 불안정 | 안정적 |

---

## 축 3: 동적 타입 느낌 vs 제로코스트 추상화

### TypeScript의 방식: 편의성과 유연성

TypeScript는 JavaScript의 유연함을 최대한 살리면서 타입을 추가했습니다. Union 타입, 조건부 타입, 템플릿 리터럴 타입 등 표현력이 풍부합니다.

```typescript
// TypeScript — 유연한 타입 시스템
type Status = "pending" | "active" | "inactive";
type ApiResponse<T> = {
  data: T;
  status: Status;
  timestamp: number;
};

// 편의 기능: 선택적 프로퍼티, 기본값 등
function createResponse<T>(data: T, status: Status = "active"): ApiResponse<T> {
  return { data, status, timestamp: Date.now() };
}
```

하지만 이 추상화는 런타임에도 실행됩니다. 제네릭 함수는 런타임에 타입 정보 없이 실행되고, 일부 추상화는 성능 비용이 있습니다.

### Rust의 방식: 추상화해도 비용이 없음

Rust의 "제로코스트 추상화(zero-cost abstraction)"는 고수준 코드를 써도 컴파일된 결과가 수동으로 최적화한 저수준 코드와 동일하다는 의미입니다.

```rust
// Rust — 고수준 코드지만 런타임 비용 없음
#[derive(Debug, Serialize)]
struct ApiResponse<T> {
    data: T,
    status: Status,
    timestamp: u64,
}

// 제네릭 함수: 컴파일 시 각 타입별로 특수화(monomorphization)됨
// → 런타임에 타입 정보 조회 없음, 동적 디스패치 없음
fn create_response<T>(data: T, status: Status) -> ApiResponse<T> {
    ApiResponse {
        data,
        status,
        timestamp: current_timestamp(),
    }
}
```

Rust의 이터레이터 체인은 C 스타일 for 루프와 동일한 어셈블리를 생성합니다. 추상화를 써도 성능 걱정을 할 필요가 없습니다.

---

## 정리: 두 언어의 핵심 철학

```
TypeScript:
"일단 빠르게 만들 수 있어야 해.
 타입으로 안전망을 쳐두고,
 문제가 생기면 런타임에서 잡자."

Rust:
"빌드가 통과하면 잘 돌아가야 해.
 런타임 에러는 받아들일 수 없어.
 성능 희생도 받아들일 수 없어."
```

두 철학 중 어느 게 옳다는 게 아닙니다. TypeScript는 빠른 개발 속도와 거대한 생태계가 강점이고, Rust는 안전성과 성능이 강점입니다. 용도에 따라 선택하면 됩니다.

다음 챕터부터는 구체적인 문법을 하나씩 비교합니다. TypeScript에서 익숙한 개념이 Rust에서 어떻게 표현되는지 보면, 생각보다 친숙하게 느껴질 겁니다.

---

## 프론트 관점 매핑

- React state 업데이트는 "누가 이 데이터를 소유하는가"의 문제다 → Rust의 Ownership/가변 참조 규칙과 연결된다.
- 비동기 작업 후 UI 상태 갱신은 "실패/성공"을 분기한다 → Rust의 `Result<T, E>` 모델과 유사하다.
- 불변성을 유지하면 리렌더 버그가 줄어든다 → Rust의 기본 불변(immutable) 모델과 철학이 맞닿아 있다.

## 요약

- TypeScript는 런타임이 JS이므로 타입 안정성이 제한된다.
- Rust는 컴파일이 통과하면 런타임 안전성이 강하게 보장된다.
- GC는 편하지만 예측 불가한 지연을 만든다.
- Ownership은 GC 없이도 안전성을 확보하는 방법이다.
- Rust의 추상화는 성능 비용이 없다.

## 핵심 코드

```rust runnable
fn main() {
    let name = "Rust";
    println!("Hello, {}!", name);
}
```

## 자주 하는 실수

- TypeScript의 `as any` 감각으로 Rust를 우회하려 한다.
- GC가 없는 언어는 무조건 어렵다고 단정한다.
- "추상화 = 느리다"는 가정으로 Rust 코드를 오해한다.

## 연습

1. React 앱에서 성능 병목이 생겼던 지점을 하나 떠올려 보자.
2. 그 병목이 런타임/메모리/동시성 중 어디에 있었는지 분류해보자.

## 챕터 연결

이전 챕터에서는 Rust를 배워야 하는 이유를 정리했다.
다음 챕터에서는 TypeScript와 Rust 문법을 나란히 비교한다.
