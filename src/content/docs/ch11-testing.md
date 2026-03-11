---
title: "Ch.11 — 테스트"
description: "Jest/Vitest에서 Rust 내장 테스트로 — #[test]와 cargo test 완전 가이드"
---

TypeScript 개발자는 Jest나 Vitest 같은 외부 라이브러리로 테스트를 씁니다. Rust는 테스트 프레임워크가 언어에 내장되어 있습니다. 별도 설치 없이 바로 시작할 수 있습니다.

## Jest vs Rust 테스트 비교

| 항목 | Jest/Vitest | Rust |
|---|---|---|
| 설치 | `npm install jest` | 내장 (별도 설치 불필요) |
| 테스트 실행 | `npm test` | `cargo test` |
| 어설션 | `expect(a).toBe(b)` | `assert_eq!(a, b)` |
| 테스트 파일 위치 | `*.test.ts` 별도 파일 | 같은 파일 내 `#[cfg(test)]` |
| 통합 테스트 | 별도 설정 | `tests/` 디렉토리 |
| 문서 테스트 | 없음 | `///` 주석 내 코드 자동 실행 |

## 기본 테스트 작성

TypeScript에서는 테스트 파일을 소스 파일과 분리해서 작성합니다.

**TypeScript (Jest):**

```typescript
// add.test.ts
import { add } from './add';

test('두 수를 더한다', () => {
  expect(add(1, 2)).toBe(3);
});
```

**Rust:**

```rust
fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add() {
        assert_eq!(add(1, 2), 3);
    }
}
```

핵심 차이점: Rust에서는 테스트가 같은 파일 안에 `#[cfg(test)]` 모듈로 존재합니다. 이 모듈은 `cargo test`를 실행할 때만 컴파일됩니다. 프로덕션 빌드에는 포함되지 않습니다.

`use super::*`는 상위 모듈의 모든 항목을 가져옵니다. Jest에서 `import { add } from './add'`를 쓰는 것과 같은 역할입니다.

## 어설션 매크로

Jest의 `expect()` 체인 대신 Rust는 매크로를 사용합니다.

| Jest | Rust | 설명 |
|---|---|---|
| `expect(a).toBe(b)` | `assert_eq!(a, b)` | 같아야 함 |
| `expect(a).not.toBe(b)` | `assert_ne!(a, b)` | 달라야 함 |
| `expect(condition).toBeTruthy()` | `assert!(condition)` | 참이어야 함 |
| `expect(a).toBeGreaterThan(b)` | `assert!(a > b)` | 커야 함 |
| `expect(fn).toThrow()` | `#[should_panic]` | 패닉이어야 함 |

각 어설션 예제:

```rust
#[cfg(test)]
mod tests {
    // assert_eq!: 두 값이 같아야 함
    #[test]
    fn test_assert_eq() {
        let result = 2 + 2;
        assert_eq!(result, 4);
        // 실패 시: assertion `left == right` failed
        //            left: 5
        //           right: 4
    }

    // assert_ne!: 두 값이 달라야 함
    #[test]
    fn test_assert_ne() {
        let result = 2 + 2;
        assert_ne!(result, 5);
    }

    // assert!: 조건이 참이어야 함
    #[test]
    fn test_assert() {
        let age = 20;
        assert!(age >= 18, "나이가 18 미만입니다: {}", age);
        // 두 번째 인자로 실패 메시지를 지정할 수 있습니다
    }

    // assert!(a > b): 비교 연산
    #[test]
    fn test_comparison() {
        let score = 95;
        assert!(score > 90, "점수가 90점을 초과해야 합니다");
    }
}
```

`assert_eq!`와 `assert_ne!`는 실패 시 양쪽 값을 모두 출력해주므로, `assert!(a == b)`보다 훨씬 유용한 에러 메시지를 제공합니다.

## cargo test 실행

```bash
# 모든 테스트 실행
cargo test

# 이름으로 필터링 (이름에 "add"가 포함된 테스트만 실행)
cargo test test_add

# println! 출력 보기 (기본적으로 테스트 통과 시 출력이 숨겨짐)
cargo test -- --nocapture

# 순차 실행 (기본은 병렬 실행)
cargo test -- --test-threads=1

# 특정 테스트 모듈만 실행
cargo test tests::

# 실패한 테스트만 다시 실행
cargo test -- --failed
```

