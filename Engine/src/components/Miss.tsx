import Link from "next/link";
import type { ReactNode } from "react";

/** A page Scout can't show, in the firm's look: a missing address (app/not-found.tsx) or a page that failed to draw
 *  (app/error.tsx). Both had Next.js's bare defaults, in its own font, with no way back (screen review, 11-03-26). */
export function Miss({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="x-sec x-miss" aria-label={title} data-testid="miss">
      <h1 className="x-h2">{title}</h1>
      <p>{children}</p>
      <div className="x-acts">
        {action}
        <Link className={`x-btn ${action ? "ghost" : "primary"}`} href="/" title="Go to Today">
          Go to Today
        </Link>
        <Link className="x-btn ghost" href="/pipeline" title="Open the Pipeline">
          Open the Pipeline
        </Link>
      </div>
    </section>
  );
}
