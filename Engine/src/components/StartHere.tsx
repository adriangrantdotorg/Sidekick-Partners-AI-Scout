"use client";
// Start Here (Plan section 7): a one-time panel on Today for a first-time visitor (Dylan): what Scout is, today's three
// best picks, one click to the IC brief. Once dismissed it stays dismissed in this browser: the layout's pre-paint
// script hides it before it draws (scout.startHere). Switch: startHere.
import Link from "next/link";
import { Fragment, useState } from "react";
import { firm, on, possessive } from "@/firm";

export const START_KEY = "scout.startHere";

export function StartHere({ picks }: { picks: { id: number; name: string }[] }) {
  const [gone, setGone] = useState(false);
  if (!on("startHere") || gone) return null;
  const dismiss = () => {
    try {
      localStorage.setItem(START_KEY, "off");
    } catch {
      /* private window: it hides for this visit only */
    }
    document.documentElement.dataset.startHere = "off";
    setGone(true);
  };
  return (
    <section className="x-start" aria-label="Start Here" data-testid="start-here">
      <div>
        <h2 className="x-h2">Start Here</h2>
        <p>
          Scout reads public funding news, SEC filings and trade press every morning, and ranks startups by how well they fit {possessive(firm.short)} thesis.
          {picks.length > 0 && (
            <>
              {" "}
              Today&apos;s {picks.length === 1 ? "best pick" : `${["", "", "two", "three"][picks.length]} best picks`}:{" "}
              {picks.map((p, i) => (
                <Fragment key={p.id}>
                  {i > 0 && (i === picks.length - 1 ? " and " : ", ")}
                  <Link href={`/company/${p.id}`} title={`Open ${p.name} in Scout`}>
                    <b>{p.name}</b>
                  </Link>
                </Fragment>
              ))}
              .
            </>
          )}
        </p>
      </div>
      <div className="x-acts">
        <Link className="x-btn primary" href="/brief" title="Open this week's IC Meeting brief" data-testid="start-brief">
          Open the IC Brief
        </Link>
        <button type="button" className="x-btn ghost" onClick={dismiss} title="Hide this panel for good in this browser" data-testid="start-dismiss">
          Dismiss
        </button>
      </div>
    </section>
  );
}
