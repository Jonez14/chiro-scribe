import type { EditOperation, ProposedField, TemplateDefinition } from "@chiro-scribe/domain";

/**
 * Ports for everything that leaves our trust boundary. Each adapter talks to a vendor that
 * must be under a signed BAA before it sees a real dictation. Outputs are untrusted:
 * proposals are grounded by the domain, edits are validated by the domain.
 */

export interface ExtractionRequest {
  readonly template: TemplateDefinition;
  readonly transcript: string;
}

export interface ClinicalExtractor {
  extract(request: ExtractionRequest): Promise<readonly ProposedField[]>;
}

export interface AudioClip {
  readonly bytes: Uint8Array;
  readonly mimeType: string;
}

export interface Transcriber {
  transcribe(audio: AudioClip): Promise<{ readonly text: string }>;
}

export interface EditRequest {
  readonly template: TemplateDefinition;
  /** A spoken or typed correction, e.g. "Change right cervical rotation to 55 degrees." */
  readonly instruction: string;
}

export interface EditInterpreter {
  interpret(request: EditRequest): Promise<readonly EditOperation[]>;
}

export class ExtractionError extends Error {
  override readonly name = "ExtractionError";
}
