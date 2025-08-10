export async function evalOutputEquals(modelText: string, expected: unknown) {
  return { passed: String(modelText).trim() === String(expected), details: { modelText, expected } };
}