Jest와 비교하면:

```bash
# Jest
npm test
npm test -- --testNamePattern="add"

# Vitest
npx vitest
npx vitest --reporter=verbose
```

`cargo test`의 출력 예시:

```
running 3 tests
test tests::test_add ... ok
test tests::test_subtract ... ok
test tests::test_multiply ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

## 에러 케이스 테스트

### #[should_panic]으로 패닉 테스트

Jest에서 `expect(fn).toThrow()`를 사용하듯, Rust에서는 `#[should_panic]` 어트리뷰트를 사용합니다.

```rust
fn divide(a: i32, b: i32) -> i32 {
    if b == 0 {
        panic!("0으로 나눌 수 없음");
    }
    a / b
}

#[cfg(test)]
mod tests {
    use super::*;

    // 패닉이 발생해야 테스트 통과
    #[test]
    #[should_panic]
    fn test_divide_by_zero_simple() {
        divide(10, 0);
    }

    // 특정 메시지를 포함한 패닉이어야 테스트 통과
    #[test]
    #[should_panic(expected = "0으로 나눌 수 없음")]
    fn test_divide_by_zero() {
        divide(10, 0);
    }
}
```

`expected` 파라미터를 지정하면 패닉 메시지에 해당 문자열이 포함되어야만 테스트가 통과합니다. Jest의 `expect(fn).toThrow("에러 메시지")`와 같은 역할입니다.

### Result를 반환하는 테스트

패닉 대신 `Result`를 반환하는 테스트를 작성할 수도 있습니다. `?` 연산자를 사용할 수 있어 에러 처리가 간결해집니다.

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn test_parse() -> Result<(), String> {
        let n: i32 = "42".parse().map_err(|e| format!("{}", e))?;
        assert_eq!(n, 42);
        Ok(())
    }

    #[test]
    fn test_parse_invalid() -> Result<(), String> {
        let result: Result<i32, _> = "abc".parse();
        assert!(result.is_err());
        Ok(())
    }
}
```

`Result`를 반환하는 테스트는 `Err`를 반환하면 실패로 처리됩니다. `?` 연산자로 에러를 전파할 수 있어, 여러 단계의 연산을 테스트할 때 유용합니다.

## 통합 테스트 (Integration Tests)

통합 테스트는 라이브러리의 공개 API를 외부에서 테스트합니다.

**TypeScript 프로젝트 구조:**

```
src/
  add.ts
tests/
  add.test.ts   ← 별도 파일에 통합 테스트
```

**Rust 프로젝트 구조:**

```
src/
  lib.rs        ← 라이브러리 코드
tests/
  integration_test.rs   ← 통합 테스트 (자동 인식)
```

`tests/` 디렉토리에 파일을 만들면 Cargo가 자동으로 통합 테스트로 인식합니다. 별도 설정이 필요 없습니다.

```rust
// src/lib.rs
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

pub fn multiply(a: i32, b: i32) -> i32 {
    a * b
}
```

```rust
// tests/integration_test.rs
// 외부 크레이트처럼 접근합니다
use my_crate::add;
use my_crate::multiply;

#[test]
fn test_add_integration() {
    assert_eq!(add(10, 20), 30);
}

#[test]
fn test_multiply_integration() {
    assert_eq!(multiply(3, 4), 12);
}

#[test]
fn test_combined_operations() {
    let sum = add(2, 3);
    let product = multiply(sum, 2);
    assert_eq!(product, 10);
}
```

중요: 통합 테스트에서는 `pub`으로 선언된 공개 API만 접근할 수 있습니다. 내부 함수는 접근할 수 없습니다. 이는 실제 사용자 관점에서 테스트한다는 의미입니다.

## 문서 테스트 (Doc Tests)

Rust에만 있는 독특한 기능입니다. 문서 주석(`///`) 안의 코드 예제가 자동으로 테스트됩니다. Jest에는 이에 해당하는 기능이 없습니다.

