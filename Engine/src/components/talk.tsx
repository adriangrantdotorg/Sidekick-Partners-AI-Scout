// The "Talk to <builder>" link (About, the Phase II dialog, Settings): nothing at all when the firm's folder names no
// builder (src/firm/builder.ts). No hooks and no "use client", so server pages and client components share it.
import type { CSSProperties } from "react";
import { BUILDER, builderFirst, builderTip } from "@/firm";

export function TalkLink({ className = "btn red", label, style }: { className?: string; label?: string; style?: CSSProperties }) {
  if (!BUILDER.name || !BUILDER.url) return null;
  return (
    <a className={className} href={BUILDER.url} target="_blank" rel="noopener noreferrer" title={builderTip()} style={style} data-talk>
      {label || `Talk to ${builderFirst()}`}
    </a>
  );
}
