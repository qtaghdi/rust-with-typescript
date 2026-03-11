---
title: "Ch.5 — Cargo & 모듈 시스템"
description: "npm/package.json에서 Cargo.toml로 — Rust의 패키지 매니저와 모듈 시스템 완전 정복"
---

TypeScript 개발자에게 npm/yarn은 일상입니다. 의존성 설치, 스크립트 실행, 빌드 — 모두 npm을 통해 처리하죠. Rust의 **Cargo**는 그 역할을 훨씬 통합적으로 수행하는 공식 패키지 매니저이자 빌드 도구입니다. npm + tsc + jest + typedoc을 하나로 합쳐놓은 것이라고 생각하면 됩니다. 그리고 Cargo는 단순한 도구가 아니라 Rust의 **모듈 시스템**과 긴밀하게 연결되어 있습니다.

---

## Cargo vs npm

| 역할 | npm                  | Cargo |
|------|----------------------|-------|
| 패키지 설치 | `npm install`        | `cargo add` / `cargo build` |
| 스크립트 실행 | `npm run dev`        | `cargo run` |
| 빌드 | `tsc` / `vite build` | `cargo build` |
| 릴리즈 빌드 | `npm run build`      | `cargo build --release` |
| 테스트 | `npm test`           | `cargo test` |
| 문서 생성 | `typedoc`            | `cargo doc` |
| 린트/포맷 | `eslint` / `prettier` | `cargo clippy` / `cargo fmt` |
| 패키지 레지스트리 | npmjs.com            | crates.io |

npm과 비교했을 때 Cargo가 갖는 가장 큰 장점은 **공식 통합**입니다. 별도로 jest, prettier, eslint를 설정할 필요 없이, 테스트와 포맷터가 처음부터 내장되어 있습니다.

---

## Cargo.toml vs package.json

두 파일 모두 프로젝트의 메타데이터와 의존성을 정의합니다.

```json
// package.json (TypeScript)
{
  "name": "my-app",
  "version": "1.0.0",
  "description": "나의 TypeScript 앱",
  "main": "dist/index.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest"
  },
  "dependencies": {
    "zod": "^3.22.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

```toml
# Cargo.toml (Rust)
[package]
name = "my-app"
version = "1.0.0"
edition = "2021"
description = "나의 Rust 앱"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
reqwest = { version = "0.11", features = ["json"] }
tokio = { version = "1", features = ["full"] }

[dev-dependencies]
assert_eq = "1.0"
```

몇 가지 차이점이 눈에 띕니다.

- **`edition`**: Rust 언어 에디션을 명시합니다. 현재는 `2021`이 기본입니다. TypeScript의 `"target"` 설정과 유사한 개념입니다.
- **`features`**: 일부 크레이트는 옵션 기능을 feature flag로 제공합니다. npm 패키지와 달리, 필요한 기능만 컴파일에 포함시킬 수 있습니다.
- **`dev-dependencies`**: `devDependencies`와 동일합니다. 테스트나 벤치마크에서만 사용되는 의존성입니다.
- **`Cargo.lock`**: `package-lock.json`에 해당합니다. 라이브러리(`lib`)에서는 `.gitignore`에 추가하지만, 애플리케이션(`bin`)에서는 반드시 커밋합니다.

---

## 자주 쓰는 Cargo 명령어

| npm/yarn | Cargo | 설명 |
|---------|-------|------|
| `npm install` | `cargo build` | 의존성 설치 및 빌드 |
| `npm install serde` | `cargo add serde` | 패키지 추가 |
| `npm uninstall serde` | `cargo remove serde` | 패키지 제거 |
| `npm run dev` | `cargo run` | 프로젝트 실행 |
| `npm test` | `cargo test` | 테스트 실행 |
| `npm run build` | `cargo build --release` | 최적화된 릴리즈 빌드 |
| `npx eslint .` | `cargo clippy` | 린트 검사 |
| `npx prettier --write .` | `cargo fmt` | 코드 포맷 |
| `npm run docs` | `cargo doc --open` | 문서 생성 및 열기 |
| `npm audit` | `cargo audit` | 보안 취약점 검사 |

### 핵심 명령어 설명

**`cargo run`** — 컴파일 후 즉시 실행합니다. `npm run dev`와 비슷하지만 별도 스크립트 설정이 필요 없습니다.

**`cargo build --release`** — 개발 빌드(`cargo build`)와 달리 최적화를 최대로 켜서 컴파일합니다. 파일 크기와 실행 속도 모두 크게 개선됩니다. 프로덕션 배포 전에 반드시 사용하세요.

**`cargo clippy`** — Rust 공식 린터입니다. "이렇게 쓰면 더 관용적인 Rust다"라는 조언을 풍부하게 제공합니다. TypeScript의 ESLint보다 훨씬 적극적으로 코드 품질을 지적합니다.

**`cargo doc --open`** — 코드의 주석(`///`)을 기반으로 HTML 문서를 자동 생성하고 브라우저로 엽니다. 의존성의 문서도 함께 포함됩니다.