```rust
/// 두 수를 더합니다.
///
/// # 예제
///
/// ```
/// let result = my_crate::add(2, 3);
/// assert_eq!(result, 5);
/// ```
///
/// # 패닉
///
/// 이 함수는 패닉을 발생시키지 않습니다.
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

/// 안전하게 나눗셈을 수행합니다.
///
/// # 예제
///
/// ```
/// // 정상 동작
/// assert_eq!(my_crate::safe_divide(10, 2), Some(5));
///
/// // 0으로 나누면 None 반환
/// assert_eq!(my_crate::safe_divide(10, 0), None);
/// ```
pub fn safe_divide(a: i32, b: i32) -> Option<i32> {
    if b == 0 {
        None
    } else {
        Some(a / b)
    }
}
```

`cargo test`를 실행하면 이 코드 예제들도 자동으로 실행됩니다:

```
running 2 tests
test src/lib.rs - add (line 5) ... ok
test src/lib.rs - safe_divide (line 19) ... ok
```

문서와 테스트가 항상 동기화됩니다. 코드가 바뀌면 문서 예제도 테스트에서 실패하므로, 오래된 문서 예제를 방치하는 문제가 자연스럽게 해결됩니다.

## 실전 예제: 계산기 테스트

```rust
#[derive(Debug)]
struct Calculator {
    history: Vec<String>,
}

impl Calculator {
    fn new() -> Self {
        Calculator {
            history: Vec::new(),
        }
    }

    fn add(&mut self, a: f64, b: f64) -> f64 {
        let result = a + b;
        self.history.push(format!("{} + {} = {}", a, b, result));
        result
    }

    fn subtract(&mut self, a: f64, b: f64) -> f64 {
        let result = a - b;
        self.history.push(format!("{} - {} = {}", a, b, result));
        result
    }

    fn multiply(&mut self, a: f64, b: f64) -> f64 {
        let result = a * b;
        self.history.push(format!("{} * {} = {}", a, b, result));
        result
    }

    fn divide(&mut self, a: f64, b: f64) -> f64 {
        if b == 0.0 {
            panic!("0으로 나눌 수 없습니다");
        }
        let result = a / b;
        self.history.push(format!("{} / {} = {}", a, b, result));
        result
    }

    fn safe_divide(&mut self, a: f64, b: f64) -> Result<f64, String> {
        if b == 0.0 {
            return Err("0으로 나눌 수 없습니다".to_string());
        }
        let result = a / b;
        self.history.push(format!("{} / {} = {}", a, b, result));
        Ok(result)
    }

    fn history_count(&self) -> usize {
        self.history.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // 각 연산 단위 테스트
    #[test]
    fn test_add() {
        let mut calc = Calculator::new();
        assert_eq!(calc.add(2.0, 3.0), 5.0);
        assert_eq!(calc.add(-1.0, 1.0), 0.0);
        assert_eq!(calc.add(0.1, 0.2), 0.30000000000000004); // 부동소수점 특성
    }

    #[test]
    fn test_subtract() {
        let mut calc = Calculator::new();
        assert_eq!(calc.subtract(10.0, 3.0), 7.0);
        assert_eq!(calc.subtract(0.0, 5.0), -5.0);
    }

    #[test]
    fn test_multiply() {
        let mut calc = Calculator::new();
        assert_eq!(calc.multiply(4.0, 5.0), 20.0);
        assert_eq!(calc.multiply(-2.0, 3.0), -6.0);
        assert_eq!(calc.multiply(0.0, 100.0), 0.0);
    }

    #[test]
    fn test_divide() {
        let mut calc = Calculator::new();
        assert_eq!(calc.divide(10.0, 2.0), 5.0);
        assert_eq!(calc.divide(7.0, 2.0), 3.5);
    }

    // 에지 케이스: 패닉 테스트
    #[test]
    #[should_panic(expected = "0으로 나눌 수 없습니다")]
    fn test_divide_by_zero_panics() {
        let mut calc = Calculator::new();
        calc.divide(10.0, 0.0);
    }

    // Result 기반 테스트
    #[test]
    fn test_safe_divide_ok() -> Result<(), String> {
        let mut calc = Calculator::new();
        let result = calc.safe_divide(10.0, 2.0)?;
        assert_eq!(result, 5.0);
        Ok(())
    }

    #[test]
    fn test_safe_divide_by_zero_returns_err() {
        let mut calc = Calculator::new();
        let result = calc.safe_divide(10.0, 0.0);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "0으로 나눌 수 없습니다");
    }

