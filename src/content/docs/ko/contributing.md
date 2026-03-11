---
title: 기여하기
description: Rust with TypeScript에 기여하는 방법 — 오류 수정, 챕터 추가, 번역
---

오탈자 수정부터 새 챕터 작성까지, 모든 종류의 기여를 환영합니다.

## 기여 방법

| 유형 | 설명 |
|:-----|:-----|
| **오류 수정** | 잘못된 설명, 동작하지 않는 코드, 오래된 내용 |
| **내용 개선** | 더 명확한 표현, 더 나은 예제 |
| **챕터 추가** | 새로운 주제 제안 및 작성 |
| **번역** | 한국어 ↔ 영어, 또는 새 언어 추가 |
| **버그 신고** | UI 오류, 코드 실행 문제, 링크 오류 |

## 시작하기

```bash
git clone https://github.com/qtaghdi/rust-with-typescript.git
cd rust-with-typescript
bun install
bun run dev   # → http://localhost:4321
```

## 콘텐츠 구조

챕터 파일 위치:

```
src/content/docs/
├── ch0-intro.md          ← 영어
├── ch1-mental-model.md
├── ...
└── ko/
    ├── ch0-intro.md      ← 한국어
    ├── ch1-mental-model.md
    └── ...
```

**한국어와 영어를 함께 업데이트해 주세요.** 영어 챕터를 수정했다면 한국어 버전도 함께 수정하거나, PR에 어느 언어가 아직 업데이트가 필요한지 명시해 주세요.

## 챕터 수정

1. `src/content/docs/ko/` (한국어) 또는 `src/content/docs/` (영어)에서 파일 열기
2. 마크다운 편집
3. `bun run dev`로 미리보기 확인
4. PR 오픈

## 새 챕터 추가

1. `src/content/docs/ch{N}-topic.md`와 `src/content/docs/ko/ch{N}-topic.md` 생성
2. `astro.config.mjs`의 `sidebar`에 `label`과 `translations.ko` 함께 등록
3. 기존 챕터 구조 따르기:
   - 프론트매터: `title`, `description`
   - TypeScript ↔ Rust 나란히 비교
   - 마지막에 요약 섹션
   - 주요 용어에 용어 사전 링크

## 실행 가능한 코드 블록

`runnable` 플래그를 추가하면 브라우저에서 Rust 코드를 직접 실행할 수 있습니다:

````markdown
```rust runnable
fn main() {
    println!("안녕하세요!");
}
```
````

실행 가능한 블록을 추가한 후에는 해시 파일을 재생성해야 합니다:

```bash
node scripts/generate-hashes.mjs
```

`bun run build`에서는 자동으로 실행됩니다. 로컬 개발 시에는 한 번 수동으로 실행해 주세요.

## 커밋 스타일

[Conventional Commits](https://www.conventionalcommits.org/) 규칙을 따릅니다:

```
fix: ch3 borrow checker 예제 오류 수정
feat: 에러 처리 패턴 챕터 추가
docs: lifetime 문법 설명 개선
```

## 이슈 등록

GitHub 이슈 템플릿을 활용해 주세요:
- **Content Error** — 잘못된 설명, 동작하지 않는 코드
- **New Chapter Proposal** — 주제 제안
- **Bug Report** — 사이트/UI 문제

[이슈 등록하기 →](https://github.com/qtaghdi/rust-with-typescript/issues/new/choose)
