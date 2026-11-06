"use client";

import { useEffect } from "react";
import { Miss } from "@/components/Miss";

/** A page that failed to draw: the header and footer stay, and Try Again draws it once more (Next.js 16's retry). */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => console.error(error), [error]);
  const ref = error instanceof Error && "digest" in error ? String((error as Error & { digest?: string }).digest || "") : "";
  return (
    <Miss
      title="Something Went Wrong"
      action={
        <button type="button" className="x-btn primary" onClick={() => retry()} title="Draw this page again">
          Try Again
        </button>
      }
    >
      Scout couldn&apos;t draw this page. Try again in a moment, or go back to Today.{ref ? ` Reference: ${ref}.` : ""}
    </Miss>
  );
}
