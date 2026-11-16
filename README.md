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

The clinical core and voice corrections are built, with no UI and no network surface:

| Package                     | Responsibility                                                                                                                   |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `@chiro-scribe/domain`      | Template model, field validation, grounding, completeness, edit operations, review lifecycle. Pure TypeScript, no I/O.           |
| `@chiro-scribe/form-engine` | Fills and inspects `.docx` (content controls) and `.pdf` (AcroForm) templates.                                                   |
| `@chiro-scribe/extraction`  | Ports for transcription, extraction and edit interpretation. Anthropic Messages adapters for extraction and edit interpretation. |
| `@chiro-scribe/onboarding`  | `scribe-forms` command: inspect a form file, draft a mapping, validate a mapping.                                                |
| `@chiro-scribe/evals`       | Synthetic dictation suite scored against the live model.                                                                         |
| `@chiro-scribe/application` | Use cases: draft from dictation, edit by voice, preview, export approved document.                                               |

See [docs/roadmap.md](docs/roadmap.md) for what comes next and
[docs/architecture.md](docs/architecture.md) for how it fits together.

## Develop

Requires Node 22 and pnpm 10.

```sh
pnpm install
pnpm verify   # format check, lint, build, tests
```

## Onboard a form

```sh
pnpm build
pnpm forms inspect  path/to/form.docx                # what is fillable, what still needs binding
pnpm forms scaffold path/to/form.docx > draft.json   # a draft mapping to finish by hand
pnpm forms validate path/to/form.docx template.json  # must pass before a template goes live
```

Keep form files and mappings outside this repository. Use blank forms only.

## Measure extraction accuracy

Runs synthetic dictations through the live model and scores the drafts. Synthetic data only.

```sh
pnpm build
ANTHROPIC_API_KEY=... EVAL_MODEL=<model id> pnpm eval
```

Exit code 0 means no unsafe fills (no wrong or unsupported values reached a draft).

## Ground rules

- **No PHI in this repository, ever.** Fixtures are synthetic and built in code. Real forms,
  dictations and exports live outside the repo. See [SECURITY.md](SECURITY.md).
- No real dictation goes to any vendor (speech, LLM, hosting) without a signed BAA.
- Engineering standards are enforced by tooling. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Proprietary. All rights reserved. The repository is public for convenience during early
development and no license to use, copy or distribute is granted.