---

## 새 프로젝트 시작하기

### 프로젝트 생성

```bash
# TypeScript
npm create vite@latest my-app
npx create-next-app@latest my-app

# Rust — 실행 가능한 바이너리 프로젝트
cargo new my-project

# Rust — 라이브러리 프로젝트
cargo new --lib my-lib
```

### 생성된 디렉토리 구조 비교

```
# TypeScript (Vite 기준)
my-app/
  src/
    main.ts
    App.tsx
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  node_modules/     ← 의존성 (보통 수백 MB)
```

```
# Rust
my-project/
  src/
    main.rs         ← 진입점 (바이너리의 경우)
  Cargo.toml        ← package.json 역할
  Cargo.lock        ← package-lock.json 역할
  target/           ← 빌드 결과물 (node_modules처럼 .gitignore에 추가)
```

구조가 훨씬 단순합니다. `node_modules` 같은 거대한 폴더 대신, 의존성은 Cargo가 시스템 전역 캐시(`~/.cargo/registry`)에 저장합니다. 여러 프로젝트가 같은 버전의 크레이트를 공유하므로 디스크 낭비가 없습니다.

---

## 모듈 시스템: import/export vs mod/use

이 부분이 TypeScript 개발자들이 Rust에서 가장 많이 혼란을 겪는 부분입니다. 파일 시스템 구조만 갖추면 자동으로 모듈이 되는 TypeScript와 달리, **Rust는 모든 모듈을 명시적으로 선언해야 합니다.**

### TypeScript: 파일 = 모듈

TypeScript에서는 파일을 만들면 그 자체가 모듈이 됩니다. `export`로 내보내고, `import`로 가져오면 끝입니다.

```typescript
// src/math/add.ts
export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}
```

```typescript
// src/main.ts
import { add, multiply } from './math/add';

console.log(add(1, 2));       // 3
console.log(multiply(3, 4));  // 12
```

파일 경로만 알면 바로 import할 수 있습니다. TypeScript 컴파일러가 파일 시스템을 직접 탐색합니다.

### Rust: 명시적 모듈 선언

Rust에서는 파일을 만드는 것만으로는 부족합니다. **`mod` 키워드로 해당 파일을 모듈로 등록해야** 컴파일러가 인식합니다.

```rust
// src/math.rs
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

pub fn multiply(a: i32, b: i32) -> i32 {
    a * b
}
```

```rust
// src/main.rs
mod math;           // "src/math.rs를 math 모듈로 포함시켜라"
use math::add;      // math 모듈에서 add를 현재 스코프로 가져온다

fn main() {
    println!("{}", add(1, 2));           // 3
    println!("{}", math::multiply(3, 4)); // 12 — use 없이 전체 경로로도 접근 가능
}
```

