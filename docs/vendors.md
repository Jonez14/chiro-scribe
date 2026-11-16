# Hosting and vendor shortlist

Researched 2026-11-15 from public sources. Plans, prices and BAA terms change often. Every line
here must be re-confirmed with the vendor, in writing, before any real patient data is involved.
Nothing in this file is legal advice.

## The decision

Four things need a vendor under a BAA: where the system runs and stores data, speech-to-text,
the language model, and login. Each extra vendor is another BAA, another bill and another place
PHI travels, so fewer is better for a two-clinician practice.

## Recommendation

**Run everything on AWS under one BAA, and call Claude through whichever route the BAA covers.**

| Need                            | Recommended                                                                                                             | Why                                                                                              |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Hosting, database, file storage | AWS                                                                                                                     | One self-serve BAA covers the whole account. Usage-based cost with no platform minimum.          |
| Speech-to-text                  | Start with Amazon Transcribe (same BAA). Benchmark AssemblyAI and Deepgram on chiropractic dictation before committing. | Zero extra paperwork to start. Accuracy on orthopedic terms is the thing to measure, not assume. |
| Language model                  | Claude, through Amazon Bedrock or Anthropic's HIPAA-ready API                                                           | See the open question below.                                                                     |
| Login                           | Decide in the service-foundation slice                                                                                  | Not researched yet. Must support MFA and be BAA-covered.                                         |

## What the sources say

### AWS

- The AWS BAA is accepted electronically through AWS Artifact, for one account or a whole
  organization. PHI may only touch services on the HIPAA Eligible Services list.
- Amazon Bedrock and Amazon Transcribe (including HealthScribe) are on that list.
- A third-party review reports that the Bedrock entry excludes some models. The exact model we
  use must be checked against the AWS list itself.

### Anthropic (direct)

- Anthropic signs a BAA for its first-party API in two configurations: a "HIPAA-ready API"
  organization, or a regular API organization with zero data retention.
- A standard API organization with neither is not covered, and PHI must not be sent through it.
- HIPAA-ready API access is arranged through Anthropic's account team, not self-serve.
- Not every API feature is covered. The Batch and Files APIs are excluded. The Implementation
  Guide lists which Messages API features are eligible.

### Speech-to-text

| Vendor            | BAA                                                                     | Notes                                                                                                                                      |
| ----------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Amazon Transcribe | Covered by the AWS BAA                                                  | No extra agreement.                                                                                                                        |
| AssemblyAI        | Standard BAA at no additional cost, available on pay-as-you-go accounts | Has a medical mode. Its own published comparison ranks it ahead of Deepgram and Transcribe on medical terms: a vendor claim, to be tested. |
| Deepgram          | BAA available, arranged through sales and an enterprise agreement       | Medical model (Nova-3 Medical) with per-request boosting of up to 100 custom terms, useful for technique and exercise names.               |

### Alternatives considered for hosting

| Option            | BAA terms found                                                                                                                                                                       | Why not first choice                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Vercel + Supabase | Vercel: self-serve BAA as a paid add-on on Pro, no changes to the agreement below Enterprise. Supabase: Team plan or above plus a paid HIPAA add-on, price not published by Supabase. | Secondary sources put the combined platform cost above 1,000 USD per month before usage. Two BAAs instead of one. |
| Render            | Self-serve BAA on Scale or Enterprise plans, with a 20 percent surcharge on usage (secondary source)                                                                                  | Viable. Still a second vendor beside AWS for speech and the model.                                                |

## Open questions to close before choosing

1. **Which Claude models are covered where?** Confirm on the AWS HIPAA Eligible Services page
   which Bedrock models are in scope and whether structured outputs (what this project relies
   on) are available there. With Anthropic direct, structured outputs are listed as covered on a
   HIPAA-ready organization: confirm against the Implementation Guide.
2. **Does the practice or the operator hold the accounts?** The BAA chain is practice (covered
   entity) to platform operator (business associate) to each vendor (subcontractor). Decide who
   the operator is as a legal entity before signing anything.
3. **Speech accuracy.** Record 20 synthetic chiropractic dictations and run them through all
   three speech vendors. Pick on measured error rate for clinical terms and numbers.
4. **Login vendor.** Research alongside the service-foundation slice.

## Sources

- https://support.claude.com/en/articles/15455031
- https://privacy.claude.com/en/articles/8114513-business-associate-agreements-baa-for-commercial-customers
- https://aws.amazon.com/compliance/hipaa-eligible-services-reference
- https://aws.amazon.com/blogs/industries/hipaa-compliance-for-generative-ai-solutions-on-aws
- https://aptible.com/hipaa-compliant-ai-tools/aws-bedrock-baa
- https://www.assemblyai.com/reports/voice-agents-healthcare
- https://deepgram.com/solutions/medical
- https://deepgram.com/learn/voice-ai-healthcare-compliance-accuracy-checklist
- https://vercel.com/changelog/hipaa-baas-are-now-available-to-pro-teams
- https://supabase.com/docs/guides/platform/hipaa-projects.md
- https://www.rapidevelopers.com/md/compliance/is-supabase-hipaa-compliant
- https://baa-atlas.vercel.app/vendors/render
