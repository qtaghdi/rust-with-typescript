---
title: "Ch.9 — 실전 예제"
description: "React vs Leptos, Zod vs Serde, 에러 핸들링 패턴"
---

이론은 충분히 봤으니 이제 실제로 코드를 짜봅시다. TypeScript로 만든 것들을 Rust로 구현하면서 차이를 체감해보겠습니다.

---

## 4-1. UI 컴포넌트: React vs Leptos

간단한 사용자 목록/추가 UI를 두 언어로 구현합니다.

### TypeScript — React

```typescript
import React, { useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
}

type NewUser = Omit<User, "id">;

const initialUsers: User[] = [
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" },
];

export function UserList() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fakeSave = (user: NewUser) =>
    new Promise<NewUser>((resolve, reject) => {
      setTimeout(() => {
        if (!user.email.includes("@")) {
          reject(new Error("Invalid email"));
          return;
        }
        resolve(user);
      }, 400);
    });

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const newUser: User = {
      id: users.length + 1,
      name: name.trim(),
      email: email.trim(),
    };

    setIsSaving(true);
    setError(null);

    try {
      await fakeSave(newUser);
      setUsers([...users, newUser]);
      setName("");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section>
      <h2>Users</h2>
      <ul>
        {users.map((u) => (
          <li key={u.id}>
            {u.name} — {u.email}
          </li>
        ))}
      </ul>

      <form onSubmit={addUser}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Add"}
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
    </section>
  );
}
```

### Rust — Leptos

```toml
# Cargo.toml
[dependencies]
leptos = { version = "0.6", features = ["csr"] }
```

```rust
use leptos::*;

#[derive(Clone)]
struct User {
    id: usize,
    name: String,
    email: String,
}

#[component]
fn UserList() -> impl IntoView {
    let (users, set_users) = create_signal(vec![
        User { id: 1, name: "Alice".into(), email: "alice@example.com".into() },
        User { id: 2, name: "Bob".into(), email: "bob@example.com".into() },
    ]);

    let (name, set_name) = create_signal(String::new());
    let (email, set_email) = create_signal(String::new());

    let add_user = move |_| {
        let name = name.get().trim().to_string();
        let email = email.get().trim().to_string();
        if name.is_empty() || email.is_empty() {
            return;
        }

        set_users.update(|list| {
            let id = list.len() + 1;
            list.push(User { id, name, email });
        });
        set_name.set(String::new());
        set_email.set(String::new());
    };

    view! {
        <section>
            <h2>"Users"</h2>
            <ul>
                <For
                    each=move || users.get()
                    key=|u| u.id
                    children=|u| view! { <li>{u.name} " — " {u.email}</li> }
                />
            </ul>

            <div>
                <input
                    prop:value=move || name.get()
                    on:input=move |e| set_name.set(event_target_value(&e))
                    placeholder="Name"
                />
                <input
                    prop:value=move || email.get()
                    on:input=move |e| set_email.set(event_target_value(&e))
                    placeholder="Email"
                />
                <button on:click=add_user>"Add"</button>
            </div>
        </section>
    }
}
```

### 구조 차이 비교

| 관점 | React (TS) | Leptos (Rust) |
|------|----------------|-------------|
| 타입 안전성 | TS 컴파일 타임 + 런타임(선택) | Rust 컴파일 타임 |
| 상태 관리 | `useState` 훅 | `Signal` (반응형) |
| 템플릿 | JSX | `view!` 매크로 |
| 이벤트 | `onChange`, `onSubmit` | `on:input`, `on:click` |
| 런타임 | 브라우저 JS | WASM + 브라우저 |
| 생태계 | 거대 | 성장 중 |

---

## 4-2. JSON 파싱: Zod vs Serde

### TypeScript — Zod로 타입 안전한 파싱

```typescript
import { z } from "zod";

// 스키마 정의
const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  zip: z.string().regex(/^\d{5}$/, "Invalid ZIP"),
});

const UserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(0).max(150).optional(),
  address: AddressSchema.optional(),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
});

// 타입 자동 추론
type User = z.infer<typeof UserSchema>;

// JSON 파싱
function parseUser(json: string): User {
  const raw = JSON.parse(json); // 타입 없음
  return UserSchema.parse(raw); // 검증 + 타입 확보
}

// 에러 처리
const result = UserSchema.safeParse(rawData);
if (result.success) {
  console.log(result.data.name); // User 타입 확보
} else {
  console.error(result.error.flatten()); // 상세 에러
}

// 직렬화
const user: User = { /* ... */ };
const json = JSON.stringify(user); // 그냥 됨
```

### Rust — Serde로 컴파일 타임 안전성

```toml
# Cargo.toml
[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
chrono = { version = "0.4", features = ["serde"] }
```

