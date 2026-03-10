---
title: "Ch.1 — 들어가며"
description: "TypeScript 개발자가 Rust를 배워야 하는 이유"
---

TypeScript를 잘 쓰고 있는데, 왜 Rust를 배워야 할까요?

솔직히 말할게요. 배우지 않아도 됩니다. Node.js와 TypeScript로 훌륭한 서비스를 만들 수 있고, 지금 이 순간에도 수많은 프로덕션 서버가 멀쩡히 돌아가고 있습니다. 하지만 이런 경험을 해본 적 있나요?

## TypeScript 개발자라면 한 번쯤 겪었을 일들

### "이게 왜 undefined야?"

```typescript
interface User {
  profile?: {
    address?: {
      city?: string;
    };
  };
}

const user: User = fetchUser(); // 런타임에 뭔가 잘못됨
console.log(user.profile?.address?.city ?? "Unknown"); // 타입은 맞는데...
```

TypeScript는 컴파일 타임에 타입을 체크하지만, **런타임에 실제로 무슨 일이 벌어지는지는 보장하지 않습니다.** `any`가 슬쩍 끼어들거나, 외부 API가 스펙과 다른 데이터를 보내면 그냥 뚫립니다.

### "메모리를 얼마나 먹는 거야?"

Node.js 서버가 몇 시간 돌다 보면 메모리가 슬금슬금 올라갑니다. Garbage Collector가 언제 청소할지 모르고, GC가 돌 때마다 서버가 잠깐 멈추는 GC pause가 생깁니다. P99 레이턴시가 튀는 이유가 여기에 있을 때가 많습니다.

### "이 부분만 빠르면 좋겠는데..."

이미지 처리, 암호화, 파싱 같은 CPU-intensive한 작업을 TypeScript로 짜면 한계가 보입니다. `worker_threads`로 돌리거나, 결국 C++ native addon을 붙이거나, Python으로 짠 서비스에 HTTP 요청을 보내는 어색한 구조가 됩니다.

---

## Rust가 해결하는 것들

Rust는 이 문제들을 **언어 설계 자체**에서 해결합니다.

### 1. 컴파일 타임에 거의 모든 걸 잡아냅니다

TypeScript의 타입 체크는 "이 값이 string이어야 해"를 컴파일 타임에 검사합니다. Rust는 거기서 한 발 더 나아가, **메모리 접근, null 참조, 데이터 레이스까지** 컴파일 타임에 검사합니다. 런타임에서야 터지는 버그가 빌드 단계에서 걸립니다.

```rust
// 이 코드는 컴파일 자체가 안 됩니다
let x: Option<String> = None;
println!("{}", x); // 컴파일 에러: Option을 직접 출력할 수 없음
                   // "혹시 None이면 어떻게 할 건데?" 라고 컴파일러가 물어봄
```

### 2. GC가 없습니다 — 그래도 메모리 누수가 없습니다

Rust는 Garbage Collector 없이 메모리를 관리합니다. 대신 **Ownership** 시스템이라는 독창적인 개념으로 컴파일러가 메모리 할당과 해제 코드를 자동으로 삽입합니다. GC pause가 없으니 레이턴시가 예측 가능하고, 메모리 사용량이 안정적입니다.

### 3. C/C++ 수준의 성능, 현대적인 문법

Rust는 "제로코스트 추상화"를 지향합니다. 고수준 코드를 써도 컴파일하면 최적화된 기계어가 나옵니다. Cloudflare Workers, AWS Lambda의 일부, Linux 커널, Android 코어 컴포넌트가 Rust로 작성되고 있는 이유입니다.

---

## TypeScript 개발자에게 Rust가 특히 잘 맞는 이유

TypeScript를 쓴다는 건, "타입이 주는 안전망"의 가치를 이미 알고 있다는 뜻입니다. 동료들이 `any` 쓰자고 할 때 저항하고, 런타임 에러보다 컴파일 에러를 선호하는 사람이라면, **Rust의 엄격함이 낯설지 않을 겁니다.** 오히려 "TypeScript가 하고 싶었던 것의 완성판"처럼 느껴질 수 있어요.

물론 러닝 커브가 있습니다. Ownership과 Borrow Checker는 처음엔 컴파일러와 싸우는 느낌을 줍니다. 하지만 그 싸움에서 이기고 나면, "이 코드는 안전하다"는 확신을 가지고 배포할 수 있게 됩니다.

---

## 이 책에서 다루는 것

이 책은 Rust 입문서가 아닙니다. **TypeScript 개발자를 위한 Rust 맥락 번역서**입니다.

- TypeScript 코드와 Rust 코드를 나란히 놓고 "이게 저거야"를 보여줍니다
- "왜 JS에서는 되는데 Rust는 안 되지?" 라는 질문에 직접 답합니다
- 실전 HTTP API, JSON 처리, 에러 핸들링 예제로 실용성을 챙깁니다

TS 개발자로 잘 먹고 살고 있는데 굳이 Rust를 배우고 싶다면, 이 책은 그 여정을 조금 덜 험하게 만들어 줄 겁니다.

자, 시작해봅시다.
