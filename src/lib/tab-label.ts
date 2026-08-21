/**
 * Split long tab titles so inactive tabs can show a short stem + ellipsis.
 * Active tabs reveal `rest` with a width animation.
 */
export function splitTabLabel(
  label: string,
  wordLimit = 2
): { stem: string; rest: string; truncated: boolean } {
  const normalized = label.replace(/\s+/g, " ").trim();
  const tokens = normalized.split(" ").filter(Boolean);
  if (tokens.length <= wordLimit) {
    return { stem: normalized, rest: "", truncated: false };
  }
  let cut = wordLimit;
  // Don't leave a dangling "&" on the collapsed stem
  if (tokens[cut - 1] === "&" || tokens[cut - 1] === "&amp;") {
    cut -= 1;
  }
  if (cut < 1) cut = wordLimit;
  return {
    stem: tokens.slice(0, cut).join(" "),
    rest: tokens.slice(cut).join(" "),
    truncated: true,
  };
}