    // 히스토리 기록 테스트
    #[test]
    fn test_history_tracking() {
        let mut calc = Calculator::new();
        assert_eq!(calc.history_count(), 0);

        calc.add(1.0, 2.0);
        calc.multiply(3.0, 4.0);
        assert_eq!(calc.history_count(), 2);

        calc.subtract(10.0, 5.0);
        assert_eq!(calc.history_count(), 3);
    }

    // 여러 연산을 조합한 시나리오 테스트
    #[test]
    fn test_complex_calculation() {
        let mut calc = Calculator::new();
        let sum = calc.add(10.0, 5.0);       // 15
        let product = calc.multiply(sum, 2.0); // 30
        let result = calc.subtract(product, 6.0); // 24
        let final_result = calc.divide(result, 4.0); // 6

        assert_eq!(final_result, 6.0);
        assert_eq!(calc.history_count(), 4);
    }
}
```

## 요약

- Rust 테스트는 언어에 내장되어 있습니다. Jest, Mocha 같은 외부 라이브러리가 필요 없습니다.
- 단위 테스트는 `#[cfg(test)]` 블록 안에 소스 파일과 함께 작성합니다.
- `assert_eq!`, `assert_ne!`, `assert!` 매크로로 어설션을 작성합니다.
- `#[should_panic]`으로 패닉 발생을 테스트하고, `Result`를 반환해서 `?` 연산자를 활용할 수 있습니다.
- `tests/` 디렉토리의 파일은 자동으로 통합 테스트로 인식됩니다. 공개 API만 접근 가능합니다.
- `///` 문서 주석 안의 코드 예제는 `cargo test`로 자동 실행됩니다. 문서와 테스트가 항상 동기화됩니다.
- `cargo test -- --nocapture`로 `println!` 출력을 확인할 수 있습니다.

## 자주 하는 실수

**`#[cfg(test)]` 빠뜨리기**

```rust
// 잘못된 코드: #[cfg(test)] 없이 테스트 코드 작성
mod tests {
    #[test]
    fn test_add() { /* ... */ }
}
```

`#[cfg(test)]`가 없으면 테스트 코드가 프로덕션 빌드에도 포함됩니다. 바이너리 크기가 불필요하게 커지고, 테스트용 의존성도 함께 포함됩니다. 항상 `#[cfg(test)]`를 붙이세요.

**`println!` 출력이 안 보여서 당황하기**

```bash
# 이렇게 실행하면 테스트 통과 시 println! 출력이 숨겨짐
cargo test

# 출력을 보려면
cargo test -- --nocapture
```

Rust는 테스트 통과 시 표준 출력을 캡처해서 숨깁니다. 디버깅할 때 `println!`이 작동하지 않는 것처럼 보일 수 있습니다. `-- --nocapture` 플래그를 추가하면 됩니다.

**통합 테스트에서 비공개 함수 접근 시도**

```rust
// src/lib.rs
fn internal_helper() -> i32 { 42 } // pub 없음, 비공개 함수
pub fn public_api() -> i32 { internal_helper() }
```

```rust
// tests/integration_test.rs
use my_crate::internal_helper; // 컴파일 에러!
// 통합 테스트는 외부 사용자처럼 동작합니다.
// pub으로 선언된 함수만 접근할 수 있습니다.

use my_crate::public_api; // 정상 동작
```

통합 테스트(`tests/` 디렉토리)는 라이브러리를 외부에서 사용하는 것과 동일합니다. 내부 구현 함수를 테스트하려면 같은 파일의 `#[cfg(test)]` 블록 안에서 단위 테스트로 작성해야 합니다.

## 다음 챕터 미리보기

다음 챕터에서는 6개월 학습 로드맵과 추천 리소스를 다룹니다. 지금까지 배운 Rust의 핵심 개념들을 어떤 순서로, 어떤 자료로 심화 학습할지 안내합니다.
