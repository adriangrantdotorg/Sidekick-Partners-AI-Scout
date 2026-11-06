import Link from "next/link";
import { fundFeed } from "@/lib/queries";
import { FundItemTable } from "./rows";
import { CoInvestorTimeline } from "./Timeline";
import { timeline } from "@/lib/timeline";
import { RowFilter } from "./ListHead";
import { AREA_LABEL, fmtDate, slugify } from "@/lib/format";
import { firm, NAMES, PATHS, peerFundsWord, possessive } from "@/firm";

export async function FundPage({ kind }: { kind: "neighborhood" | "synergistic" }) {
  const { funds, items } = await fundFeed(kind, 120);
  const areas = Object.entries(AREA_LABEL).map(([key, label]) => ({ key, label, n: items.filter((i) => i.thesisArea === key).length }));
  const nb = kind === "neighborhood";
  const sorted = [...funds].sort((a, b) => (b.lastSharedDate || "").localeCompare(a.lastSharedDate || "") || a.name.localeCompare(b.name));
  // Sidekick's Co-Investors: one timeline of deals in place of the table and the fund cards (brand.coInvestors)
  const asTimeline = nb && firm.brand?.coInvestors === "timeline";
  const entries = asTimeline ? timeline(items.map((i) => ({ ...i, fundName: i.fund.name })), funds.map((f) => ({ name: f.name, shared: f.shared || [] }))) : [];
  return (
    <div>
      <div className="ph">
        <h1>{nb ? NAMES.coInvestors : NAMES.peerFunds}</h1>
        <span className="count">
          {funds.length} funds · {items.length} recent items
        </span>
      </div>
      <p className="ph-lede">
        {nb ? (
          asTimeline
            ? `Funds that have backed a company alongside ${firm.short}, and what they just backed, newest first. Specialist funds show every deal; broad funds only deals inside ${firm.short}'s thesis.`
            : `Funds that have backed a company alongside ${firm.short}, and what they just backed. Specialist funds show every deal; broad funds only deals inside ${firm.short}'s thesis. Funds from the most recent shared deal come first.`
        ) : (
          <>
            Funds synergistic to {firm.name}: each one backs startups in {possessive(firm.short)} industries, so what it
            backs is a deal {firm.short} could join, and it hasn&apos;t co-invested with {firm.short} yet. Once one does, it
            moves to the{" "}
            <Link href={PATHS.coInvestors} title={`Open the ${NAMES.coInvestors}`}>
              {NAMES.coInvestors}
            </Link>
            .
          </>
        )}
      </p>
      <RowFilter placeholder={nb ? "Search co-investor deals" : `Search ${peerFundsWord}`} areas={areas} target="#fund-feed" clear={false} />
      {asTimeline ? (
        <div id="fund-feed">
          <CoInvestorTimeline entries={entries} />
        </div>
      ) : (
      <>
      <div className="list" id="fund-feed">
        {/* two sections, each named for what it holds (user, 11-04-26: "what is the difference between these two
            sections?"): the deals these funds just did, then the funds themselves */}
        <div className="h">
          <h2>Their Latest Deals</h2>
          <span className="x-count">(What These Funds Just Backed, Newest First)</span>
        </div>
        <FundItemTable items={items} />
        {!items.length && <p className="empty">No new items from these funds in the last two weeks. The fund watch runs every morning.</p>}
      </div>
      <section className="list" aria-label="The funds">
        {/* no PitchBook, X and LinkedIn chip or line here (user, 11-04-26: "remove"); Phase II still lists them */}
        <div className="h">
          <h2>{nb ? "Co-Investors" : "The Funds Scout Watches"}</h2>
          {!nb && <span className="x-count">({funds.length} Funds, Each in One of {possessive(firm.short)} Industries)</span>}
        </div>
        <div className="brands wide4">
          {sorted.map((f) => (
            <div className="tile solo" key={f.id} id={f.slug || slugify(f.name)}>
              <span>
                <b>{f.site ? <a href={f.site} target="_blank" rel="noopener noreferrer" title={`Opens ${f.name} in a new window`}>{f.name}</a> : f.name}</b>
                <small>
                  {f.focus === "specialist" ? "Specialist" : "Broad"}
                  {f.thesisArea ? ` · ${AREA_LABEL[f.thesisArea]}` : ""}
                </small>
                {f.shared.map((s, k) => (
                  <span key={k}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" title="Opens the round's source in a new window">
                      {s.company}
                    </a>{" "}
                    {s.round ? `· ${s.round}` : ""} {s.date ? `· ${fmtDate(s.date)}` : ""}
                  </span>
                ))}
                {f.note && <span>{f.note}</span>}
                {/creator fund/i.test(f.name) && (
                  <span>
                    <a href="https://pitchbook.com/profiles/fund/26290-90F" target="_blank" rel="noopener noreferrer" title="Opens PitchBook in a new window">PitchBook</a> ·{" "}
                    <a href="https://x.com/mmlightcap" target="_blank" rel="noopener noreferrer" title="Opens Megan Lightcap on X in a new window">Megan on X</a> ·{" "}
                    <a href="https://www.linkedin.com/in/megan-lightcap-513ab96b/" target="_blank" rel="noopener noreferrer" title="Opens Megan Lightcap on LinkedIn in a new window">Megan on LinkedIn</a>
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </section>
      </>
      )}
    </div>
  );
}