TypeScript의 `import`는 파일 경로를 직접 참조하지만, Rust의 `use`는 **모듈 경로**를 참조합니다. `mod math`가 선언되어야 비로소 `math`라는 모듈 경로가 존재하게 됩니다.

### pub 키워드 — 접근 제어

TypeScript에서 `export`가 없으면 해당 파일 외부에서 접근할 수 없듯이, Rust에서 `pub`가 없으면 모듈 외부에서 접근할 수 없습니다.

| TypeScript | Rust | 설명 |
|---|---|---|
| `export function foo()` | `pub fn foo()` | 외부에서 접근 가능 |
| `function foo()` (export 없음) | `fn foo()` (pub 없음) | 모듈 내부 전용 |
| `export class Foo` | `pub struct Foo` | 타입/구조체 공개 |
| `export default foo` | `pub use self::foo` | re-export |

```rust
// src/auth.rs
pub struct User {
    pub name: String,     // 외부에서 읽기/쓰기 가능
    pub email: String,    // 외부에서 읽기/쓰기 가능
    password_hash: String, // 외부에서 접근 불가 (pub 없음)
}

pub fn create_user(name: &str, email: &str, password: &str) -> User {
    User {
        name: name.to_string(),
        email: email.to_string(),
        password_hash: hash_password(password), // 내부 함수 호출 가능
    }
}

fn hash_password(password: &str) -> String {
    // 외부에 노출되지 않는 내부 구현
    format!("hashed_{}", password)
}
```

TypeScript보다 접근 제어가 더 세밀합니다. 구조체 자체(`pub struct`)는 공개하면서도 특정 필드(`password_hash`)는 비공개로 유지할 수 있습니다.

### 파일 구조 관례

Rust의 파일 구조는 모듈 경로와 직접 대응됩니다.

```
# Rust 파일 구조와 모듈 경로
src/
  main.rs          ← 진입점, 크레이트 루트
  lib.rs           ← 라이브러리 루트 (바이너리와 병행 가능)
  math.rs          ← mod math { ... } 와 동일
  math/
    mod.rs         ← 서브모듈이 있을 때 math 모듈의 루트
    add.rs         ← mod math { mod add { ... } } 와 동일
    multiply.rs    ← mod math { mod multiply { ... } } 와 동일
  auth/
    mod.rs
    user.rs        ← math::add처럼 auth::user로 접근
```

```
# TypeScript 파일 구조
src/
  index.ts
  math/
    index.ts       ← math/index.ts = Rust의 math/mod.rs
    add.ts
    multiply.ts
  auth/
    index.ts
    user.ts
```

Rust 2018 에디션부터는 `mod.rs` 대신 `math.rs`와 `math/` 디렉토리를 함께 사용하는 방식도 지원합니다. 현재 관례는 상황에 따라 둘 다 쓰입니다.

```rust
// src/main.rs에서 서브모듈을 포함하는 예시
mod math;          // src/math.rs 또는 src/math/mod.rs
mod auth;          // src/auth.rs 또는 src/auth/mod.rs

use math::add;
use auth::{User, create_user};

fn main() {
    let result = add(1, 2);
    let user = create_user("Alice", "alice@example.com", "secret");
    println!("{} + 1 + 2 = {}", user.name, result);
}
```

---

## 외부 크레이트 사용하기

### 1. crates.io에서 패키지 찾기

