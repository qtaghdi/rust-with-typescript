---
title: "Ch.10 — 학습 로드맵"
description: "TypeScript 개발자를 위한 6개월 Rust 로드맵"
---

Rust는 배우는 데 시간이 걸립니다. "일주일이면 배울 수 있어요"라고 말하면 거짓말입니다. 하지만 TypeScript처럼 타입에 익숙한 분이라면 다른 배경의 개발자보다 훨씬 빠르게 습득할 수 있습니다.

6개월을 투자하면 Rust로 실무에서 쓸 만한 코드를 짤 수 있는 수준에 도달할 수 있습니다.

---

## 월별 로드맵

### Month 1 — 기초 문법 & 멘탈 모델 전환

**목표**: Rust 코드를 읽을 수 있고, 기본적인 프로그램을 컴파일할 수 있다.

**핵심 주제**:
- 설치 (`rustup`, `cargo`)
- 변수, 타입, 함수 (이 책의 Ch.2)
- 조건문, 반복문, 패턴 매칭
- Option\<T\>와 Result\<T, E\> 기초
- struct와 impl

**추천 리소스**:
- [The Rust Book (공식)](https://doc.rust-lang.org/book/) — Chapter 1~6
- [Rustlings](https://github.com/rust-lang/rustlings) — 처음 20~30 문제
- 이 책의 Ch.0~Ch.2

**이 달의 프로젝트**: CLI 계산기
```bash
cargo new calculator
```
```
> calc 10 + 5
15
> calc 100 / 4
25
> calc 3 * 7
21
```
stdin에서 입력을 받아 사칙연산을 수행하는 CLI 툴입니다. 기본 타입, 문자열 파싱, match, Result 처리를 모두 연습할 수 있습니다.

**이 달의 체크포인트**:
- [ ] `cargo new`, `cargo run`, `cargo build` 사용 가능
- [ ] 기본 타입과 타입 추론 이해
- [ ] `match`로 Option/Result 처리 가능
- [ ] "Borrow Checker가 왜 이걸 막는지"를 어렴풋이 이해

---

### Month 2 — Ownership 완전 정복

**목표**: Borrow Checker와 싸우지 않고 협력할 수 있다.

**핵심 주제**:
- Ownership의 3규칙
- References와 Borrowing (`&`, `&mut`)
- Lifetime 기초
- String vs &str 차이
- Clone, Copy trait

**추천 리소스**:
- [The Rust Book](https://doc.rust-lang.org/book/) — Chapter 4~5
- 이 책의 Ch.3
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/) — Ownership 섹션
- [Jon Gjengset - Crust of Rust](https://www.youtube.com/c/JonGjengset) — Lifetimes 영상

**이 달의 프로젝트**: 주소록 CLI
```
> add Alice alice@example.com
Added: Alice
> list
1. Alice - alice@example.com
2. Bob - bob@example.com
> search Alice
Found: alice@example.com
```
Vec\<Contact\>를 여러 함수에 참조로 넘기면서 Ownership 개념을 실습합니다.

**이 달의 체크포인트**:
- [ ] Move semantics를 직관적으로 이해
- [ ] `&T`와 `&mut T`를 언제 쓸지 판단 가능
- [ ] `String`과 `&str`의 차이 설명 가능
- [ ] 컴파일러 에러 메시지를 읽고 스스로 수정 가능

---

### Month 3 — 타입 시스템 심화 & 에러 처리

**목표**: Rust의 타입 시스템을 TypeScript만큼 자유롭게 다룰 수 있다.

**핵심 주제**:
- Enum과 패턴 매칭 (TypeScript union type과 비교)
- Generic과 trait bound
- 에러 처리 패턴 (`thiserror`, `anyhow`)
- 이터레이터 (`map`, `filter`, `fold`, `collect`)
- Closure 심화

**추천 리소스**:
- [The Rust Book](https://doc.rust-lang.org/book/) — Chapter 6, 9, 10, 13
- [Rustlings](https://github.com/rust-lang/rustlings) — enums, error_handling, iterators
- [Exercism Rust Track](https://exercism.org/tracks/rust) — 꾸준히

**이 달의 프로젝트**: JSON 파일 처리 CLI

```bash
# user.json을 읽어서 필터링 후 출력
> user-filter --file users.json --age-min 18 --sort name
```

`serde_json`으로 파일을 파싱하고, 이터레이터로 필터링/정렬, 커스텀 에러 타입으로 에러 처리를 합니다.

**이 달의 체크포인트**:
- [ ] Enum + match로 상태 머신 구현 가능
- [ ] Generic 함수와 trait bound 작성 가능
- [ ] `?` 연산자로 에러를 자연스럽게 전파
- [ ] 이터레이터 체이닝으로 데이터 변환

---

### Month 4 — 비동기 프로그래밍 & HTTP

**목표**: async Rust로 실제 HTTP 서버를 만들 수 있다.

**핵심 주제**:
- async/await 기초
- Tokio 런타임
- Future와 Promise의 차이
- Axum 또는 Actix-web으로 REST API
- reqwest로 HTTP 클라이언트

**추천 리소스**:
- [Tokio 공식 튜토리얼](https://tokio.rs/tokio/tutorial)
- [Axum 공식 예제](https://github.com/tokio-rs/axum/tree/main/examples)
- 이 책의 Ch.4 (HTTP API 서버 섹션)
- [Zero To Production In Rust](https://www.zero2prod.com/) — 5~7장 (선택)

**이 달의 프로젝트**: Todo REST API

TypeScript/Express로 만들어봤던 것을 Axum으로 다시 만들기.

```
GET    /todos         - 전체 목록
POST   /todos         - 생성
GET    /todos/:id     - 단건 조회
PUT    /todos/:id     - 수정
DELETE /todos/:id     - 삭제
```

PostgreSQL 연동까지 도전한다면 `sqlx` 크레이트를 사용합니다.

**이 달의 체크포인트**:
- [ ] `async fn`과 `.await` 자연스럽게 사용
- [ ] Axum으로 CRUD API 구현
- [ ] 요청/응답 타입을 Serde로 처리
- [ ] 공유 상태 `Arc<Mutex<T>>` 또는 `Arc<RwLock<T>>` 이해

---

### Month 5 — 성능 최적화 & 고급 패턴

**목표**: Rust의 강점인 성능을 의식하면서 코드를 짤 수 있다.

**핵심 주제**:
- 스마트 포인터 (`Box<T>`, `Rc<T>`, `Arc<T>`)
- 트레이트 객체 (`dyn Trait`) vs 제네릭
- 동시성 (`Mutex`, `RwLock`, `channels`)
- 프로파일링 기초 (`cargo flamegraph`)
- Lifetime 심화

**추천 리소스**:
- [The Rust Book](https://doc.rust-lang.org/book/) — Chapter 15, 16
- [Rust for Rustaceans](https://nostarch.com/rust-rustaceans) (Jon Gjengset) — 중급서
- [Exercism](https://exercism.org/tracks/rust) — 고급 문제
- [This Week in Rust](https://this-week-in-rust.org/) — 뉴스레터 구독

**이 달의 프로젝트**: 멀티스레드 파일 처리기

대용량 CSV 파일을 여러 스레드로 병렬 처리하여 통계를 계산합니다.

```bash
> csv-stats --file big_data.csv --threads 4
Processed 1,000,000 rows in 0.8s
Average age: 35.2
Top city: Seoul (15,234 users)
```

Rayon 크레이트를 활용하면 TypeScript의 `Promise.all`처럼 병렬 처리를 쉽게 할 수 있습니다.

**이 달의 체크포인트**:
- [ ] `Box<T>`, `Arc<T>` 언제 쓰는지 판단 가능
- [ ] `Mutex`로 스레드 간 데이터 공유
- [ ] 채널(`mpsc`)로 스레드 간 통신
- [ ] 간단한 성능 프로파일링 수행

---

### Month 6 — 실전 프로젝트 & 생태계 탐색

**목표**: Rust로 혼자서 의미 있는 프로젝트를 완성할 수 있다.

**핵심 주제**:
- Cargo workspace와 모듈 시스템
- 테스트 (`#[test]`, `#[cfg(test)]`, integration tests)
- 벤치마크 (`criterion` 크레이트)
- CI/CD 설정 (GitHub Actions)
- WebAssembly (선택)

**추천 리소스**:
- [The Rust Book](https://doc.rust-lang.org/book/) — Chapter 11, 14
- [crates.io](https://crates.io) — 크레이트 탐색
- [Are We Web Yet?](https://www.arewewebyet.org/) — Rust 웹 생태계
- [Awesome Rust](https://github.com/rust-unofficial/awesome-rust) — 큐레이션 목록

**이 달의 최종 프로젝트**: 선택 항목 중 하나

**옵션 A: GitHub CLI 클론 (미니버전)**
```bash
> my-gh repos list
> my-gh issues list --repo owner/repo
> my-gh pr create --title "feat: add feature"
```
GitHub API를 호출하는 CLI 툴. reqwest, serde, clap 크레이트 활용.

**옵션 B: 마크다운 블로그 엔진**
```bash
> blog build --src posts/ --out dist/
> blog serve --port 8080
```
파일 시스템 탐색, 마크다운 파싱, 정적 사이트 생성.

**옵션 C: 실시간 채팅 서버**
WebSocket을 이용한 채팅 서버. Axum + tokio-tungstenite 활용.

**이 달의 체크포인트**:
- [ ] 프로젝트를 모듈로 잘 분리
- [ ] 단위 테스트와 통합 테스트 작성
- [ ] GitHub Actions로 CI 설정
- [ ] README와 함께 GitHub에 공개 배포

---

## 핵심 리소스 요약

### 필수 (이 순서로)
1. **이 책** — TypeScript와 비교하며 개념 잡기
2. **[The Rust Book](https://doc.rust-lang.org/book/)** — 공식 입문서, 무료, 한국어 번역본 있음
3. **[Rustlings](https://github.com/rust-lang/rustlings)** — 소규모 실습 문제 100개+
4. **[Rust by Example](https://doc.rust-lang.org/rust-by-example/)** — 코드 중심 레퍼런스

### 중급 도약
5. **[Exercism Rust Track](https://exercism.org/tracks/rust)** — 멘토링 포함 실습
6. **[Rust for Rustaceans](https://nostarch.com/rust-rustaceans)** — Jon Gjengset의 중급서
7. **[Zero To Production In Rust](https://www.zero2prod.com/)** — 실전 백엔드 개발

### 영상
8. **[Jon Gjengset YouTube](https://www.youtube.com/c/JonGjengset)** — Crust of Rust 시리즈
9. **[Let's Get Rusty](https://www.youtube.com/c/LetsGetRusty)** — The Rust Book 영상 강의

### 커뮤니티
10. **[users.rust-lang.org](https://users.rust-lang.org/)** — 공식 포럼
11. **[r/rust](https://www.reddit.com/r/rust/)** — Reddit 커뮤니티
12. **Rust Korea Discord** — 한국어 커뮤니티

---

## TypeScript 개발자를 위한 특별 팁

### "이건 TypeScript에서 어떻게 했더라?" 생각이 날 때

| TypeScript로 생각한 것 | Rust에서 찾아볼 것 |
|----------------------|-----------------|
| `interface` | `struct` + `trait` |
| `type X = A \| B` | `enum` |
| `Promise<T>` | `Future<Output = T>` |
| `Array<T>` | `Vec<T>` |
| `Map<K, V>` | `HashMap<K, V>` |
| `?.` (optional chain) | `?` 연산자 + `Option` |
| `??` (nullish coalescing) | `.unwrap_or()` |
| `try/catch` | `Result<T, E>` + `match` |
| `readonly` | 기본값 (immutable) |
| `as const` | `const` + literal type |

### Borrow Checker와 친해지는 법

처음에는 컴파일러 에러 메시지가 무서울 수 있습니다. 몇 가지 마음가짐이 도움이 됩니다:

1. **에러 메시지를 끝까지 읽으세요.** Rust 컴파일러는 에러 설명과 해결책까지 제시합니다.
2. **`clone()`을 무서워하지 마세요.** 처음엔 복사해서 넘기는 게 낫습니다. 최적화는 나중에.
3. **작게 시작하세요.** 작은 함수부터 짜고, 점점 합치는 방식이 효과적입니다.
4. **컴파일러와 대화한다고 생각하세요.** "이게 왜 안 되지?"가 아니라 "컴파일러가 뭘 걱정하는 거지?" 로 접근하면 훨씬 배움이 빠릅니다.

### 실망하지 마세요

Rust를 배우는 모든 사람이 같은 단계를 거칩니다:

1. **기대** → "안전하고 빠른 언어라니, 멋져 보여!"
2. **좌절** → "왜 이걸 컴파일러가 막는 거야? TS에서는 되는데!"
3. **이해** → "아, 그래서 이런 규칙이 있구나..."
4. **숙달** → "Borrow Checker 없이는 못 살겠어"

3단계까지 가는 데 보통 1~2개월 걸립니다. 포기하지 마세요.

---

TypeScript로 좋은 코드를 짤 줄 아는 분이라면, Rust도 분명히 잘 하실 수 있습니다. 6개월 뒤에 "컴파일되면 잘 돌아간다"는 확신을 갖고 배포하는 경험을 해보시길 바랍니다.

행운을 빕니다. `rustc` 컴파일러가 든든한 동료가 될 겁니다.
