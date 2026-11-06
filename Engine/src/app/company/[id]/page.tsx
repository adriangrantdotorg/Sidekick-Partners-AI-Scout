import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { companyById } from "@/lib/queries";
import { getWeights } from "@/lib/settings";
import { aiAvailable } from "@/lib/ai";
import { CompanyNotes, MemoPanel } from "@/components/company-bits";
import { DealSheet, FitRing, Logo } from "@/components/V2";
import { BuyerInvested, LikelyAcquirersPanel, UnitEconomicsPanel } from "@/components/panels";
import { DeckDrop } from "@/components/DeckScreen";
import { CopyMd } from "@/components/CopyMd";
import { fundingWords, likelyAcquirers } from "@/lib/acquirers";
import { ueFyi, ueHeading, ueNote, ueRows, unscoredWhy } from "@/lib/unit-economics";
import { favicon, fmtDate, areaLabel, STAGE_LABEL, STATUS_LABEL } from "@/lib/format";
import { moneyRange, CAP } from "@/lib/v2";
import { cleanCopy } from "@/lib/copy";
import { SCORE_PARTS } from "@/lib/score";
import { firm, on } from "@/firm";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const d = await companyById(Number(id)).catch(() => null);
  return { title: d?.card.name || "Company" };
}

const PARTS: [string, string][] = SCORE_PARTS;

