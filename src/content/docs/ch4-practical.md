---
title: "Ch.12 — Practical Examples"
description: "React vs Leptos, Zod vs Serde, error handling patterns"
---

Enough theory — let's write some actual code. We'll implement the same things in both TypeScript and Rust to feel the differences firsthand.

---

## 4-1. UI Components: React vs Leptos

We'll build a simple user list/add UI in both languages.

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

### Structural Comparison

| Aspect | React (TS) | Leptos (Rust) |
|------|----------------|-------------|
| Type safety | TS compile time + runtime (optional) | Rust compile time |
| State management | `useState` hook | `Signal` (reactive) |
| Template | JSX | `view!` macro |
| Events | `onChange`, `onSubmit` | `on:input`, `on:click` |
| Runtime | Browser JS | WASM + browser |
| Ecosystem | Massive | Growing |

---

## 4-2. JSON Parsing: Zod vs Serde

### TypeScript — Type-Safe Parsing with Zod

```typescript
import { z } from "zod";

// schema definition
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

// type is automatically inferred
type User = z.infer<typeof UserSchema>;

// JSON parsing
function parseUser(json: string): User {
  const raw = JSON.parse(json); // no type
  return UserSchema.parse(raw); // validation + type safety
}

// error handling
const result = UserSchema.safeParse(rawData);
if (result.success) {
  console.log(result.data.name); // User type guaranteed
} else {
  console.error(result.error.flatten()); // detailed errors
}

// serialization
const user: User = { /* ... */ };
const json = JSON.stringify(user); // just works
```

### Rust — Compile-Time Safety with Serde

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

// struct definition = schema definition
// derive macros auto-generate serialization/deserialization code
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
    #[serde(default)]           // defaults to empty Vec if absent
    tags: Vec<String>,
    created_at: DateTime<Utc>,  // chrono handles ISO 8601 parsing
}

// JSON → User (deserialization)
fn parse_user(json: &str) -> Result<User, serde_json::Error> {
    serde_json::from_str(json)
}

// User → JSON (serialization)
fn serialize_user(user: &User) -> Result<String, serde_json::Error> {
    serde_json::to_string(user)
}

// actual usage
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
            // user.age is None (optional and absent from JSON)
        }
        Err(e) => eprintln!("Parse error: {}", e),
    }
}
```

### Field Name Conversion (snake_case ↔ camelCase)

```typescript
// TypeScript (Zod): write conversion logic manually or use transform
const UserSchema = z.object({
  userId: z.number(),     // camelCase
  userName: z.string(),
});
```

```rust
// Rust (Serde): declarative conversion via attributes
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]  // all fields use camelCase
struct User {
    user_id: u32,    // JSON: "userId"
    user_name: String, // JSON: "userName"
}

// per-field conversion
#[derive(Serialize, Deserialize)]
struct Config {
    #[serde(rename = "api_key")]
    api_key: String,  // reads and writes as "api_key" in JSON
}
```

### Type Safety Comparison

| Aspect | Zod (TS) | Serde (Rust) |
|------|---------|-------------|
| Schema location | Separate `z.object()` definition | The struct itself is the schema |
| Validation point | Runtime | At deserialization (runtime) |
| Type inference | `z.infer<typeof Schema>` | Use the struct type directly |
| Nested structures | Nested schema references | Nested structs |
| Default values | `.default(value)` | `#[serde(default)]` |
| Field name conversion | Write conversion logic | `rename_all` attribute |
| Performance | Runtime schema traversal | Direct mapping via compiled code |

---

## 4-3. Error Handling Patterns

A common real-world scenario: read a file → parse JSON → save to DB.

### TypeScript — Nested try/catch Hell

```typescript
import fs from "fs/promises";

interface UserData {
  name: string;
  email: string;
}

// approach 1: nested try/catch — hard to tell where it failed
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

// approach 2: single try/catch — hard to distinguish error types
async function loadAndSaveUser_v2(filePath: string): Promise<void> {
  try {
    const rawData = await fs.readFile(filePath, "utf-8");
    const userData = JSON.parse(rawData) as UserData; // type assertion needed
    await saveToDatabase(userData);
  } catch (e) {
    // hard to tell if e is a file error, parse error, or DB error
    if (e instanceof Error) {
      console.error(e.message);
    }
    throw e;
  }
}

// approach 3: distinguish error types (verbose)
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

### Rust — Clean Error Chaining with the ? Operator

```rust
use std::fs;
use serde::{Deserialize, Serialize};
use thiserror::Error;  // convenience crate for defining errors

// error type definition — the function signature makes clear what errors can occur
#[derive(Debug, Error)]
enum AppError {
    #[error("File read failed: {0}")]
    FileRead(#[from] std::io::Error),      // io::Error → AppError auto-conversion

    #[error("JSON parse failed: {0}")]
    Parse(#[from] serde_json::Error),      // serde_json::Error → AppError auto-conversion

    #[error("Database error: {0}")]
    Database(String),
}

#[derive(Deserialize)]
struct UserData {
    name: String,
    email: String,
}

// ? operator chaining — error propagation without try/catch
async fn load_and_save_user(file_path: &str) -> Result<(), AppError> {
    let raw = fs::read_to_string(file_path)?;  // io::Error → AppError::FileRead
    let user: UserData = serde_json::from_str(&raw)?;  // serde_json::Error → AppError::Parse
    save_to_database(&user).await?;           // DbError → AppError::Database
    Ok(())
}

// error types are clearly distinguished at the call site
async fn main_handler() {
    match load_and_save_user("user.json").await {
        Ok(()) => println!("Success"),
        Err(AppError::FileRead(e)) => eprintln!("Could not read file: {}", e),
        Err(AppError::Parse(e)) => eprintln!("Invalid JSON format: {}", e),
        Err(AppError::Database(msg)) => eprintln!("DB save failed: {}", msg),
    }
}
```

### More Complex Scenario: Error Conversion and Adding Context

```typescript
// TypeScript — adding context to errors
async function processUserFile(filePath: string): Promise<ProcessResult> {
  try {
    const user = await loadAndSaveUser_v3(filePath);
    return { success: true, user };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
      filePath, // add context
    };
  }
}
```

```rust
// Rust — convenient context via the anyhow crate
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

// on error, the full context chain is printed:
// "Failed to read file: user.json"
// "Caused by: No such file or directory"
```

### Error Handling Strategy Summary

| Situation | TypeScript | Rust |
|------|-----------|------|
| Simple error propagation | `throw e` | `?` operator |
| Explicit error types | None (in function signature) | `Result<T, MyError>` |
| Error conversion | catch then throw new error | `#[from]` or `.map_err()` |
| Adding context | `new Error(\`ctx: ${e}\`)` | `.with_context(\|\| ...)` |
| Distinguishing error kinds | `instanceof` check | `match` + enum variant |
| Ignoring errors | `.catch(() => {})` | `.ok()` (converts to Option) |
| Unconditional failure | `throw new Error(...)` | `panic!(...)` (generally discouraged) |

### Core Advantages of Rust Error Handling

1. **The function signature is documentation**: `-> Result<User, DbError>` immediately tells you what errors this function can produce.
2. **Handling is enforced**: Ignoring a Result triggers a compiler warning. You can't accidentally swallow errors.
3. **? operator**: Propagates errors with a single character while preserving type safety.
4. **Exhaustive matching**: If you forget a case when `match`-ing on errors, it's a compile error.

---

## Chapter Connection

The syntax and Ownership concepts from earlier chapters come together as real code here.
The next chapter provides a learning roadmap to tie together the overall journey.
