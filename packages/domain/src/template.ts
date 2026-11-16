import { z } from "zod";

export const ClinicalSection = z.enum([
  "administrative",
  "subjective",
  "objective",
  "assessment",
  "plan",
]);
export type ClinicalSection = z.infer<typeof ClinicalSection>;

export const DocumentType = z.enum([
  "daily_visit",
  "initial_exam",
  "reexam",
  "progress_report",
  "treatment_plan",
  "functional_assessment",
  "referral",
]);
export type DocumentType = z.infer<typeof DocumentType>;

/** Where a field physically lives inside the clinic's own form. */
export const FieldBinding = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("docx.content_control"), tag: z.string().min(1) }),
  z.object({ kind: z.literal("pdf.acro_field"), name: z.string().min(1) }),
]);
export type FieldBinding = z.infer<typeof FieldBinding>;

const fieldBase = {
  id: z.string().regex(/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*$/, "dot.separated_snake_case"),
  label: z.string().min(1),
  section: ClinicalSection,
  required: z.boolean().default(false),
  /** Clinic-authored hint for the extractor, e.g. preferred terminology. */
  guidance: z.string().optional(),
  binding: FieldBinding,
};

export const FieldDefinition = z.discriminatedUnion("type", [
  z.object({
    ...fieldBase,
    type: z.literal("text"),
    maxLength: z.number().int().positive().optional(),
  }),
  z.object({
    ...fieldBase,
    type: z.literal("number"),
    unit: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
  }),
  /** Tri-state in practice: checked, explicitly unchecked, or never addressed. */
  z.object({ ...fieldBase, type: z.literal("checkbox") }),
  z.object({ ...fieldBase, type: z.literal("choice"), options: z.array(z.string().min(1)).min(2) }),
]);
export type FieldDefinition = z.infer<typeof FieldDefinition>;

export const TemplateFormat = z.enum(["docx", "pdf"]);
export type TemplateFormat = z.infer<typeof TemplateFormat>;

const bindingPrefix = { docx: "docx.", pdf: "pdf." } as const satisfies Record<
  TemplateFormat,
  string
>;

function findDuplicate(values: readonly string[]): string | undefined {
  const seen = new Set<string>();
  return values.find((value) => (seen.has(value) ? true : (seen.add(value), false)));
}

export const TemplateDefinition = z
  .object({
    id: z.string().min(1),
    /** Bumped on every mapping change. Documents pin the version they were drafted against. */
    version: z.number().int().positive(),
    name: z.string().min(1),
    documentType: DocumentType,
    format: TemplateFormat,
    fields: z.array(FieldDefinition).min(1),
  })
  .superRefine((template, ctx) => {
    const duplicate = findDuplicate(template.fields.map((field) => field.id));
    if (duplicate !== undefined) {
      ctx.addIssue({
        code: "custom",
        message: `Duplicate field id: ${duplicate}`,
        path: ["fields"],
      });
    }
    for (const [index, field] of template.fields.entries()) {
      if (!field.binding.kind.startsWith(bindingPrefix[template.format])) {
        ctx.addIssue({
          code: "custom",
          message: `Binding ${field.binding.kind} does not match template format ${template.format}`,
          path: ["fields", index, "binding"],
        });
      }
    }
  });
export type TemplateDefinition = z.infer<typeof TemplateDefinition>;

export function findField(
  template: TemplateDefinition,
  fieldId: string,
): FieldDefinition | undefined {
  return template.fields.find((field) => field.id === fieldId);
}