/** A company page, V2 (10-26-26): the Deal Sheet. Thesis fit and Funds Raised lead; Visit Website is the one red button. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await companyById(Number(id));
  if (!d) notFound();
  if (d.row.mergedInto) redirect(`/company/${d.row.mergedInto}`); // a duplicate card opens the one it merged into
  const [w, ai] = await Promise.all([getWeights(), aiAvailable()]);
  const c = d.card;
  const max: Record<string, number> = { thesis: w.thesis, stage: w.stage, signal: w.signal, culture: w.culture, unitEconomics: w.unitEconomics, team: w.team, geo: w.geo };
  const b = c.breakdown;
  const val = (k: string) => (k === "thesis" ? (b.thesis ?? b.laneFit ?? 0) : (b[k] ?? 0));
  // Unit Economics rises only with known numbers, never with stories: its own line under the bars says what it knows
  const low = PARTS.filter(([k]) => k !== "unitEconomics" && val(k) / (max[k] || 1) < 0.35).map(([, l]) => l.toLowerCase());
  const ue = on("unitEconomics") ? ueRows(c.thesisArea, { description: d.row.description || "", headlines: c.signals.map((x) => x.title) }) : [];
  const acq = on("likelyAcquirers") ? likelyAcquirers(c.thesisArea, fundingWords(c)) : null;
  const hint = [
    (b.learned || 0) !== 0 ? `Votes moved it ${b.learned > 0 ? "up" : "down"} ${Math.abs(b.learned)} points.` : "",
    (b.penalties || 0) !== 0 ? `Penalties took ${Math.abs(b.penalties)} points.` : "",
    low.length ? `Low on ${low.join(" and ")}: it rises as more independent stories arrive, ${on("culture") ? "as creators and shows mention it, " : ""}and as founders show up in filings.` : "Strong across the board.",
  ]
    .filter(Boolean)
    .join(" ");
  const rounds = c.funds.rounds.filter((r) => r.amount || r.stage !== "unknown");
  const backed = rounds.find((r) => r.investors);
  const investors = backed ? { text: backed.investors!, url: backed.sources.find((s) => s.url)?.url || null } : null;
  const why = d.row.notStartup ? d.row.notStartup : c.funds.total && c.funds.total >= CAP ? `It has raised ${c.funds.text}, past Scout's $${CAP / 1e6}M limit` : null;
  return (
    <div>
      <nav className="crumb" aria-label="Breadcrumb">
        <Link href="/pipeline" title="Open the Pipeline">
          Pipeline
        </Link>
        <span>›</span>
        <span>{c.name}</span>
      </nav>
      {why && (
        <p className="x-notrec" role="note">
          <b>Not on Scout&apos;s recommendations.</b> {why}. It stays here for reference{d.row.notStartup ? "; Settings › Hidden Startups can restore it" : ""}.
        </p>
      )}
      <DealSheet
        c={c}
        bars={PARTS.map(([k, l]) => [l, val(k), max[k]])}
        hint={hint}
        note={
          ue.length ? (
            <>
              {ueNote(ue, val("unitEconomics"), max.unitEconomics, c.thesisArea)}
              {on("deckScreen") && !unscoredWhy(c.thesisArea) && (
                <>
                  {" "}
                  <a href="#deck-screen" title="Go to the Deck Screen drop area below">
                    Drop a deck
                  </a>
                </>
              )}
            </>
          ) : undefined
        }
        investors={investors}
        off={!!why}
      />
      {acq?.invested && <BuyerInvested company={c.name} buyer={acq.invested} />}
      <UnitEconomicsPanel rows={ue} heading={ueHeading(c.thesisArea)} fyi={ueFyi(c.thesisArea, `${c.name} ${d.row.description || ""}`)} />
      {/* no section when the industry has no buyer with a deal loaded (user, 11-04-26: an empty box read as a gap) */}
      {acq && c.thesisArea && acq.buyers.length > 0 && <LikelyAcquirersPanel area={c.thesisArea} buyers={acq.buyers} also={acq.also} notes={acq.notes} />}
      {rounds.length > 0 && (
        <section className="x-rounds" aria-label="Funds Raised History">
          <CopyMd />
          <h2 className="x-h2">Funds Raised History</h2>
          {/* a phone scrolls the table inside its card, never the page (11-03-26) */}
          <div className="x-tscroll">
          <table>
            <thead>
              <tr>
                <th>Round</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Investors</th>
                <th>Sources</th>
              </tr>
            </thead>
            <tbody>
              {rounds.map((r, i) => (
                <tr key={i}>
                  <td className="r-st">{r.stage !== "unknown" ? STAGE_LABEL[r.stage] || r.stage : "Round"}</td>
                  <td className="r-amt">{r.amount ? moneyRange(r.low ?? r.amount, r.amount) : "Not Disclosed"}</td>
                  <td className="r-date">{fmtDate(r.date)}</td>
                  <td>{r.investors || "Not Reported"}</td>
                  <td>
                    {r.sources
                      .filter((s) => s.url)
                      .map((s, j) => (
                        <span key={j}>
                          {j > 0 && " · "}
                          <a href={s.url} target="_blank" rel="noopener noreferrer" title={`Opens ${s.title.slice(0, 80)} in a new window`}>
                            {s.name}
                          </a>
                        </span>
                      ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </section>
      )}
      {/* an add-on, never a step: Scout scores without a deck (user, 11-02-26), so the drop area sits after the facts */}
      {on("deckScreen") && (
        <section className="x-sec" aria-label="Deck Screen" id="deck-screen">
          <div className="x-sech">
            <h2 className="x-h2">Deck Screen</h2>
            <span className="x-count">(Optional, If You Have Their Deck)</span>
          </div>
          <DeckDrop company={c.name} />
        </section>
      )}
      <div className="rule" />
      <div className="dbody">
        <div className="dcol">
          <CompanyNotes companyId={c.id} name={c.name} initial={d.notes.map((n) => ({ id: n.id, body: n.body, createdAt: n.createdAt!.toISOString() }))} />
          <MemoPanel id={c.id} name={c.name} ai={ai} />
        </div>
        <aside className="dcol">
          {d.similar.length > 0 && (
            <section className="sec" aria-label="Similar in the Pipeline">
              <CopyMd />
              <div className="h">
                <h2>Similar in the Pipeline</h2>
              </div>
              <div className="x-sim">
                {d.similar.map((s) => (
                  <Link key={s.id} href={`/company/${s.id}`} title={`Open ${s.name} in Scout`} data-md="li" data-md-text={`**${s.name}** · ${cleanCopy(s.why || "")} · ${s.score}% Thesis Fit`}>
                    <Logo src={s.media?.logo || (s.domain ? favicon(s.domain) : null)} name={s.name} cls="x-logo sm" />
                    <span>
                      <b>{s.name}</b>
                      <span>{cleanCopy(s.why || "")}</span>
                    </span>
                    <FitRing fit={s.score} name={s.name} size="sm" />
                  </Link>
                ))}
              </div>
            </section>
          )}
          {d.nearby.length > 0 && (
            <section className="sec" aria-label="Nearby in the Portfolio">
              <div className="h">
                <h2>Nearby in the Portfolio</h2>
              </div>
              <div className="x-sim">
                {d.nearby.map((p) => (
                  <a key={p.id} href={p.descriptionUrl || p.site || "#"} target="_blank" rel="noopener noreferrer" title={`Opens ${p.name} on ${firm.short}'s site in a new window`}>
                    <Logo src={p.site ? favicon(p.site) : null} name={p.name} cls="x-logo sm" />
                    <span>
                      <b>{p.name}</b>
                      <span>{(p.description || "").split(/(?<=\.)\s/)[0]}</span>
                    </span>
                  </a>
                ))}
              </div>
            </section>
          )}
          <section className="sec" aria-label="Record">
            <div className="h">
              <h2>Record</h2>
            </div>
            <dl className="kv">
              <dt>Industry</dt>
              <dd>{areaLabel(c.thesisArea) || "Outside the Thesis"}</dd>
              <dt>Funds Raised</dt>
              <dd>
                {c.funds.text}
                {c.funds.stage ? ` · ${c.funds.stage}` : ""}
                {rounds.length > 1 ? ` · ${rounds.length} Rounds` : ""}
              </dd>
              <dt>Thesis Fit</dt>
              <dd>{c.score}%</dd>
              {c.overlap && (
                <>
                  <dt>Overlaps with</dt>
                  <dd>{c.overlap.with}</dd>
                </>
              )}
              <dt>First seen</dt>
              <dd>{fmtDate(c.firstSeen)}</dd>
              <dt>Last signal</dt>
              <dd>{c.lastSignal ? fmtDate(c.lastSignal) : "None yet"}</dd>
              <dt>Status</dt>
              <dd>{STATUS_LABEL[c.status]}</dd>
              <dt>Tracked by</dt>
              <dd>{c.tracked ? "The team (shared)" : "Not tracked"}</dd>
              <dt>Website</dt>
              <dd>
                {c.site ? (
                  <a href={c.site} target="_blank" rel="noopener noreferrer" title="Opens the official website in a new window">
                    {c.domain}
                  </a>
                ) : (
                  "Not found yet"
                )}
              </dd>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
