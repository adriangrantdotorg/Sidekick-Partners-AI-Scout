"use client";
// Copy as Markdown (Plan section 7): a button on a content section, shown on hover or keyboard focus, that copies the
// section as Markdown and says so at the top right. Switch: copyMarkdown.
import { on } from "@/firm";
import { copyText, sectionMarkdown } from "@/lib/markdown";
import { useUI } from "./ui";

export const COPY_TIP = "Copy this section as Markdown";
/** The toast draws its own green check, the design's ✅. */
export const COPIED = "Copied as Markdown";

/** `title` and `lead` start the Markdown when the section's own heading isn't inside it (the Deal Sheet's fit panel). */
export function CopyMd({ title, lead }: { title?: string; lead?: string }) {
  const ui = useUI();
  if (!on("copyMarkdown")) return null;
  return (
    <button
      type="button"
      className="x-mdcopy"
      aria-label={COPY_TIP}
      title={COPY_TIP}
      data-testid="mdcopy"
      onClick={async (e) => {
        const sec = e.currentTarget.closest("section");
        if (!sec) return;
        await copyText(sectionMarkdown(sec, title, lead));
        ui.toast(COPIED);
      }}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    </button>
  );
}
