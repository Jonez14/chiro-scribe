# ADR 0004: Human approval is structural

Status: accepted

## Decision

Actors have a role: `clinician`, `staff` or `system`. The AI pipeline is always `system`. The
lifecycle rules permit `approve` for `clinician` only, and edits for people only. The single
export path for chart-bound files refuses any document that is not approved. Previews are a
separate path.

## Consequences

No configuration, prompt or UI bug can cause an AI-drafted document to be finalized without a
clinician acting. Delegated sign-off (for example an associate doctor) is modelled by giving that
person the clinician role, never by loosening the rule.
