# Rust for TypeScript Developers

TypeScript(특히 React) 개발자를 위한 Rust 학습 가이드 문서 프로젝트입니다. 문서는 Astro + Starlight로 구성되어 있고, 예제는 프론트 개발자 관점을 반영합니다.

## Project Structure

주요 디렉터리/파일은 아래와 같습니다.

```
.
├── public/
├── src/
│   ├── assets/
│   ├── content/
│   │   └── docs/
│   └── content.config.ts
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

문서는 `src/content/docs/` 아래의 `.md`/`.mdx` 파일로 작성되며, 파일명이 라우트가 됩니다.

이미지는 `src/assets/`에 두고 Markdown에서 상대 경로로 임베드합니다.

정적 파일(파비콘 등)은 `public/`에 둡니다.

## Commands

모든 명령은 프로젝트 루트에서 실행합니다.

| Command               | Action                                      |
| :-------------------- | :------------------------------------------ |
| `bun install`         | 의존성 설치                                 |
| `bun dev`             | 로컬 개발 서버 실행 `localhost:4321`        |
| `bun build`           | 프로덕션 빌드 생성 `./dist/`                |
| `bun preview`         | 빌드 결과 로컬 미리보기                     |
| `bun astro ...`       | `astro add`, `astro check` 등 CLI 명령 실행 |
| `bun astro -- --help` | Astro CLI 도움말                             |

## Contributing

문서 내용은 `src/content/docs/`에서 수정합니다. 예제 코드는 프론트 개발자 관점을 우선으로 유지합니다.
