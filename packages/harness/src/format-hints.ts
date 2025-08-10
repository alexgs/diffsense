export const FORMAT_HINTS: Record<"patch" | "diff", string> = {
  patch: [
    "Return ONLY a unified diff wrapped with:",
    "*** Begin Patch",
    "(diff content)",
    "*** End Patch"
  ].join("\n"),
  diff: "" // usually none; add if you want a house style
};
