// A trend in two columns (a firm's brand.trends = "columns"; Sidekick, user 11-04-26: round 1's B, then round 2's A,
// "use this version"; design/pages/TL-A-trends.html). Left: the industry, the trend's name, one sentence and two labeled
// buttons; right: the change in mentions, how many stories from how many outlets, the sparkline, the outlets and Track.
// Dropped from the old card: the outlets named again in the sentence, the "News" chips, the Real-time chip and votes.
import { Rich } from "./Rich";
import { TrackTrend } from "./TrackTrend";
import { TrendStories } from "./TrendStories";
import { spark } from "./rows";
import { domainOf, favicon, trendPipelineHref } from "@/lib/format";
import type { Seg } from "@/lib/linkify";
import type { TrendCard } from "@/lib/queries";

/** The sentence without its trailing outlet list (", in Food Dive, NOSH."): the outlets show as icons beside it. */
export function leadOf(segs: Seg[]): Seg[] {
  const out = [...segs];
  const i = out.length - 1;
  if (i >= 0 && typeof out[i] === "string") out[i] = (out[i] as string).replace(/,\s*in [^.]*?(?: and \d+ more)?\.\s*$/, ".");
  return out;
}

export function TrendColumns({ t }: { t: TrendCard }) {
  const [name, count] = t.headline.includes(": ") ? [t.headline.slice(0, t.headline.indexOf(": ")), t.headline.slice(t.headline.indexOf(": ") + 2)] : [t.headline, `${t.sources.length} ${t.sources.length === 1 ? "story" : "stories"} this month`];
  const n = Math.abs(t.delta);
  const outlets = [...new Map(t.sources.map((s) => [domainOf(s.url), s])).values()].slice(0, 4);
  const stories = t.sources.slice(0, 20).map((s) => ({ title: s.title, url: s.url, outlet: domainOf(s.url) || s.source, icon: favicon(domainOf(s.url)) }));
  return (
    <article id={t.slug} className="rowcard tcard tcol" data-item data-filter={`${t.headline} ${t.area}`} data-area={t.thesisArea || ""}>
      <div className="tc-l">
        {t.area && <span className="tag">{t.area}</span>}
        <h3>{name}</h3>
        {t.whySegs.length > 0 && (
          <p className="tc-lead">
            <Rich segs={leadOf(t.whySegs)} />
          </p>
        )}
        <TrendStories href={trendPipelineHref(t.slug, t.term)} stories={stories} />
      </div>
      <div className="tc-r">
        <p className={"tc-n" + (t.up ? "" : " dn")}>
          <b>
            {t.up ? "+" : "−"}
            {n}
          </b>
          {n === 1 ? "Mention" : "Mentions"}
        </p>
        <p className="tc-sub">{count}</p>
        <svg className="spark" viewBox="0 0 120 34" aria-label={`Mentions over four weeks: ${t.weekly.join(", ")}`}>
          <polyline className={t.up ? "" : "dn"} points={spark(t.weekly)} />
        </svg>
        <div className="tc-favs" title="The outlets that ran these stories">
          {outlets.map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" title={`${s.title}: opens in a new window`}>
              <img src={favicon(domainOf(s.url))} alt="" width={18} height={18} />
            </a>
          ))}
        </div>
        <TrackTrend id={t.id} term={t.headline} initial={t.tracked} />
      </div>
    </article>
  );
}
