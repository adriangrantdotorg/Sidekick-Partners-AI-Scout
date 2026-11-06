import type { Evidence } from "@/db/schema";
import { Dom } from "./Rich";
import { fmtDate } from "@/lib/format";

const Mk = () => (
  <svg className="mk c" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 12.5l5 5L20 6.5" />
  </svg>
);

/** Only the signals that count (user, 11-04-26: "redesign to only show Counts"); the rejected ones stay in the
 *  data, so a "none" answer can still say how many Scout checked. Nothing is drawn when none counts. */
export function EvidenceRows({ rows }: { rows: Evidence[] }) {
  const counting = rows.filter((e) => e.counts);
  if (!counting.length) return null;
  return (
    <div className="ev">
      <b>
        <i>
          <Mk /> {counting.length === 1 ? "The Signal That Counts" : "Signals That Count"}
        </i>
      </b>
      {counting.map((e, i) => (
        <div className="evr" key={i}>
          <Mk />
          <span className="d">{fmtDate(e.date)}</span>
          <span className="t">
            <a href={e.url} target="_blank" rel="noopener noreferrer" title={`Opens ${e.domain || "the source"} in a new window`}>
              {e.title}
            </a>
            <small>
              {e.domain && <Dom d={e.domain} />} · {e.note}
            </small>
          </span>
        </div>
      ))}
    </div>
  );
}
