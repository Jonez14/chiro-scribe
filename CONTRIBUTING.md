# Engineering standards

These are enforced by `pnpm verify` and CI. If a rule gets in the way, change the rule in a
reviewed commit. Do not suppress it inline.

## Structure

- **Dependencies point inward.** `domain` imports nothing but `zod`. Lint blocks it from importing
  Node built-ins or other workspace packages. Vendors sit behind ports in `extraction`.
- **Small files, small functions.** 200 lines per file, 60 per function, cyclomatic complexity 10,
  nesting depth 3. A file that wants to be bigger is two concepts.
- **One concept per file,** named for the concept. No `utils.ts`, `helpers.ts` or `types.ts`
  dumping grounds.

## Code

- TypeScript strict, plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
  No `any`. No non-null assertions outside tests.
- Expected outcomes are values (`Result`), not exceptions. Exceptions are for defects and
  infrastructure failure.
- External input is parsed with a schema at the boundary and trusted afterwards.
- Model output is untrusted input. It is shape-checked in the adapter and judged in the domain.
- Errors and logs never contain dictation text, model output or field values.

## Tests

- Behaviour is specified by tests that read as clinical rules ("never lets staff approve").
- No network in tests. Vendors are replaced at the port.
- Synthetic data only.

## Changes

- One slice per pull request, green on CI, with docs updated in the same change.
- A decision that constrains future work gets an ADR in `docs/adr`.
