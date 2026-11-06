// The deck a visitor dropped, handed from where it was dropped (any page, or a company's Deck Screen area) to the Deck
// Screen page. It lives only in this browser tab's memory: nothing is sent anywhere until the Deck Screen reads it.

let pending: { file: File; company?: string } | null = null;

export const isPdf = (f: File | null | undefined): f is File => !!f && (f.type === "application/pdf" || /\.pdf$/i.test(f.name));

export function handOff(file: File, company?: string) {
  pending = { file, company };
}

export function takeHandOff(): { file: File; company?: string } | null {
  const p = pending;
  pending = null;
  return p;
}

/** Whether a drag may carry a PDF: files whose type is a PDF, or not known until the drop (Safari tells no types). */
export function dragHasFiles(e: { dataTransfer: DataTransfer | null }): boolean {
  if (!Array.from(e.dataTransfer?.types || []).includes("Files")) return false;
  const types = Array.from(e.dataTransfer?.items || []).map((i) => i.type);
  return types.includes("application/pdf") || !types.every(Boolean);
}
