// user's Title Case for every label (headings, buttons, table headers, field names, status chips): each word
// capitalized but the small ones inside; a part after a " · " starts like a label of its own ("AI Drafting · On",
// "Shared · The Record"). Its own file, with no firm, so the browser tests check labels with the very
// function the site uses (tests/e2e/labels.spec.ts); src/lib/format.ts re-exports it.
const SMALL = new Set(["and", "for", "of", "the", "a", "an", "to", "in", "on", "at", "with", "or", "by"]);

export function titleCase(s: string): string {
  return s
    .split(" ")
    .map((w, i, all) => (i > 0 && all[i - 1] !== "·" && SMALL.has(w.toLowerCase()) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}
