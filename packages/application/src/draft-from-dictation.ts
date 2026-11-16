import {
  applyGroundedFields,
  assessCompleteness,
  createDocument,
  err,
  groundProposals,
  ok,
  type ClinicalDocument,
  type Completeness,
  type NewDocumentInput,
  type RejectedProposal,
  type Result,
  type TemplateDefinition,
} from "@chiro-scribe/domain";
import type { ClinicalExtractor } from "@chiro-scribe/extraction";

export interface DraftRequest {
  readonly template: TemplateDefinition;
  readonly transcript: string;
  /** Start a new document, or continue one already in progress (a second dictation pass). */
  readonly target: NewDocumentInput | ClinicalDocument;
}

export interface DraftResult {
  readonly document: ClinicalDocument;
  /** What still needs the clinician: required fields nobody addressed. */
  readonly completeness: Completeness;
  /** Proposals the extractor made that the transcript does not support. Shown, never applied. */
  readonly rejected: readonly RejectedProposal[];
}

export type DraftError =
  | { readonly kind: "empty_transcript" }
  | { readonly kind: "template_mismatch" }
  | { readonly kind: "not_editable" };

function resolveTarget(
  template: TemplateDefinition,
  target: DraftRequest["target"],
): Result<ClinicalDocument, DraftError> {
  if (!("status" in target)) return ok(createDocument(template, target));
  if (target.templateId !== template.id || target.templateVersion !== template.version) {
    return err({ kind: "template_mismatch" });
  }
  if (target.status !== "drafting") return err({ kind: "not_editable" });
  return ok(target);
}

/** Dictation in, grounded draft out. The extractor proposes. The domain decides. */
export async function draftFromDictation(
  request: DraftRequest,
  extractor: ClinicalExtractor,
): Promise<Result<DraftResult, DraftError>> {
  const { template, transcript } = request;
  if (transcript.trim().length === 0) return err({ kind: "empty_transcript" });

  const target = resolveTarget(template, request.target);
  if (!target.ok) return target;

  const proposals = await extractor.extract({ template, transcript });
  const { accepted, rejected } = groundProposals(template, transcript, proposals);
  const document = applyGroundedFields(target.value, accepted);

  return ok({ document, rejected, completeness: assessCompleteness(template, document) });
}
