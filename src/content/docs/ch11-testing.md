---
title: "Ch.11 — Testing"
description: "From Jest/Vitest to Rust's built-in tests — a complete guide to #[test] and cargo test"
---

TypeScript developers write tests using external libraries like Jest or Vitest. Rust has a testing framework built directly into the language. No separate installation needed — you can start right away.

## Jest vs Rust Testing Comparison

| Item | Jest/Vitest | Rust |
|---|---|---|
| Installation | `npm install jest` | Built-in (no separate install) |
| Run tests | `npm test` | `cargo test` |
| Assertions | `expect(a).toBe(b)` | `assert_eq!(a, b)` |
| Test file location | Separate `*.test.ts` files | `#[cfg(test)]` in the same file |
| Integration tests | Separate configuration | `tests/` directory |
| Doc tests | None | Code in `///` comments runs automatically |

## Writing Basic Tests

In TypeScript, test files are kept separate from source files.

**TypeScript (Jest):**

```typescript
// add.test.ts
import { add } from './add';

test('adds two numbers', () => {
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

The key difference: in Rust, tests live inside a `#[cfg(test)]` module in the same file. This module is only compiled when you run `cargo test`. It is not included in production builds.

`use super::*` imports everything from the parent module — the same role as `import { add } from './add'` in Jest.

## Assertion Macros

Instead of Jest's `expect()` chains, Rust uses macros.

| Jest | Rust | Description |
|---|---|---|
| `expect(a).toBe(b)` | `assert_eq!(a, b)` | must be equal |
| `expect(a).not.toBe(b)` | `assert_ne!(a, b)` | must not be equal |
| `expect(condition).toBeTruthy()` | `assert!(condition)` | must be true |
| `expect(a).toBeGreaterThan(b)` | `assert!(a > b)` | must be greater |
| `expect(fn).toThrow()` | `#[should_panic]` | must panic |

Examples of each assertion:

```rust
#[cfg(test)]
mod tests {
    // assert_eq!: both values must be equal
    #[test]
    fn test_assert_eq() {
        let result = 2 + 2;
        assert_eq!(result, 4);
        // on failure: assertion `left == right` failed
        //               left: 5
        //              right: 4
    }

    // assert_ne!: both values must differ
    #[test]
    fn test_assert_ne() {
        let result = 2 + 2;
        assert_ne!(result, 5);
    }

    // assert!: condition must be true
    #[test]
    fn test_assert() {
        let age = 20;
        assert!(age >= 18, "age is under 18: {}", age);
        // a failure message can be provided as the second argument
    }

    // assert!(a > b): comparison operation
    #[test]
    fn test_comparison() {
        let score = 95;
        assert!(score > 90, "score must exceed 90");
    }
}
```

`assert_eq!` and `assert_ne!` print both values on failure, making them far more informative than a plain `assert!(a == b)`.

## Running cargo test

```bash
# run all tests
cargo test

# filter by name (only tests whose name contains "add")
cargo test test_add

# show println! output (hidden by default when tests pass)
cargo test -- --nocapture

# run sequentially (default is parallel)
cargo test -- --test-threads=1

# run only a specific test module
cargo test tests::

# re-run only failed tests
cargo test -- --failed
```

Compared to Jest:

```bash
# Jest
npm test
npm test -- --testNamePattern="add"

# Vitest
npx vitest
npx vitest --reporter=verbose
```

Sample `cargo test` output:

```
running 3 tests
test tests::test_add ... ok
test tests::test_subtract ... ok
test tests::test_multiply ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

## Testing Error Cases

### Panic Testing with #[should_panic]

Just as you use `expect(fn).toThrow()` in Jest, Rust uses the `#[should_panic]` attribute.

```rust
fn divide(a: i32, b: i32) -> i32 {
    if b == 0 {
        panic!("cannot divide by zero");
    }
    a / b
}

#[cfg(test)]
mod tests {
    use super::*;

    // test passes only if a panic occurs
    #[test]
    #[should_panic]
    fn test_divide_by_zero_simple() {
        divide(10, 0);
    }

    // test passes only if the panic message contains the expected string
    #[test]
    #[should_panic(expected = "cannot divide by zero")]
    fn test_divide_by_zero() {
        divide(10, 0);
    }
}
```

When you specify the `expected` parameter, the test only passes if the panic message contains that string. This is equivalent to Jest's `expect(fn).toThrow("error message")`.

### Tests That Return Result

You can also write tests that return `Result` instead of panicking. This lets you use the `?` operator for concise error handling.

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

A test that returns `Result` fails when it returns `Err`. The `?` operator lets you propagate errors cleanly, which is useful when testing multi-step operations.

