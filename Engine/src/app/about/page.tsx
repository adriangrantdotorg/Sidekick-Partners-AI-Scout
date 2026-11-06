import { Phase2Link } from "@/components/Phase2Link";
import type { Metadata } from "next";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { DocHead, Toc } from "@/components/doc";
import { JOBS } from "@/lib/jobs";
import { TalkLink } from "@/components/talk";
import { firm, on, possessive, DISCLAIMER, BUILDER, builderFirst } from "@/firm";
import { CO_INVESTORS, PEER_FUNDS } from "@/data/funds";

export const revalidate = 300;
export const metadata: Metadata = { title: "About" };

/** The portfolio Scout checks against, counted live (Courtside's page listed 73, Sidekick's 86). */
async function portfolioCount(): Promise<number | null> {
  try {
    const r = (await db().execute(sql`select count(*)::int as n from portfolio`)) as unknown as { rows: { n: number }[] };
    return r.rows[0]?.n || null;
  } catch {
    return null; // no database yet: the line reads "the portfolio companies"
  }
}

const TOC = [
  { id: "how", label: "How it works" },
  { id: "sources", label: "Sources" },
  { id: "schedule", label: "Schedule" },
  { id: "phase2", label: "Phase II" },
];

function et(hourUtc: number) {
  const h = (hourUtc - 4 + 24) % 24;
  return `${h % 12 || 12} ${h < 12 ? "AM" : "PM"} ET`;
}

// Rewritten in Plan step 9: the not-affiliated line, the creators and shows only for a firm that reads them, and the
// Phase II line from the Plan (section 4).
export default async function Page() {
  const n = await portfolioCount();
  const creators = on("creatorFeeds");
  return (
    <div>
      <DocHead
        label="About"
        title={`${firm.product}`}
        lede={
          <>
            A deal-sourcing site built around {possessive(firm.name)} thesis. {DISCLAIMER}
            {BUILDER.name && BUILDER.url && (
              <span style={{ display: "block", marginTop: 14 }}>
                <TalkLink />
              </span>
            )}
          </>
        }
        slackText={`About ${firm.product}.`}
      />
      <div className="doc">
        <div className="main">
          <h2 id="how">How It Works</h2>
          <p>
            Every morning Scout reads SEC filings, startup launches, funding news, the App Store charts, {creators ? <>the creators and shows {firm.short}&apos;s world listens to, </> : null}and the funds around {firm.short}. It resolves what it finds into one card per real company, scores each one for thesis fit with a breakdown anyone can open, writes a one-line &quot;why it fits&quot;, and checks it against the {n ? `${n} ` : ""}portfolio companies. The Spotlight is picked by rules, never AI. Votes are shared: every visitor sees the same counts, and the votes nudge the scores (by at most 15 points).
          </p>
          <h2 id="sources">Sources</h2>
          <ul>
            <li>SEC EDGAR: the daily Form D and Form C index, filing details and full-text search</li>
            <li>Hacker News, Y Combinator&apos;s company list, Product Hunt, App Store charts</li>
            <li>Google News, Google Trends&apos; daily feed, and industry news: {firm.sources.feeds.map(([n]) => n).join(", ")}</li>
            {creators && <li>The creators and shows: YouTube channel feeds and podcast feeds (titles, descriptions and show notes)</li>}
            <li>Fund watch: news, blogs, newsletters, videos and Form D filings for about {CO_INVESTORS.length + PEER_FUNDS.length} funds</li>
            <li>{firm.short} itself: {firm.copy.ownSources}</li>
            <li>Off by default (Settings › Sources): GitHub and <a href="https://www.gdeltproject.org/" target="_blank" rel="noopener noreferrer" title="Opens the GDELT Project in a new window">GDELT</a>, a free index of news from around the world</li>
          </ul>
          <h2 id="schedule">Schedule</h2>
          <ul>
            {Object.entries(JOBS).map(([k, j]) => (
              <li key={k}>
                {j.label}: {j.weekday === 1 ? "Mondays" : j.weekday === 0 ? "Sundays" : "every day"}, around {et(j.hourUtc)}
              </li>
            ))}
            <li>Refresh Now: any time, once an hour for everyone</li>
          </ul>
          <h2 id="phase2">Phase II</h2>
          <p>
            Phase I is this prototype: {BUILDER.name ? <>built by {builderFirst()} alone, on free public sources</> : "built on free public sources"}. <Phase2Link /> is the production version{BUILDER.name ? <>, built with {firm.short}</> : null}: team-only access, trusted ratings, real-time updates, email alerts,{" "}
            {creators ? "social networks through the firm's accounts, " : ""}PitchBook and Crunchbase, and LinkedIn.
          </p>
        </div>
        <aside className="rail">
          <div className="stick">
            <div>
              <p className="kicker">On This Page</p>
              <Toc items={TOC} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
