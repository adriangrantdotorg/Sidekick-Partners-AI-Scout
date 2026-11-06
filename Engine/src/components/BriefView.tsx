import Link from "next/link";
import { DocHead, Toc } from "./doc";
import { Row, StorySources } from "./V2";
import { groupStories } from "@/lib/stories";
import type { CompanyCard } from "@/lib/queries";
import { Until } from "./Live";
import { fmtDate, nextRun, areaLabel, titleCase } from "@/lib/format";
import { cleanCopy } from "@/lib/copy";
import { firm, NAMES, on } from "@/firm";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function BriefView({ week, data, archive, top }: { week: string; data: any; archive: string[]; top: CompanyCard[] }) {
  // one entry per story, even in briefs built before the rule (10-26-26)
  const neighborhood = groupStories<any>(data.neighborhood || []);
  const synergistic = groupStories<any>(data.synergistic || []);
  // Sponsor Radar and Culture sections only for a firm with them (switches: sponsorRadar, culture)
  const sponsors: any[] = on("sponsorRadar") ? data.sponsors || [] : [];
  const culture: any[] = on("culture") ? data.culture || [] : [];
  const toc = [
    { id: "startups", label: "Top 5 startups this week" },
    ...(data.trends?.length ? [{ id: "trends", label: "Top trends" }] : []),
    ...(sponsors.length ? [{ id: "sponsors", label: "New on Sponsor Radar" }] : []),
    ...(culture.length ? [{ id: "culture", label: "Culture overlaps" }] : []),
    ...(neighborhood.length ? [{ id: "neighborhood", label: NAMES.coInvestorDeals }] : []),
    ...(synergistic.length ? [{ id: "synergistic", label: NAMES.peerFundMoves }] : []),
    ...(data.formd ? [{ id: "formd", label: NAMES.filingOfTheWeek }] : []),
  ];
  return (
    <div>
      <DocHead
        label={`IC Meeting · Week of ${fmtDate(week)}`}
        title="IC Meeting"
        lede={
          <>
            The week inside {firm.short}&apos;s thesis, every item with its source, ready for Monday&apos;s meeting.{" "}
            {on("slack") && (
              <Link href="/settings?s=slack" title="Post the brief to a Slack channel every Monday">
                Want this in Slack? Connect Slack
              </Link>
            )}
            <span className="mono" style={{ display: "block", marginTop: 6, fontSize: 14, color: "var(--text-3)" }}>
              Next brief Monday 12 AM ET · <Until date={nextRun(4, new Date(), 1)} ch={9} />
            </span>
          </>
        }
        slackText={`The IC Meeting brief for the week of ${fmtDate(week)}.`}
      />
      <div className="doc">
        <div className="main">
          <h2 id="startups">Top 5 Startups This Week</h2>
          <div className="x-rows brief">
            {top.map((c, i) => (
              <Row key={c.id} c={c} rank={i + 1} />
            ))}
          </div>
          {!top.length && <p>{cleanCopy("No startup this week passed Scout's rules yet.")}</p>}
          {data.trends?.length > 0 && (
            <>
              <h2 id="trends">Top Trends</h2>
              <ul>
                {data.trends.map((t: any) => (
                  <li key={t.slug}>
                    <Link href={`/trends#${t.slug}`} title="Open this trend">
                      {t.headline}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          {sponsors.length > 0 && (
            <>
              <h2 id="sponsors">New on Sponsor Radar</h2>
              <ul>
                {sponsors.map((s: any) => (
                  <li key={s.key}>
                    <Link href={`/sponsors#${s.key}`} title={`Open ${s.brand} in Sponsor Radar`}>
                      {s.brand}
                    </Link>{" "}
                    · {s.stamp}
                  </li>
                ))}
              </ul>
            </>
          )}
          {culture.length > 0 && (
            <>
              <h2 id="culture">Culture Overlaps</h2>
              <ul>
                {culture.map((c: any) => (
                  <li key={c.entity}>
                    <a href={c.url} target="_blank" rel="noopener noreferrer" title="Opens the episode or video in a new window">
                      {c.entity}
                    </a>{" "}
                    · {c.voices.slice(0, 4).join(", ")}
                  </li>
                ))}
              </ul>
            </>
          )}
          {neighborhood.length > 0 && (
            <>
              <h2 id="neighborhood">{titleCase(NAMES.coInvestorDeals)}</h2>
              <ul className="x-nlist">
                {neighborhood.map((n: any, i: number) => (
                  <li key={i}>
                    <a href={n.url} target="_blank" rel="noopener noreferrer" title="Opens the story in a new window">
                      {n.title}
                    </a>{" "}
                    · {n.fund}
                    <StorySources sources={n.sources} />
                  </li>
                ))}
              </ul>
            </>
          )}
          {synergistic.length > 0 && (
            <>
              <h2 id="synergistic">{titleCase(NAMES.peerFundMoves)}</h2>
              <ul className="x-nlist">
                {synergistic.map((n: any, i: number) => (
                  <li key={i}>
                    <a href={n.url} target="_blank" rel="noopener noreferrer" title="Opens the story in a new window">
                      {n.title}
                    </a>{" "}
                    · {n.fund}
                    <StorySources sources={n.sources} />
                  </li>
                ))}
              </ul>
            </>
          )}
          {data.formd && (
            <>
              <h2 id="formd">{titleCase(NAMES.filingOfTheWeek)}</h2>
              <p>
                <a href={data.formd.url} target="_blank" rel="noopener noreferrer" title="Opens the filing at sec.gov in a new window">
                  {data.formd.issuer}
                </a>{" "}
                · {data.formd.amount} · {areaLabel(data.formd.area)}
              </p>
            </>
          )}
        </div>
        <aside className="rail">
          <div className="stick">
            <div>
              <p className="kicker">On This Page</p>
              <Toc items={toc} />
            </div>
            {archive.length > 1 && (
              <div>
                <p className="kicker">Archive</p>
                <nav className="toc" aria-label="Brief archive">
                  {archive.map((w) => (
                    <Link key={w} href={`/brief/${w}`} className={w === week ? "on" : ""}>
                      Week of {fmtDate(w)}
                    </Link>
                  ))}
                </nav>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
