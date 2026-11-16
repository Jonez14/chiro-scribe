# ADR 0001: Modular monorepo with ports and adapters

Status: accepted

## Context

The product's value and its risk both live in clinical rules (what may be written to a record,
who may approve). Speech and language vendors will change, and each must be under a BAA.

## Decision

A pnpm workspace in strict TypeScript. A pure `domain` package holds every clinical rule. Vendors
and file formats are adapters behind interfaces. Use cases compose them. Lint enforces the
dependency direction and file size limits.

## Consequences

- Clinical rules are testable in milliseconds with no network and no PHI.
- Swapping a vendor is an adapter change with no clinical re-validation of the rules.
- More packages than a single app would need on day one. Accepted: the boundaries are the point.
