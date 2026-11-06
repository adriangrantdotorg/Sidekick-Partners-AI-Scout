// The Co-Investors feed drawn as a timeline (src/lib/timeline.ts; Sidekick's pick, 11-03-26). Each entry carries
// data-filter and data-area, so the page's search and industry chips (RowFilter) filter it like the table they replace.
import Link from "next/link";
import { byMonth, fundsLine, type Entry } from "@/lib/timeline";
import { AREA_LABEL, fmtDate } from "@/lib/format";
import { firm } from "@/firm";

function Line({ e }: { e: Entry }) {
  const co = e.companyId ? <Link href={`/company/${e.companyId}`} title={`Open ${e.company} in Scout`}>{e.company}</Link> : e.company;
  return (
    <div className="te" data-item data-filter={`${e.company} ${e.funds.join(" ")} ${e.headline || ""}`} data-area={e.area || ""}>
      <i aria-hidden="true" />
      <div>
        <p className="tt">
          <time>{fmtDate(e.date)}</time> {e.headline || <>{co} raised a {e.round}, with {fundsLine(e.funds)}</>}
        </p>
        <p className="tm">
          {e.headline ? <>{co} · {e.round} · {fundsLine(e.funds)}</> : <>{e.round} · {fundsLine(e.funds)}</>}
          {e.shared && <span className="tl-chip side">With {firm.short}</span>}
          {e.lead && <span className="tl-chip">Led the Round</span>}
          {e.area && <span className="tl-chip area">{AREA_LABEL[e.area]}</span>}
          {e.url && (
            <a href={e.url} target="_blank" rel="noopener noreferrer" title="Opens the story in a new window">
              {e.outlet || "Source"}
            </a>
          )}
        </p>
        {e.unnamed && <p className="tl-check">The headline doesn&apos;t name {e.funds[0]}: open the story to check it&apos;s their round.</p>}
      </div>
    </div>
  );
}

export function CoInvestorTimeline({ entries }: { entries: Entry[] }) {
  const groups = byMonth(entries);
  return (
    <section className="x-sec tl-sec" aria-label="Recent Deals">
      <h2 className="tl-h2">Recent Deals</h2>
      <p className="tl-sub">What the co-investors just backed, newest first: deals found in the news, and the rounds they shared with {firm.short}.</p>
      {groups.length ? (
        <div className="tl">
          {groups.map((g) => (
            <section className="tg" key={g.heading}>
              <h3>{g.heading}</h3>
              {g.entries.map((e, i) => <Line key={`${e.company}-${e.date}-${i}`} e={e} />)}
            </section>
          ))}
        </div>
      ) : (
        <p className="empty">No deals from these funds yet. The fund watch runs every morning.</p>
      )}
    </section>
  );
}