```rust
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

// 구조체 정의 = 스키마 정의
// derive 매크로가 직렬화/역직렬화 코드를 자동 생성
#[derive(Debug, Serialize, Deserialize, Clone)]
struct Address {
    street: String,
    city: String,
    zip: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct User {
    id: u32,
    name: String,
    email: String,
    age: Option<u8>,            // optional → Option<T>
    address: Option<Address>,   // optional nested
    #[serde(default)]           // 없으면 빈 Vec
    tags: Vec<String>,
    created_at: DateTime<Utc>,  // chrono가 ISO 8601 파싱 처리
}

// JSON → User (역직렬화)
fn parse_user(json: &str) -> Result<User, serde_json::Error> {
    serde_json::from_str(json)
}

// User → JSON (직렬화)
fn serialize_user(user: &User) -> Result<String, serde_json::Error> {
    serde_json::to_string(user)
}

// 실제 사용
fn main() {
    let json = r#"{
        "id": 1,
        "name": "Alice",
        "email": "alice@example.com",
        "tags": ["admin", "user"],
        "created_at": "2024-01-01T00:00:00Z"
    }"#;

    match serde_json::from_str::<User>(json) {
        Ok(user) => {
            println!("Name: {}", user.name);
            println!("Tags: {:?}", user.tags);
            // user.age는 None (optional이고 JSON에 없었으므로)
        }
        Err(e) => eprintln!("Parse error: {}", e),
    }
}
```

### 필드 이름 변환 (snake_case ↔ camelCase)

```typescript
// TypeScript (Zod): 변환 로직 직접 작성하거나 transform 사용
const UserSchema = z.object({
  userId: z.number(),     // camelCase
  userName: z.string(),
});
```

```rust
// Rust (Serde): 어트리뷰트로 선언적 변환
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]  // 모든 필드 camelCase로
struct User {
    user_id: u32,    // JSON: "userId"
    user_name: String, // JSON: "userName"
}

// 개별 필드 변환
#[derive(Serialize, Deserialize)]
struct Config {
    #[serde(rename = "api_key")]
    api_key: String,  // JSON에서 "api_key"로 읽고 씀
}
```

### 타입 안전성 비교

| 관점 | Zod (TS) | Serde (Rust) |
|------|---------|-------------|
| 스키마 위치 | 별도 z.object() 정의 | 구조체 자체가 스키마 |
| 검증 시점 | 런타임 | 역직렬화 시 (런타임) |
| 타입 추론 | `z.infer<typeof Schema>` | 구조체 타입 직접 사용 |
| 중첩 구조 | 중첩 schema 참조 | 중첩 struct |
| 기본값 | `.default(value)` | `#[serde(default)]` |
| 필드 이름 변환 | 변환 로직 작성 | `rename_all` 어트리뷰트 |
| 성능 | 런타임 스키마 순회 | 컴파일된 코드로 직접 매핑 |

---

## 4-3. 에러 핸들링 패턴

실제 서비스에서 자주 보이는 시나리오: 파일 읽기 → JSON 파싱 → DB 저장을 예로 들겠습니다.

### TypeScript — try/catch 중첩 지옥

```typescript
import fs from "fs/promises";

interface UserData {
  name: string;
  email: string;
}

// 방법 1: 중첩 try/catch — 어디서 실패했는지 파악 어려움
async function loadAndSaveUser_v1(filePath: string): Promise<void> {
  let rawData: string;
  try {
    rawData = await fs.readFile(filePath, "utf-8");
  } catch (e) {
    throw new Error(`File read failed: ${e}`);
  }

  let userData: UserData;
  try {
    userData = JSON.parse(rawData) as UserData;
  } catch (e) {
    throw new Error(`JSON parse failed: ${e}`);
  }

  try {
    await saveToDatabase(userData);
  } catch (e) {
    throw new Error(`DB save failed: ${e}`);
  }
}

// 방법 2: 하나의 try/catch — 에러 구분 어려움
async function loadAndSaveUser_v2(filePath: string): Promise<void> {
  try {
    const rawData = await fs.readFile(filePath, "utf-8");
    const userData = JSON.parse(rawData) as UserData; // 타입 단언 필요
    await saveToDatabase(userData);
  } catch (e) {
    // e가 파일 에러인지, 파싱 에러인지, DB 에러인지 알기 어려움
    if (e instanceof Error) {
      console.error(e.message);
    }
    throw e;
  }
}

// 방법 3: 에러 타입 구분 (verbose)
class FileReadError extends Error {
  constructor(msg: string) { super(msg); this.name = "FileReadError"; }
}
class ParseError extends Error {
  constructor(msg: string) { super(msg); this.name = "ParseError"; }
}
class DbError extends Error {
  constructor(msg: string) { super(msg); this.name = "DbError"; }
}

async function loadAndSaveUser_v3(filePath: string): Promise<void> {
  try {
    const rawData = await fs.readFile(filePath, "utf-8")
      .catch(e => { throw new FileReadError(String(e)); });

    const userData: UserData = await Promise.resolve(JSON.parse(rawData))
      .catch(e => { throw new ParseError(String(e)); });

    await saveToDatabase(userData)
      .catch(e => { throw new DbError(String(e)); });
  } catch (e) {
    if (e instanceof FileReadError) { /* ... */ }
    else if (e instanceof ParseError) { /* ... */ }
    else if (e instanceof DbError) { /* ... */ }
    else throw e;
  }
}
```

