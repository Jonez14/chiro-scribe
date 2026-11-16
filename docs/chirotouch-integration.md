# ChiroTouch Cloud integration findings

Researched 2026-11-15 from public sources. Nothing here has been confirmed with ChiroTouch yet.

## Findings

- **No public API.** No developer portal, OAuth flow, webhooks or FHIR endpoint were found. An
  independent review (Supergood, verified October 2026) reports that integrations go through the
  partner marketplace team or per-customer HL7 work by professional services.
- **Partner integrations exist on Cloud.** Fullscript launched inside ChiroTouch Cloud in
  February 2026 and was described as the first live partner launch, embedded in the charting
  workflow. So an embedded-partner model exists, by agreement.
- **Bulk export is manual.** Migration guides describe exporting patient lists from Analytics and
  printing selected documents per patient. No programmatic export was found.
- **ChiroTouch has its own AI scribe (Rheo).** It writes ChiroTouch-native SOAP notes. Public
  material does not show it filling a practice's custom Word or PDF forms, which is this
  project's reason to exist. Worth a hands-on check before building features Rheo already covers.

## Open questions

For the practice:

1. In ChiroTouch Cloud, can a document be uploaded to a patient's file by hand today? How many
   clicks, and are there file type or size limits?
2. Which plan is the practice on (Core or Advanced), and is Rheo enabled?
3. Who is the account manager? The partner request goes through them.

For ChiroTouch:

1. Is there a supported way for a third party to attach a document to a patient chart?
2. Is there a supported way to read the day's schedule and patient identifiers?
3. What are the requirements to become an integration partner?

## Sources

- https://supergood.ai/api-report-card/chirotouch
- https://www.chirotouch.com/integrations/fullscript
- https://www.chiroeco.com/chirotouch-cloud-announces-fullscript-integration/amp/
- https://jane.app/guide/importing-from-chirotouch-cloud-version
