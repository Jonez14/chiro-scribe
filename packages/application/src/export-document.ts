import {
  err,
  ok,
  type ClinicalDocument,
  type DocumentStatus,
  type Result,
  type TemplateDefinition,
} from "@chiro-scribe/domain";
import { renderDocument } from "@chiro-scribe/form-engine";

export type ExportError =
  | { readonly kind: "template_mismatch" }
  | { readonly kind: "not_approved"; readonly status: DocumentStatus };

function pinned(template: TemplateDefinition, document: ClinicalDocument): boolean {
  return document.templateId === template.id && document.templateVersion === template.version;
}

/** A working copy for the review screen. Never a record. */
export async function renderPreview(
  template: TemplateDefinition,
  document: ClinicalDocument,
  templateFile: Uint8Array,
): Promise<Result<Uint8Array, ExportError>> {
  if (!pinned(template, document)) return err({ kind: "template_mismatch" });
  return ok(await renderDocument(template, document, templateFile));
}

/** The only path that produces a file destined for the chart. Unapproved documents cannot take it. */
export async function exportApprovedDocument(
  template: TemplateDefinition,
  document: ClinicalDocument,
  templateFile: Uint8Array,
): Promise<Result<Uint8Array, ExportError>> {
  if (!pinned(template, document)) return err({ kind: "template_mismatch" });
  if (document.status !== "approved" && document.status !== "filed") {
    return err({ kind: "not_approved", status: document.status });
  }
  return ok(await renderDocument(template, document, templateFile));
}