[crates.io](https://crates.io)는 Rust의 npmjs.com입니다. 패키지를 "크레이트(crate)"라고 부릅니다. [docs.rs](https://docs.rs)에서 모든 크레이트의 자동 생성 문서를 볼 수 있습니다.

### 2. 의존성 추가

```bash
# npm 방식
npm install zod
npm install -D @types/node

# Cargo 방식
cargo add serde                          # 최신 버전 추가
cargo add serde --features derive        # feature flag 포함
cargo add tokio --features full          # 비동기 런타임
cargo add --dev pretty_assertions        # dev dependency
```

`cargo add`는 자동으로 `Cargo.toml`을 수정합니다. npm처럼 `package.json`을 직접 편집할 수도 있습니다.

### 3. 코드에서 사용하기

```typescript
// TypeScript
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string(),
  age: z.number(),
});

type User = z.infer<typeof UserSchema>;
```

```rust
// Cargo.toml에 추가
// serde = { version = "1.0", features = ["derive"] }
// serde_json = "1.0"

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
struct User {
    name: String,
    age: u32,
}

fn main() {
    let json = r#"{"name": "Alice", "age": 30}"#;
    let user: User = serde_json::from_str(json).unwrap();
    println!("{:?}", user);

    let back_to_json = serde_json::to_string(&user).unwrap();
    println!("{}", back_to_json);
}
```

`use serde::Serialize`는 TypeScript의 `import { Serialize } from 'serde'`와 동일한 패턴입니다. 단, Rust에서는 `use`만으로는 부족하고 `Cargo.toml`에 의존성이 먼저 등록되어 있어야 합니다.

---

## Workspace (모노레포)

여러 크레이트를 하나의 저장소에서 관리하고 싶을 때 Cargo 워크스페이스를 사용합니다. npm workspaces와 개념이 동일합니다.

```json
// package.json (npm workspaces)
{
  "name": "my-monorepo",
  "workspaces": [
    "packages/core",
    "packages/ui",
    "packages/api"
  ]
}
```

```toml
# Cargo.toml (루트 — Cargo workspace)
[workspace]
members = [
    "crates/core",
    "crates/api",
    "crates/cli",
]
resolver = "2"
```

```
# 워크스페이스 디렉토리 구조
my-workspace/
  Cargo.toml          ← 워크스페이스 루트
  Cargo.lock          ← 전체 워크스페이스 공통 lock 파일
  crates/
    core/
      Cargo.toml
      src/
        lib.rs
    api/
      Cargo.toml      ← core에 대한 의존성 선언 가능
      src/
        main.rs
    cli/
      Cargo.toml
      src/
        main.rs
```

```toml
# crates/api/Cargo.toml
[package]
name = "api"
version = "0.1.0"
edition = "2021"

[dependencies]
core = { path = "../core" }   # 워크스페이스 내부 크레이트 참조
tokio = { version = "1", features = ["full"] }
```

워크스페이스의 모든 크레이트는 단일 `Cargo.lock`을 공유하므로 의존성 버전 충돌이 없습니다. npm workspaces에서 호이스팅 문제로 골치를 앓은 경험이 있다면, Cargo의 방식이 훨씬 명확하게 느껴질 것입니다.

---

## 요약

- **Cargo = npm + tsc + jest + prettier + typedoc** — Rust 생태계의 모든 빌드 도구를 하나로 통합합니다.
- **Cargo.toml = package.json** — 프로젝트 메타데이터와 의존성을 정의합니다.
- **crates.io = npmjs.com** — Rust의 공식 패키지 레지스트리입니다.
- **파일을 만들어도 자동으로 모듈이 되지 않습니다.** `mod 이름;`으로 명시적으로 등록해야 합니다.
- **`pub` 없이는 모듈 외부에서 접근 불가** — TypeScript의 `export`에 해당합니다.
- **`use`는 `import`와 비슷하지만**, 파일 경로가 아닌 모듈 경로를 사용합니다.
- **Cargo workspace = npm workspaces** — 모노레포 구조를 공식 지원합니다.

---

## 핵심 코드

모듈 시스템의 전체 흐름을 한눈에 볼 수 있는 예시입니다.

```rust runnable
mod greet {
    pub fn hello(name: &str) -> String {
        format!("Hello, {}!", name)
    }

    pub fn goodbye(name: &str) -> String {
        format!("Goodbye, {}!", name)
    }

    // pub 없음 — 모듈 외부에서 접근 불가
    fn internal_helper() -> &'static str {
        "이건 모듈 내부에서만 쓸 수 있어요"
    }
}

mod math {
    pub fn add(a: i32, b: i32) -> i32 {
        a + b
    }

    pub mod advanced {
        pub fn power(base: i32, exp: u32) -> i32 {
            base.pow(exp)
        }
    }
}

fn main() {
    // greet 모듈 사용
    let msg = greet::hello("TypeScript 개발자");
    println!("{}", msg);

    let bye = greet::goodbye("TypeScript 개발자");
    println!("{}", bye);

    // math 모듈 사용
    let sum = math::add(3, 4);
    println!("3 + 4 = {}", sum);

    // 중첩 모듈 사용
    let squared = math::advanced::power(2, 10);
    println!("2^10 = {}", squared);
}
```

---

## 자주 하는 실수

### 1. `mod` 선언 없이 `use`만 쓰려는 실수

```rust
// ❌ 잘못된 예 — math.rs 파일이 있어도 mod 선언이 없으면 컴파일 에러
use math::add;

fn main() {
    println!("{}", add(1, 2));
}
// error[E0432]: unresolved import `math`
```

```rust
// ✅ 올바른 예 — mod로 먼저 등록해야 use로 가져올 수 있음
mod math;
use math::add;

fn main() {
    println!("{}", add(1, 2));
}
```

### 2. `pub`을 빠뜨려서 private 에러 발생

```rust
// src/math.rs
fn add(a: i32, b: i32) -> i32 { // ❌ pub 없음
    a + b
}

// src/main.rs
mod math;
use math::add; // error[E0603]: function `add` is private
```

```rust
// src/math.rs
pub fn add(a: i32, b: i32) -> i32 { // ✅ pub 추가
    a + b
}
```

### 3. node_modules 방식으로 파일만 만들고 `mod` 선언 안 함

TypeScript 습관으로 `src/utils.ts` 같은 파일을 만들고 그냥 import하려는 패턴이 Rust에서는 통하지 않습니다.

```
# ❌ 파일만 만든다고 되지 않음
src/
  main.rs
  utils.rs    ← 이 파일은 mod utils; 없이는 컴파일러가 무시함
```

```rust
// ✅ main.rs에서 반드시 선언
mod utils;   // 이제 utils.rs가 컴파일에 포함됨

fn main() {
    utils::some_function();
}
```

### 4. 구조체는 공개했는데 필드를 비공개로 놔둔 실수

```rust
pub struct Config {
    host: String,  // ❌ pub 없음 — 외부에서 Config { host: "..." } 로 생성 불가
    port: u16,
}

// 외부 코드에서:
// let c = Config { host: "localhost".to_string(), port: 8080 };
// error[E0451]: field `host` of struct `Config` is private
```

```rust
pub struct Config {
    pub host: String,  // ✅
    pub port: u16,
}
```

또는 생성자 함수(`pub fn new(...)`)를 제공하고 필드는 비공개로 유지하는 것이 더 관용적인 Rust 패턴입니다.

---

## 다음 챕터 미리보기

다음 챕터에서는 TypeScript `union type`의 Rust 버전인 **Enum과 패턴 매칭**을 다룹니다.

```typescript
// TypeScript
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rectangle'; width: number; height: number };
```

```rust
// Rust — 이걸 훨씬 우아하게 표현할 수 있습니다
enum Shape {
    Circle { radius: f64 },
    Rectangle { width: f64, height: f64 },
}
```

Rust의 `enum`은 TypeScript의 discriminated union을 언어 레벨에서 완벽하게 지원합니다. `match` 표현식과 결합하면 컴파일러가 모든 케이스를 처리했는지 강제로 확인해주는, 매우 강력한 패턴이 됩니다.
