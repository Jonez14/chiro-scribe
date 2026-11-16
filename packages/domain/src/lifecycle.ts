import { assessCompleteness } from "./completeness.js";
import type { ClinicalDocument, DocumentStatus } from "./document.js";
import { err, ok, type Result } from "./result.js";
import type { TemplateDefinition } from "./template.js";

/**
 * "system" is the AI pipeline and background jobs. It can draft. It can never approve.
 * That is a type-level and rule-level guarantee, not a UI convention.
 */
export type ActorRole = "clinician" | "staff" | "system";

export interface Actor {
  readonly id: string;
  readonly role: ActorRole;
}

export type LifecycleAction = "submit_for_review" | "return_to_draft" | "approve" | "mark_filed";

export type LifecycleError =
  | {
      readonly kind: "invalid_transition";
      readonly from: DocumentStatus;
      readonly action: LifecycleAction;
    }
  | { readonly kind: "forbidden"; readonly role: ActorRole; readonly action: LifecycleAction }
  | { readonly kind: "incomplete"; readonly missingFieldIds: readonly string[] };

interface Rule {
  readonly from: DocumentStatus;
  readonly to: DocumentStatus;
  readonly roles: readonly ActorRole[];
}

const rules: Record<LifecycleAction, Rule> = {
  submit_for_review: { from: "drafting", to: "in_review", roles: ["clinician", "staff", "system"] },
  return_to_draft: { from: "in_review", to: "drafting", roles: ["clinician", "staff"] },
  approve: { from: "in_review", to: "approved", roles: ["clinician"] },
  mark_filed: { from: "approved", to: "filed", roles: ["clinician", "staff", "system"] },
};

export function transition(
  template: TemplateDefinition,
  document: ClinicalDocument,
  action: LifecycleAction,
  actor: Actor,
): Result<ClinicalDocument, LifecycleError> {
  const rule = rules[action];
  if (document.status !== rule.from) {
    return err({ kind: "invalid_transition", from: document.status, action });
  }
  if (!rule.roles.includes(actor.role)) {
    return err({ kind: "forbidden", role: actor.role, action });
  }
  if (action === "approve") {
    const { missingRequired } = assessCompleteness(template, document);
    if (missingRequired.length > 0) {
      return err({ kind: "incomplete", missingFieldIds: missingRequired.map((m) => m.fieldId) });
    }
  }
  return ok({ ...document, status: rule.to });
}
