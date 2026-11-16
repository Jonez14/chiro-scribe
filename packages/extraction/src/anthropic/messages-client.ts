import { ExtractionError } from "../ports.js";

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: { type: "object"; required: string[]; properties: Record<string, unknown> };
}

/**
 * The slice of the Anthropic Messages API these adapters need. Declared structurally so the
 * adapters are tested without the network and work with the direct API or a cloud-hosted
 * equivalent, whichever is covered by the BAA.
 */
export interface MessagesClient {
  create(request: {
    model: string;
    max_tokens: number;
    temperature: number;
    system: string;
    messages: { role: "user"; content: string }[];
    tools: ToolDefinition[];
    tool_choice: { type: "tool"; name: string };
  }): Promise<{ content: readonly { type: string; name?: string; input?: unknown }[] }>;
}

export interface AnthropicConfig {
  readonly client: MessagesClient;
  /** Required and explicit: the model is a clinical-safety decision, pinned per deployment. */
  readonly model: string;
  readonly maxTokens?: number;
}

export interface ToolCall {
  readonly system: string;
  readonly user: string;
  readonly tool: ToolDefinition;
}

/** One forced, deterministic tool call. Returns the raw tool input for the caller to parse. */
export async function callTool(config: AnthropicConfig, call: ToolCall): Promise<unknown> {
  const response = await config.client.create({
    model: config.model,
    max_tokens: config.maxTokens ?? 4096,
    temperature: 0,
    system: call.system,
    messages: [{ role: "user", content: call.user }],
    tools: [call.tool],
    tool_choice: { type: "tool", name: call.tool.name },
  });
  const block = response.content.find(
    (candidate) => candidate.type === "tool_use" && candidate.name === call.tool.name,
  );
  if (!block) {
    // Deliberately carries no response content: model output may echo PHI into logs.
    throw new ExtractionError("Model returned no tool call.");
  }
  return block.input;
}
