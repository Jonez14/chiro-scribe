# HIPAA posture

This is an engineering plan, not legal advice. The practice is the covered entity. Whoever
operates this platform for the practice is its business associate and needs a BAA with the
practice before handling any PHI.

## Preconditions before any real patient data

| Requirement                                                                   | State                            |
| ----------------------------------------------------------------------------- | -------------------------------- |
| BAA between the practice and the platform operator                            | not started                      |
| BAA with the hosting provider                                                 | not started, provider not chosen |
| BAA with the speech-to-text vendor                                            | not started, vendor not chosen   |
| BAA with the LLM vendor, with no training on and no retention of our data     | not started                      |
| Security risk analysis documented                                             | not started                      |
| Authentication with MFA, role-based access, session timeout                   | not built                        |
| Append-only audit log of every PHI read, write, approval and export           | not built                        |
| Encryption in transit and at rest, managed keys                               | not built                        |
| Backup, retention and deletion policy matched to state record-retention rules | not defined                      |

Candidates and what each requires are in [vendors.md](vendors.md). Vendor selection is gated on BAA terms that are confirmed in writing, never assumed from
marketing pages.

## Controls already in the design

- **Minimum necessary.** The domain holds an opaque patient reference, not demographics. The
  extractor receives the dictation and the form's field list, and nothing else.
- **Integrity.** Values carry provenance. Approved documents are immutable. Only a clinician can
  approve (ADR 0004).
- **No fabricated content.** Grounding (ADR 0002).
- **No PHI in logs.** Errors carry codes and field ids, never dictation text or values.
- **No PHI in source control.** See SECURITY.md.

## Until the preconditions are met

Development and demos use synthetic dictations only.
