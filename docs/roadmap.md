# Roadmap

Ordered by what unblocks real use soonest with the least clinical risk. Each slice ships as one
reviewed, tested change.

| Slice                 | Outcome                                                                                                                                                             | Blocked on              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 1. Clinical core      | Template model, grounding, lifecycle, DOCX and PDF filling. **Done.**                                                                                               |                         |
| 2. Form onboarding    | Bind the practice's first real form. Onboarding tool that inspects a file, reports slots, and validates a mapping. Repeating rows if that form needs them.          | The actual form files   |
| 3. Voice edits        | A spoken correction becomes validated edit operations with a visible diff. **Done** (interpreter tested against a mocked client; not yet run against a live model). |                         |
| 4. Service foundation | API, Postgres persistence, authentication with MFA, roles, append-only audit log, encrypted file storage.                                                           | Hosting choice and BAA  |
| 5. Transcription      | Speech adapter tuned for chiropractic and orthopedic terms, with the practice's vocabulary.                                                                         | Speech vendor BAA       |
| 6. Review app         | Select patient, dictate, review with quotes beside values, correct, approve, export. Phone and desktop. This completes the version 1 definition.                    | Slices 2 to 5           |
| 7. Pilot              | Real visits with one clinician. Measure time to approved note and correction rate.                                                                                  | All BAAs, risk analysis |
| 8. Dashboard          | Incomplete notes, missing information, ready for review, upcoming reexams.                                                                                          | Pilot feedback          |
| 9. Chart history      | Carry-forward context, always labelled historical. Deeper ChiroTouch integration if granted.                                                                        | ChiroTouch              |
| 10. Operations        | Staff workflows, checklists, training. Separate bounded context from clinical.                                                                                      |                         |

## Explicitly out of scope

- Rebuilding ChiroTouch (scheduling, billing, claims).
- Suggesting diagnoses or codes the clinician did not dictate.
