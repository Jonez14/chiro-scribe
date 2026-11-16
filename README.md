# chiro-scribe

Voice-to-form clinical documentation for chiropractic and sports rehab practices.

A clinician finishes a visit, dictates for 30 to 60 seconds, and gets their own form (the real
Word or PDF document the practice already uses) filled in and waiting for review. The clinician
corrects by voice or keyboard, approves, and the finished document is filed to the patient chart.

`chiro-scribe` is a working name.

## What makes this different from a generic AI scribe

1. **It fills the practice's existing forms.** Layout, tables and checkboxes are preserved. The
   original file is never modified.
2. **It cannot invent findings.** Every value written from dictation must quote the clinician's
   own words, and that quote is verified against the transcript in code. Unsupported values are
   withheld and shown to the reviewer. This is enforced by the domain layer, not by a prompt.
3. **Only a clinician can approve.** The AI pipeline is a distinct actor that can draft but is
   structurally unable to approve or finalize a record.

## Status

Slice 1 (this commit) is the clinical core, with no UI and no network surface:

| Package                     | Responsibility                                                                                                         |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `@chiro-scribe/domain`      | Template model, field validation, grounding, completeness, edit operations, review lifecycle. Pure TypeScript, no I/O. |
| `@chiro-scribe/form-engine` | Fills and inspects `.docx` (content controls) and `.pdf` (AcroForm) templates.                                         |
| `@chiro-scribe/extraction`  | Ports for transcription, extraction and edit interpretation. Anthropic Messages adapter for extraction.                |
| `@chiro-scribe/application` | Use cases: draft from dictation, preview, export approved document.                                                    |

See [docs/roadmap.md](docs/roadmap.md) for what comes next and
[docs/architecture.md](docs/architecture.md) for how it fits together.

## Develop

Requires Node 22 and pnpm 10.

```sh
pnpm install
pnpm verify   # format check, lint, build, tests
```

## Ground rules

- **No PHI in this repository, ever.** Fixtures are synthetic and built in code. Real forms,
  dictations and exports live outside the repo. See [SECURITY.md](SECURITY.md).
- No real dictation goes to any vendor (speech, LLM, hosting) without a signed BAA.
- Engineering standards are enforced by tooling. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Proprietary. All rights reserved. The repository is public for convenience during early
development and no license to use, copy or distribute is granted.
