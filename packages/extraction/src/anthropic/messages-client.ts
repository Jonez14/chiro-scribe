import { ExtractionError } from "../ports.js";

/** A JSON Schema object. Every object in it must set additionalProperties to false. */
export type JsonSchema = Record<string, unknown>;

/**
 * The slice of the Anthropic Messages API these adapters need. Declared structurally so the
 * adapters are tested without the network and work with the direct API or a cloud-hosted
 * equivalent, whichever is covered by the BAA.
 */
export interface MessagesClient {
  create(request: {
    model: string;
    max_tokens: number;
    system: string;
    messages: { role: "user"; content: string }[];
    output_config: { format: { type: "json_schema"; schema: JsonSchema } };
  }): Promise<{ content: readonly { type: string; text?: string }[] }>;
}

export interface AnthropicConfig {
  readonly client: MessagesClient;
  /** Required and explicit: the model is a clinical-safety decision, pinned per deployment. */
  readonly model: string;
  readonly maxTokens?: number;
}

export interface JsonRequest {
  readonly system: string;
  readonly user: string;
  readonly schema: JsonSchema;
}

/**
 * One request for JSON in a fixed shape (structured outputs). Returns the parsed JSON for the
 * caller to validate.
 *
 * Current models reject sampling parameters and forced tool calls, so neither is sent. Output
 * can vary between runs. That is contained by grounding in the domain, not by configuration.
 */
export async function requestJson(config: AnthropicConfig, request: JsonRequest): Promise<unknown> {
  const response = await config.client.create({
    model: config.model,
    max_tokens: config.maxTokens ?? 8192,
    system: request.system,
    messages: [{ role: "user", content: request.user }],
    output_config: { format: { type: "json_schema", schema: request.schema } },
  });
  // The model may think first, so the answer is the text block, wherever it sits.
  const text = response.content.find((block) => block.type === "text")?.text;
  try {
    if (text !== undefined) return JSON.parse(text) as unknown;
  } catch {
    // Truncated or malformed output falls through to the same failure.
  }
  // Deliberately carries no response content: model output may echo PHI into logs.
  throw new ExtractionError("Model returned no usable JSON.");
}
