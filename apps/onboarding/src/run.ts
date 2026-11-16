import { FormEngineError } from "@chiro-scribe/form-engine";
import { inspect } from "./commands/inspect.js";
import { scaffold } from "./commands/scaffold.js";
import { validate } from "./commands/validate.js";
import { UsageError, type Io } from "./io.js";

export const USAGE = `Usage:
  scribe-forms inspect  <form.docx|form.pdf>                 List fillable slots and unbound areas
  scribe-forms scaffold <form.docx|form.pdf>                 Print a draft mapping to finish by hand
  scribe-forms validate <form.docx|form.pdf> <template.json> Check a mapping against the form

Works on local files only. Use blank forms: never a form that contains patient information.`;

type Command = (io: Io, args: readonly string[]) => Promise<number>;

const commands: Record<string, { readonly arity: number; readonly run: Command }> = {
  inspect: { arity: 1, run: (io, [form = ""]) => inspect(io, form) },
  scaffold: { arity: 1, run: (io, [form = ""]) => scaffold(io, form) },
  validate: { arity: 2, run: (io, [form = "", template = ""]) => validate(io, form, template) },
};

function dispatch(io: Io, [name = "", ...args]: readonly string[]): Promise<number> {
  const command = Object.hasOwn(commands, name) ? commands[name] : undefined;
  if (command?.arity !== args.length) throw new UsageError(USAGE);
  return command.run(io, args);
}

/** Returns the process exit code. Expected failures are printed, never thrown. */
export async function run(io: Io, argv: readonly string[]): Promise<number> {
  try {
    return await dispatch(io, argv);
  } catch (error) {
    if (error instanceof UsageError || error instanceof FormEngineError) {
      io.print(error.message);
      return 2;
    }
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      io.print("File not found.");
      return 2;
    }
    throw error;
  }
}
