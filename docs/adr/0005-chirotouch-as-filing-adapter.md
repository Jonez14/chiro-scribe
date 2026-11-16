# ADR 0005: ChiroTouch is a filing adapter, not a dependency

Status: accepted, pending vendor contact

## Context

Researched November 2026. See [../chirotouch-integration.md](../chirotouch-integration.md).
ChiroTouch Cloud publishes no general-purpose API. Integrations are arranged through its partner
program.

## Decision

The platform owns the documentation pipeline end to end and produces a finished file. Getting
that file into the chart is a `ChartFiler` port with staged implementations:

1. Secure download with a deterministic filename, attached to the chart by a person.
2. A supported partner integration, if ChiroTouch grants one.

Automating the ChiroTouch web interface with stored credentials is ruled out unless ChiroTouch
approves it in writing: it is fragile, likely breaches their terms, and puts EHR credentials in
our custody.

## Consequences

Version 1 does not wait on a vendor. Patient selection in version 1 uses a minimal patient
reference kept in our system, not a live ChiroTouch lookup.