### Rust — ? 연산자로 깔끔한 에러 체이닝

```rust
use std::fs;
use serde::{Deserialize, Serialize};
use thiserror::Error;  // 에러 정의 편의 크레이트

// 에러 타입 정의 — 함수 시그니처에서 어떤 에러가 나올지 명시
#[derive(Debug, Error)]
enum AppError {
    #[error("File read failed: {0}")]
    FileRead(#[from] std::io::Error),      // io::Error → AppError 자동 변환

    #[error("JSON parse failed: {0}")]
    Parse(#[from] serde_json::Error),      // serde_json::Error → AppError 자동 변환

    #[error("Database error: {0}")]
    Database(String),
}

#[derive(Deserialize)]
struct UserData {
    name: String,
    email: String,
}

// ? 연산자 체이닝 — try/catch 없이도 에러 전파
async fn load_and_save_user(file_path: &str) -> Result<(), AppError> {
    let raw = fs::read_to_string(file_path)?;  // io::Error → AppError::FileRead
    let user: UserData = serde_json::from_str(&raw)?;  // serde_json::Error → AppError::Parse
    save_to_database(&user).await?;           // DbError → AppError::Database
    Ok(())
}

// 호출부에서 에러 타입 구분이 명확함
async fn main_handler() {
    match load_and_save_user("user.json").await {
        Ok(()) => println!("Success"),
        Err(AppError::FileRead(e)) => eprintln!("파일을 읽을 수 없음: {}", e),
        Err(AppError::Parse(e)) => eprintln!("JSON 형식 오류: {}", e),
        Err(AppError::Database(msg)) => eprintln!("DB 저장 실패: {}", msg),
    }
}
```

### 더 복잡한 시나리오: 에러 변환과 컨텍스트 추가

```typescript
// TypeScript — 에러에 컨텍스트 추가
async function processUserFile(filePath: string): Promise<ProcessResult> {
  try {
    const user = await loadAndSaveUser_v3(filePath);
    return { success: true, user };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
      filePath, // 컨텍스트 추가
    };
  }
}
```

```rust
// Rust — anyhow 크레이트로 편리한 컨텍스트 추가
use anyhow::{Context, Result};  // anyhow::Result = Result<T, anyhow::Error>

async fn process_user_file(file_path: &str) -> Result<ProcessResult> {
    let raw = fs::read_to_string(file_path)
        .with_context(|| format!("Failed to read file: {}", file_path))?;

    let user: UserData = serde_json::from_str(&raw)
        .with_context(|| format!("Invalid JSON in file: {}", file_path))?;

    save_to_database(&user).await
        .with_context(|| format!("DB save failed for user: {}", user.name))?;

    Ok(ProcessResult { success: true })
}

// 에러 출력 시 전체 컨텍스트 체인이 나옴:
// "Failed to read file: user.json"
// "Caused by: No such file or directory"
```

### 에러 처리 전략 정리

| 상황 | TypeScript | Rust |
|------|-----------|------|
| 단순 에러 전파 | `throw e` | `?` 연산자 |
| 에러 타입 명시 | 없음 (함수 시그니처에서) | `Result<T, MyError>` |
| 에러 변환 | catch 후 새 에러 throw | `#[from]` 또는 `.map_err()` |
| 컨텍스트 추가 | `new Error(\`ctx: ${e}\`)` | `.with_context(\|\| ...)` |
| 에러 종류 구분 | `instanceof` 체크 | `match` + enum 변형 |
| 에러 무시 | `.catch(() => {})` | `.ok()` (Option으로 변환) |
| 무조건 실패 | `throw new Error(...)` | `panic!(...)` (일반적으로 지양) |

### Rust 에러 처리의 핵심 장점

1. **함수 시그니처가 문서다**: `-> Result<User, DbError>`를 보면 이 함수가 어떤 에러를 낼 수 있는지 바로 알 수 있습니다.
2. **처리 강제**: Result를 무시하면 컴파일러 경고가 납니다. 에러를 흘려보내는 실수를 방지합니다.
3. **? 연산자**: 에러 전파를 한 글자로 표현하면서도 타입 안전성을 유지합니다.
4. **exhaustive matching**: `match`로 에러를 처리할 때 모든 케이스를 빠뜨리면 컴파일 에러입니다.
