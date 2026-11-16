import type { FieldBinding, FieldValue } from "@chiro-scribe/domain";

export type SlotKind = "text" | "checkbox" | "choice";

/** A fillable location discovered inside a template file. */
export interface TemplateSlot {
  readonly binding: FieldBinding;
  readonly kind: SlotKind;
}

export interface Assignment {
  readonly binding: FieldBinding;
  readonly value: FieldValue;
}

/**
 * One implementation per file format. Fillers never touch layout: they write values into
 * slots that already exist in the clinic's own file and return a new file.
 */
export interface FormFiller {
  inspect(file: Uint8Array): Promise<readonly TemplateSlot[]>;
  fill(file: Uint8Array, assignments: readonly Assignment[]): Promise<Uint8Array>;
}
