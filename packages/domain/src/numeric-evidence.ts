/** True when the number is literally present in the words, as digits. */
export function wordsContainNumber(words: string, value: number): boolean {
  const tokens = words.match(/-?\d+(?:\.\d+)?/g) ?? [];
  return tokens.some((token) => Number(token) === value);
}
