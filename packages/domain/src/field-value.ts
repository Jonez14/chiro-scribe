import { err, ok, type Result } from "./result.js";
import type { FieldDefinition } from "./template.js";

export type FieldValue = string | number | boolean;

export type ValueRejection =
  "type_mismatch" | "empty_text" | "text_too_long" | "out_of_range" | "invalid_option";

type Check = (field: FieldDefinition, value: unknown) => Result<FieldValue, ValueRejection>;

const checkText: Check = (field, value) => {
  if (field.type !== "text" || typeof value !== "string") return err("type_mismatch");
  const text = value.trim();
  if (text.length === 0) return err("empty_text");
  if (field.maxLength !== undefined && text.length > field.maxLength) return err("text_too_long");
  return ok(text);
};

const checkNumber: Check = (field, value) => {
  if (field.type !== "number" || typeof value !== "number" || !Number.isFinite(value)) {
    return err("type_mismatch");
  }
  if (field.min !== undefined && value < field.min) return err("out_of_range");
  if (field.max !== undefined && value > field.max) return err("out_of_range");
  return ok(value);
};

const checkCheckbox: Check = (_field, value) =>
  typeof value === "boolean" ? ok(value) : err("type_mismatch");

const checkChoice: Check = (field, value) => {
  if (field.type !== "choice" || typeof value !== "string") return err("type_mismatch");
  return field.options.includes(value) ? ok(value) : err("invalid_option");
};

const checks = {
  text: checkText,
  number: checkNumber,
  checkbox: checkCheckbox,
  choice: checkChoice,
} as const satisfies Record<FieldDefinition["type"], Check>;

/** The single gate every value passes, whether it came from dictation or a clinician edit. */
export function validateFieldValue(
  field: FieldDefinition,
  value: unknown,
): Result<FieldValue, ValueRejection> {
  return checks[field.type](field, value);
}
