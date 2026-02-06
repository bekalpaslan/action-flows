# TypeScript Quality Checklist (P1 - High)

## Purpose

Enforce strict TypeScript practices across the codebase. Validates use of branded types, discriminated unions, no implicit typing, and leverage of shared type definitions to prevent bugs and enable refactoring.

---

## Checklist

| # | Check | Pass Criteria | Severity |
|---|-------|---------------|----------|
| 1 | No `any` Types | No explicit or implicit `any` in code (strict mode enabled). All variables, parameters, return types explicit. `// @ts-expect-error` documented if unavoidable. | **HIGH** |
| 2 | Branded Types for IDs | SessionId, ChainId, StepId, UserId used consistently. Type-safe ID handling prevents mixing IDs. All ID parameters branded. Constructors or type guards validate creation. | **HIGH** |
| 3 | Discriminated Unions for State | Event types, command types, state variants use discriminated unions. Type narrowing works correctly. No shared fields cause ambiguity. | **HIGH** |
| 4 | Strict Null Checks | `strictNullChecks` enabled. Variables explicitly typed as nullable (`T | null`) if optional. No implicit undefined. Null safety validated on assignment. | **HIGH** |
| 5 | No Unsafe Type Assertions | `as` keyword minimized. Only used where type system insufficient with clear justification comment. No `as any` to bypass checks. Alternatives (type guards, generics) preferred. | **HIGH** |
| 6 | Shared Types Imported | Types re-used from `@afw/shared/src/index.ts` (e.g., `SessionId`, `ChainId`, `Step`, `Command`). No duplicate type definitions in packages. | **HIGH** |
| 7 | Public API Return Types Explicit | All exported functions/methods have explicit return type declarations. Type inference not relied on for public APIs. Arrow functions with explicit return type. | **HIGH** |
| 8 | Generic Constraints Applied | Generics use `extends` constraints where applicable (e.g., `<T extends Record<string, unknown>>`). Prevents misuse. Type parameters meaningfully constrained. | **HIGH** |
| 9 | Branded ID Constructor Safety | Branded ID types (SessionId, ChainId, StepId, UserId) use factory functions that validate input, not raw type assertions. Branded types prevent accidental ID mixing. | **HIGH** |
| 10 | No Unused Variables | Unused imports, variables, parameters removed. Underscore prefix for intentionally unused parameters (`_unused`). | **MEDIUM** |
| 11 | Type Inference Leverage | Where safe, type inference allows cleaner code (e.g., function call return types). No redundancy without value. Balance readability with strictness. | **MEDIUM** |

---

## Notes

TypeScript strict mode is non-negotiable. Every file must pass `tsc --noEmit` with no errors or suppressions.
