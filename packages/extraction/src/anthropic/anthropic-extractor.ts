import { ExtractionError, type ClinicalExtractor } from "../ports.js";
import { buildUserMessage, SYSTEM_PROMPT } from "./prompt.js";
import { buildTool, parseToolInput, TOOL_NAME } from "./tool.js";

/**
 * The slice of the Anthropic Messages API this adapter needs. Declared structurally so the
 * adapter is tested without the network and works with the direct API or a cloud-hosted
 * equivalent, whichever is covered by the BAA.
 */
export interface MessagesClient {
  create(request: {
    model: string;
    max_tokens: number;
    temperature: number;
    system: string;
    messages: { role: "user"; content: string }[];
    tools: ReturnType<typeof buildTool>[];
    tool_choice: { type: "tool"; name: string };
  }): Promise<{ content: readonly { type: string; name?: string; input?: unknown }[] }>;
}

export interface AnthropicExtractorConfig {
  readonly client: MessagesClient;
  /** Required and explicit: the model is a clinical-safety decision, pinned per deployment. */
  readonly model: string;
  readonly maxTokens?: number;
}

export function createAnthropicExtractor(config: AnthropicExtractorConfig): ClinicalExtractor {
  return {
    async extract({ template, transcript }) {
      const response = await config.client.create({
        model: config.model,
        max_tokens: config.maxTokens ?? 4096,
        temperature: 0,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildUserMessage(template, transcript) }],
        tools: [buildTool(template)],
        tool_choice: { type: "tool", name: TOOL_NAME },
      });

      const call = response.content.find(
        (block) => block.type === "tool_use" && block.name === TOOL_NAME,
      );
      const proposals = call && parseToolInput(call.input);
      if (!proposals) {
        // Deliberately carries no response content: model output may echo PHI into logs.
        throw new ExtractionError("Extractor returned no usable tool call.");
      }
      return proposals;
    },
  };
}
