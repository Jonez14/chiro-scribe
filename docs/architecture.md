# Architecture

## The pipeline

```
 audio ──> Transcriber ──> transcript ──> ClinicalExtractor ──> proposals (untrusted)
                                                                     │
                                              domain: groundProposals │  quote must exist in transcript,
                                                                     │  value must pass field rules
                                                                     v
            clinician edits ──> domain: applyEdits ──> ClinicalDocument (drafting)
                                                                     │
                                                 submit_for_review   v
                                                              (in_review) ──> preview render
                                                                     │
                                          approve (clinician only)   v
                                                              (approved) ──> export filled form
                                                                     │
                                                        mark_filed   v
                                                               (filed) ──> chart (ChiroTouch)
```

Vendors appear only at the two ports on the top row. Everything below the top row is
deterministic code under test.

## Layers

| Layer             | Package                     | May depend on         |
| ----------------- | --------------------------- | --------------------- |
| Domain            | `domain`                    | nothing (zod only)    |
| Adapters          | `form-engine`, `extraction` | domain                |
| Use cases         | `application`               | domain, adapter ports |
| Delivery (future) | `apps/api`, `apps/web`      | application           |

## Core concepts

**Template.** A versioned mapping from clinical fields to physical locations ("bindings") in one
of the practice's form files. A document pins the template version it was drafted against.

**Binding.** For Word: a content control tag. For PDF: an AcroForm field name. Onboarding a form
means adding invisible tags to a copy of the original (the "bound" copy). The original is stored
untouched beside it. `auditBindings` proves a mapping and a file agree before a template goes
live.

**Field state.** `empty`, `filled` (with provenance), or `intentionally_blank`. A checkbox is
therefore tri-state in practice: positive, negative, or not assessed. "Not mentioned" is never
recorded as "negative".

**Provenance.** Every filled value records where it came from: dictation (with the supporting
quotes), a typed clinician edit (with the actor), or a voice edit (with the actor and the spoken
instruction). Carried-forward history will be a third source,
always labelled as historical and never presented as reassessed.

**Grounding.** See [ADR 0002](adr/0002-grounding-over-prompting.md).

**Voice edits.** A spoken correction is interpreted by a model into edit operations, then checked
by the domain before anything changes: fields must exist on the form, a number must have been
spoken in the instruction, and values must pass the field's rules. The batch is all-or-nothing
and returns a diff. An instruction that cannot be mapped is reported as not understood. Known
limit: a rewritten text field cannot be verified word for word, which is why the diff is shown.

**Lifecycle.** `drafting -> in_review -> approved -> filed`. Approval requires the clinician role
and every required field either filled or deliberately left blank. Approved documents are frozen.
Corrections after approval will be amendments, not edits.

## What is deliberately not built yet

Authentication, persistence, audit log, API and UI. Each of these touches PHI and gets designed
as its own slice rather than stubbed. See [roadmap.md](roadmap.md).
