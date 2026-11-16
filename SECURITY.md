# Security and PHI policy

This repository is public. Treat everything committed here as published.

## Never commit

- Patient information of any kind: names, dates of birth, chart content, dictations, transcripts,
  audio, filled forms, screenshots of an EHR.
- The practice's real form files until the practice owner has confirmed they contain no patient
  data and agrees to them being public. Until then, real forms are onboarded outside the repo.
- Secrets: API keys, tokens, credentials, `.env` files.

Tests use synthetic data only. Fixtures are generated in code so there are no opaque binaries to
audit.

## If something sensitive is committed

Stop, do not push further commits on top of it, and tell the repository owner immediately.
Removing it requires a history rewrite and, if PHI was exposed, a breach assessment under the
HIPAA Breach Notification Rule. Deleting the file in a later commit is not sufficient.

## Reporting a vulnerability

Contact the repository owner privately. Do not open a public issue.
