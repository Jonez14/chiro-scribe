# ADR 0002: "No invented findings" is enforced by grounding, not by prompting

Status: accepted

## Context

The requirement is absolute: the AI must never invent findings. A prompt instruction reduces the
rate of invention. It cannot make it zero, and nobody can audit a prompt.

## Decision

The extractor returns proposals, each with verbatim quotes from the dictation. The domain accepts
a proposal only if:

1. the field exists on the template and the value passes that field's type, range and option rules;
2. every quote is present in the transcript (ignoring case, whitespace and typographic quotes);
3. for numbers, the number itself appears in the quoted words.

Anything else is withheld from the document and surfaced to the reviewer as a rejected proposal.
The extractor also asks the model for JSON constrained to a schema whose field ids are limited to
the template. Current models reject both a pinned sampling temperature and forced tool calls, so
neither is used and output can vary between runs. Grounding, not determinism, is what keeps the
result safe.

## Consequences

- A hallucinated finding cannot reach a document unless the model also fabricates a quote that
  happens to exist in the transcript.
- Failure is safe: a spoken "fifty-five" that the transcriber renders as words will be withheld
  and flagged rather than guessed. Number-word normalisation is a later, tested improvement.
- Known limit: grounding proves the words were said. It does not prove the model read them
  correctly (for example polarity, or left versus right). That is why review shows the quote
  beside every value, and why approval is human-only (ADR 0004).
