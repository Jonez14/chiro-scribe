import { ExtractionError, type EditInterpreter } from "../ports.js";
import { buildEditMessage, EDIT_SYSTEM_PROMPT } from "./edit-prompt.js";
import { buildEditTool, parseEditToolInput } from "./edit-tool.js";
import { callTool, type AnthropicConfig } from "./messages-client.js";

export function createAnthropicEditInterpreter(config: AnthropicConfig): EditInterpreter {
  return {
    async interpret({ template, document, instruction }) {
      const input = await callTool(config, {
        system: EDIT_SYSTEM_PROMPT,
        user: buildEditMessage(template, document, instruction),
        tool: buildEditTool(template),
      });
      const operations = parseEditToolInput(input);
      if (!operations)
        throw new ExtractionError("Edit interpreter returned a malformed tool call.");
      return operations;
    },
  };
}