## Integration Tests

Integration tests exercise the library's public API from the outside.

**TypeScript project structure:**

```
src/
  add.ts
tests/
  add.test.ts   ← integration tests in a separate file
```

**Rust project structure:**

```
src/
  lib.rs        ← library code
tests/
  integration_test.rs   ← integration tests (auto-detected)
```

Files placed in the `tests/` directory are automatically treated as integration tests by Cargo. No extra configuration is needed.

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
// accessed like an external crate
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

Important: integration tests can only access `pub` functions in the public API. Internal functions are not accessible. This means you are testing from the perspective of an actual user.

## Doc Tests

This is a unique Rust feature. Code examples inside doc comments (`///`) are automatically run as tests. There is no equivalent in Jest.

```rust
/// Adds two numbers.
///
/// # Examples
///
/// ```
/// let result = my_crate::add(2, 3);
/// assert_eq!(result, 5);
/// ```
///
/// # Panics
///
/// This function does not panic.
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

/// Performs division safely.
///
/// # Examples
///
/// ```
/// // normal operation
/// assert_eq!(my_crate::safe_divide(10, 2), Some(5));
///
/// // returns None when dividing by zero
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

Running `cargo test` also executes these code examples automatically:

```
running 2 tests
test src/lib.rs - add (line 5) ... ok
test src/lib.rs - safe_divide (line 19) ... ok
```

Documentation and tests stay in sync. If the code changes and a doc example breaks, the test fails — stale documentation examples are caught naturally.

## Practical Example: Calculator Tests

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
            panic!("cannot divide by zero");
        }
        let result = a / b;
        self.history.push(format!("{} / {} = {}", a, b, result));
        result
    }

    fn safe_divide(&mut self, a: f64, b: f64) -> Result<f64, String> {
        if b == 0.0 {
            return Err("cannot divide by zero".to_string());
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

    // unit tests for each operation
    #[test]
    fn test_add() {
        let mut calc = Calculator::new();
        assert_eq!(calc.add(2.0, 3.0), 5.0);
        assert_eq!(calc.add(-1.0, 1.0), 0.0);
        assert_eq!(calc.add(0.1, 0.2), 0.30000000000000004); // floating-point behavior
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

    // edge case: panic test
    #[test]
    #[should_panic(expected = "cannot divide by zero")]
    fn test_divide_by_zero_panics() {
        let mut calc = Calculator::new();
        calc.divide(10.0, 0.0);
    }

    // Result-based test
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
        assert_eq!(result.unwrap_err(), "cannot divide by zero");
    }

    // test that history is recorded
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

    // scenario test combining multiple operations
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

## Summary

- Rust's test framework is built into the language. No external libraries like Jest or Mocha are needed.
- Unit tests are written alongside source code inside a `#[cfg(test)]` block.
- Use the `assert_eq!`, `assert_ne!`, and `assert!` macros for assertions.
- Use `#[should_panic]` to test that panics occur, or return `Result` to use the `?` operator.
- Files in the `tests/` directory are automatically treated as integration tests. Only the public API is accessible.
- Code examples in `///` doc comments are run automatically by `cargo test`, keeping docs and tests in sync.
- Use `cargo test -- --nocapture` to see `println!` output.

## Common Mistakes

**Forgetting `#[cfg(test)]`**

```rust
// wrong: test code written without #[cfg(test)]
mod tests {
    #[test]
    fn test_add() { /* ... */ }
}
```

Without `#[cfg(test)]`, test code is included in production builds. This unnecessarily increases binary size and includes test-only dependencies. Always add `#[cfg(test)]`.

**Being confused when `println!` output is invisible**

```bash
# println! output is hidden when tests pass
cargo test

# to see the output
cargo test -- --nocapture
```

Rust captures and hides standard output when tests pass. During debugging, `println!` may appear to do nothing. Add the `-- --nocapture` flag to see it.

**Trying to access private functions from integration tests**

```rust
// src/lib.rs
fn internal_helper() -> i32 { 42 } // no pub, private function
pub fn public_api() -> i32 { internal_helper() }
```

```rust
// tests/integration_test.rs
use my_crate::internal_helper; // compile error!
// integration tests behave like external users.
// only pub functions are accessible.

use my_crate::public_api; // works fine
```

Integration tests (in the `tests/` directory) are the same as using the library from the outside. To test internal implementation functions, write unit tests inside a `#[cfg(test)]` block in the same file.

## What's Next

The next chapter covers a 6-month learning roadmap and recommended resources. It guides you on how to deepen your knowledge of the core Rust concepts covered so far — in what order and with what materials.
