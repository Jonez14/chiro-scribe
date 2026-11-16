import { ExtractionError, type EditInterpreter } from "../ports.js";
import { buildEditMessage, EDIT_SYSTEM_PROMPT } from "./edit-prompt.js";
import { buildEditSchema, parseEditOutput } from "./edit-schema.js";
import { requestJson, type AnthropicConfig } from "./messages-client.js";

export function createAnthropicEditInterpreter(config: AnthropicConfig): EditInterpreter {
  return {
    async interpret({ template, document, instruction }) {
      const output = await requestJson(config, {
        system: EDIT_SYSTEM_PROMPT,
        user: buildEditMessage(template, document, instruction),
        schema: buildEditSchema(template),
      });
      const operations = parseEditOutput(output);
      if (!operations)
        throw new ExtractionError("Edit interpreter returned JSON in the wrong shape.");
      return operations;
    },
  };
}
