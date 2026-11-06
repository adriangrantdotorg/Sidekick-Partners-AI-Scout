import type { Metadata } from "next";
import { backtestRows } from "@/lib/queries";
import { DocHead, Toc } from "@/components/doc";
import { BacktestAny } from "@/components/BacktestAny";
import { favicon, fmtDate } from "@/lib/format";
import { firm, possessive } from "@/firm";

export const revalidate = 300;

type Row = Awaited<ReturnType<typeof backtestRows>>[number];
/** The page that puts the firm in the round (kind "Proof"): its sentence is the announcement link's tooltip. */
const proofOf = (b: Row) => b.evidence.find((e) => e.kind === "Proof") || null;
/** The signal that flagged it: the counting one dated the flag day, else the first that counts. */
const flagOf = (b: Row) => b.evidence.find((e) => e.counts && e.date === b.flaggedOn) || b.evidence.find((e) => e.counts) || null;
/** The signal's name inside the sentence (user, 11-04-26: "through its Form D"). */
const via = (kind: string | null) => ({ "Form D": "its Form D", "Hacker News": "a Hacker News post", News: "a news story", "App Store": "its App Store listing" })[kind || ""] || kind || "";
export const metadata: Metadata = { title: "Backtest" };

/** One startup Scout would have found first (round 1's C, Try It First, user 11-04-26): its lead in days, then one
 *  sentence whose links prove each point (the signal, the announcement). */
function Tile({ b }: { b: Row }) {
  const flag = flagOf(b);
  const proof = proofOf(b);
  const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
  return (
    <article id={b.slug} className="bt-tile">
      {b.domain ? <img src={favicon(b.domain)} alt="" width={34} height={34} /> : <span className="bt-mono">{b.company.charAt(0)}</span>}
      <div>
        <h3>
          {b.domain ? (
            <a href={`https://${b.domain}`} {...ext} title={`Opens ${b.domain} in a new window`}>
              {b.company}
            </a>
          ) : (
            b.company
          )}
        </h3>
        <p className="bt-lead">
          <b>{b.leadDays}</b> Days Early
        </p>
        <p className="bt-line">
          Scout would have flagged this on {fmtDate(b.flaggedOn)} through{" "}
          {flag?.url ? (
            <a href={flag.url} {...ext} title={`${flag.title}: opens ${flag.domain || "the source"} in a new window`}>
              {via(b.signal)}
            </a>
          ) : (
            via(b.signal)
          )}
          . That&apos;s {b.leadDays} days before{" "}
          {b.announceUrl ? (
            <a href={b.announceUrl} {...ext} title={proof?.note ? `“${proof.note}”` : "Opens the announcement in a new window"}>
              its public announcement
            </a>
          ) : (
            "its public announcement"
          )}
          .
        </p>
      </div>
    </article>
  );
}

export default async function Page() {
  const all = await backtestRows(false);
  // Only the deals Scout would have found first are shown (user, 10-14-26, and 11-04-26: "remove 'No Earlier Signal'")
  const deals = all.filter((b) => b.ownDeal && b.verdict === "win").sort((a, b) => (b.leadDays || 0) - (a.leadDays || 0));
  // A deal no reputable page dates yet ("unproven") is not listed (user, 11-04-26: "remove 'Waiting for a Report'"):
  // the Proof Finder searches it again every 30 days, and once a report dates it, a found-first deal joins the tiles above.
  const others = all.filter((b) => !b.ownDeal && b.verdict === "win").slice(0, 12);
  const leads = deals.map((w) => w.leadDays || 0).sort((a, b) => a - b);
  const median = leads.length ? leads[Math.floor((leads.length - 1) / 2)] : 0;
  const ours = `Proven on ${possessive(firm.short)} Deals`;
  // Proven on the firm's deals first, then Backtest Any Startup (user, 11-04-26)
  const toc = [
    ...(deals.length ? [{ id: "firm-deals", label: ours }] : []),
    { id: "any", label: "Backtest Any Startup" },
    ...(others.length ? [{ id: "others", label: "Startups You Backtested" }] : []),
  ];
  return (
    <div>
      <DocHead label="Backtest" title="We'd Have Found It First" lede="How early Scout would have sourced a startup." slackText={`Backtest: Scout would have flagged these ${firm.short} deals before they were announced.`} />
      <div className="doc">
        <div className="main">
          {deals.length > 0 && (
            <section className="bt-sec" id="firm-deals">
              <h2>{ours}</h2>
              <div className="bt-grid">
                {deals.map((b) => (
                  <Tile key={b.slug} b={b} />
                ))}
              </div>
            </section>
          )}
          <BacktestAny />
          {others.length > 0 && (
            <section className="bt-sec" id="others">
              <h2>Startups You Backtested</h2>
              <div className="bt-grid">
                {others.map((b) => (
                  <Tile key={b.slug} b={b} />
                ))}
              </div>
            </section>
          )}
        </div>
        <aside className="rail">
          <div className="stick">
            <div>
              <p className="kicker">On This Page</p>
              <Toc items={toc} />
            </div>
            {leads.length > 0 && (
              <div>
                <p className="kicker">Scorecard</p>
                <div className="score">
                  <div>
                    <b>{median} d</b>
                    <span>Median Days Early</span>
                  </div>
                  <div>
                    <b>{leads[leads.length - 1]} d</b>
                    <span>Longest Lead</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
