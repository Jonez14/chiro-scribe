# ADR 0003: Fill the practice's own files through bindings

Status: accepted

## Context

The practice's forms must be populated as they are, with layout preserved. Regenerating a
lookalike document would drift from the original and lose the clinician's trust.

## Decision

- Word: values are written into content controls identified by tag. Only the control's content
  changes. Run formatting is reused. All other package parts are carried through untouched.
- PDF: values are written into AcroForm fields by name. Fields are left editable.
- Onboarding produces a bound copy of the form with tags added. The original is kept unmodified.
- A template mapping that does not match its file is an error at onboarding, never a silent skip
  while filling a chart.

## Consequences

- Each form needs a one-time onboarding pass. This is the main per-form cost.
- Forms that are flat scans or PDFs without form fields need fields added first.
- Not yet supported: repeating table rows (variable-length lists such as exercise prescriptions)
  and legacy Word form fields. Both are additive binding kinds.
