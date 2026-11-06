"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { List, Columns3, Search } from "lucide-react";
import { Signals, StatusPill, partOf } from "./cards";
import { Logo, Row } from "./V2";
import { Ago } from "./Live";
import { BUCKETS } from "@/lib/v2";
import { sigLabel } from "@/lib/labels";
import { firm } from "@/firm";
import { useUI, ClearX } from "./ui";
import { Rich } from "./Rich";
import { postJSON } from "@/lib/client";
import { UNDO_LINE } from "@/lib/copy";
import { STATUSES, STATUS_LABEL, favicon, AREAS, AREA_LABEL } from "@/lib/format";
import type { CompanyCard } from "@/lib/queries";

// V2 (10-26-26): one row of menus. Funds Raised replaced Stage, Category replaced Status and the area chips.
export type Filters = { q: string; area: string; bucket: string; signal: string; score: string; seen: string; rating: string; play: string };
const EMPTY: Filters = { q: "", area: "", bucket: "", signal: "", score: "", seen: "", rating: "", play: "" };
// a trend's Find Startups opens the Pipeline at ?play=<key> (11-04-26: it searched every play trend for the word "play")
const PLAY_OPTS: [string, string][] = firm.thesis.plays.map((p) => [p.key, p.label.charAt(0).toUpperCase() + p.label.slice(1)]);
const PAGE = 20;
const DAY = 86400000;

/** Does a card pass every filter? One predicate for the list and for the menus' options. */
export function matches(c: CompanyCard, f: Filters, now: number): boolean {
  const q = f.q.trim().toLowerCase();
  if (q && !`${c.name} ${c.domain || ""} ${c.descSegs.map((s) => (typeof s === "string" ? s : s.t)).join("")}`.toLowerCase().includes(q)) return false;
  if (f.bucket !== "" && String(c.bucket) !== f.bucket) return false;
  if (f.area && c.thesisArea !== f.area) return false;
  if (f.play && c.play !== f.play) return false;
  if (f.signal && !c.signals.some((s) => s.type === f.signal)) return false;
  if (f.score && c.score < Number(f.score)) return false;
  if (f.seen && now) {
    const age = now - new Date(c.firstSeen).getTime();
    if (f.seen === "today" && age > DAY) return false;
    if (f.seen === "week" && age > 7 * DAY) return false;
    if (f.seen === "month" && age > 30 * DAY) return false;
  }
  if (f.rating === "up" && c.votes <= 0) return false;
  if (f.rating === "down" && c.votes >= 0) return false;
  return true;
}

function Sel({ label, value, onChange, opts }: { label: string; value: string; onChange: (v: string) => void; opts: [string, string][] }) {
  return (
    <label className={"fsel" + (value ? " on" : "")}>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        <option value="">All</option>
        {opts.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PipelineView({ cards, threshold }: { cards: CompanyCard[]; threshold: number }) {
  const ui = useUI();
  const params = useSearchParams();
  const [view, setView] = useState<"list" | "board">("list");
  const [f, setF] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(0);
  const [items, setItems] = useState(cards);
  const [now, setNow] = useState(0);
  useEffect(() => setItems(cards), [cards]);
  useEffect(() => {
    setNow(Date.now());
    // Filters come only from the URL (10-14-26: a saved search came back on a plain nav click, "that should not be the case")
    const fromUrl: Partial<Filters> = {};
    if (params.get("q")) fromUrl.q = params.get("q")!;
    if (params.get("min")) fromUrl.score = params.get("min")!;
    if (params.get("seen")) fromUrl.seen = params.get("seen")!;
    if (params.get("area")) fromUrl.area = params.get("area")!;
    if (params.get("play")) fromUrl.play = params.get("play")!;
    setF({ ...EMPTY, ...fromUrl });
    setView(params.get("view") === "board" ? "board" : "list");
  }, [params]);
  const set = (k: keyof Filters) => (v: string) => {
    setF((x) => ({ ...x, [k]: v }));
    setPage(0);
  };

  const shown = useMemo(() => items.filter((c) => matches(c, f, now)), [items, f, now]);
  // A dropdown option that would show nothing is not offered (user, 10-14-26); the chosen one always stays.
  const live = (k: keyof Filters, opts: [string, string][]) => opts.filter(([v]) => v === f[k] || items.some((c) => matches(c, { ...f, [k]: v }, now)));
  const active = Object.values(f).some(Boolean);
  const newWeek = items.filter((c) => c.isNew).length;

  async function move(c: CompanyCard, status: string) {
    if (c.status === status) return;
    if (status === "passed") {
      const ok = await ui.confirm({
        title: `Pass on ${c.name}?`,
        facts: [
          ["Company", `${c.name} · ${c.area} · ${c.score}% thesis fit`],
          ["Moves to", "Passed, at the end of the Pipeline and off Today"],
          ["Keeps", "its signals, score history, the team's notes and votes"],
        ],
        consequence: `Everyone sees this change. ${UNDO_LINE} The Pipeline's Passed column keeps the card.`,
        verb: "Pass",
        danger: true,
      });
      if (!ok) return;
    }
    const prev = c.status;
    setItems((xs) => xs.map((x) => (x.id === c.id ? { ...x, status } : x)));
    const r = await ui.undoable("Move", postJSON<{ logId: number }>("/api/status", { id: c.id, status }), async (r) => {
      setItems((xs) => xs.map((x) => (x.id === c.id ? { ...x, status: prev } : x)));
      await postJSON("/api/undo", { id: r.data!.logId });
    });
    if (!r.ok) {
      setItems((xs) => xs.map((x) => (x.id === c.id ? { ...x, status: prev } : x)));
      ui.error(`${c.name} didn't move`, r.error || "The server did not answer.");
      return;
    }
    ui.toast(`${c.name} Moved to ${STATUS_LABEL[status]}`);
  }

  return (
    <>
      <div className="ph">
        <h1>Pipeline</h1>
        <span className="count">
          {items.length} startups inside the thesis{newWeek ? ` · ${newWeek} new this week` : ""} · sorted by thesis fit
        </span>
        <div className="views" role="group" aria-label="View">
          <button aria-pressed={view === "list"} onClick={() => setView("list")} title="Show the Pipeline as a ranked list">
            <List className="ico" />
            List
          </button>
          <button aria-pressed={view === "board"} onClick={() => setView("board")} title="Show the Pipeline as a board by status; drag cards between columns">
            <Columns3 className="ico" />
            Board
          </button>
        </div>
      </div>
      <div className="filters x-pfilters">
        <label className="fsearch">
          <Search className="ico" />
          <input
            data-search
            value={f.q}
            onChange={(e) => set("q")(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && (f.q ? set("q")("") : (e.target as HTMLInputElement).blur())}
            placeholder="Search the Pipeline"
            aria-label="Search the Pipeline"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <ClearX show={!!f.q} onClear={() => set("q")("")} />
        </label>
        <Sel label="Funds Raised" value={f.bucket} onChange={set("bucket")} opts={live("bucket", BUCKETS.map((b, i) => [String(i), b] as [string, string]))} />
        <Sel label="Category" value={f.area} onChange={set("area")} opts={live("area", AREAS.map((a) => [a, AREA_LABEL[a]] as [string, string]))} />
        <Sel label="Fit" value={f.score} onChange={set("score")} opts={live("score", [[String(threshold), `Worth a Look (${threshold}%+)`], ["50", "50%+"], ["40", "40%+"], ["30", "30%+"]])} />
        <Sel label="Signal" value={f.signal} onChange={set("signal")} opts={live("signal", [["formd", "Form D"], ["formc", "Form C"], ["yc", "Y Combinator"], ["hn", "Show HN"], ["producthunt", "Product Hunt"], ["appstore", "App Store"], ["news", "News"]])} />
        <Sel label="Seen" value={f.seen} onChange={set("seen")} opts={live("seen", [["today", "Today"], ["week", "This Week"], ["month", "This Month"]])} />
        {/* shown only while a play is picked (a trend's Find Startups sets it), so the bar keeps its one row of menus */}
        {f.play && <Sel label="Play" value={f.play} onChange={set("play")} opts={live("play", PLAY_OPTS)} />}
        <Sel label="Rating" value={f.rating} onChange={set("rating")} opts={live("rating", [["up", "Voted Up"], ["down", "Voted Down"]])} />
        <button className="fclear" disabled={!active} onClick={() => setF(EMPTY)} title="Clear every filter">
          Clear Filters
        </button>
      </div>
      <div className="rule" />
      {view === "list" ? (
        <>
          {firm.brand?.pipeline === "table" ? (
            <FitTable cards={shown.slice(page * PAGE, page * PAGE + PAGE)} rank={(c) => items.indexOf(c) + 1} />
          ) : (
            <div className="x-rows" id="prows">
              {shown.slice(page * PAGE, page * PAGE + PAGE).map((c) => (
                <Row key={c.id} c={c} rank={items.indexOf(c) + 1} />
              ))}
            </div>
          )}
          {!shown.length && (
            <p className="empty">
              {/* a Scout before its first pull has nothing to clear (it said "Clear Filters shows all 0", 11-03-26) */}
              {items.length ? `No company matches these filters. Clear Filters shows all ${items.length}.` : "No startups yet. The first pull fills the Pipeline in a few minutes."}
            </p>
          )}
          {shown.length > PAGE && (
            <div className="pager">
              <button className="btn" disabled={page === 0} onClick={() => setPage(page - 1)} title="Previous page">
                Previous
              </button>
              <span>
                {page * PAGE + 1}–{Math.min(shown.length, page * PAGE + PAGE)} of {shown.length}
              </span>
              <button className="btn" disabled={(page + 1) * PAGE >= shown.length} onClick={() => setPage(page + 1)} title="Next page">
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <Board cards={shown} move={move} />
      )}
    </>
  );
}

const segText = (segs: CompanyCard["descSegs"]) => segs.map((s) => (typeof s === "string" ? s : s.t)).join("");

/** The Fit Table (the firm's brand.pipeline): one line per startup, ranked by thesis fit. The name opens the startup;
 *  its latest signal opens the story Scout read. */
function FitTable({ cards, rank }: { cards: CompanyCard[]; rank: (c: CompanyCard) => number }) {
  if (!cards.length) return null;
  return (
    <div className="x-ftable" id="prows">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Startup</th>
            <th className="ft-ind">Industry</th>
            <th>Thesis Fit</th>
            <th>Found</th>
            <th className="ft-sigh">Latest Signal</th>
            <th className="ft-fund">Funds Raised</th>
          </tr>
        </thead>
        <tbody>
          {cards.map((c) => {
            const s = c.signals[0];
            const line = segText(c.descSegs) || segText(c.whySegs);
            return (
              <tr key={c.id} data-item data-company={c.id}>
                <td className="ft-mut">{rank(c)}</td>
                <td>
                  <span className="ft-co">
                    <Logo src={c.logo} name={c.name} cls="x-logo sm" />
                    <span>
                      <b>
                        <Link href={`/company/${c.id}`} data-act="open" title={`Open ${c.name} in Scout`}>
                          {c.name}
                        </Link>
                      </b>
                      {line && <small>{line}</small>}
                    </span>
                  </span>
                </td>
                <td className="ft-mut ft-ind">{c.area}</td>
                <td>
                  <span className="ft-fit" style={{ ["--w" as string]: `${c.score}%` }}>
                    <i />
                    <b>{c.score}%</b>
                  </span>
                </td>
                <td className="ft-mut">
                  <Ago date={c.firstSeen} days ch={0} />
                </td>
                <td className="ft-mut ft-sigh">
                  {s ? (
                    <>
                      <a className="ft-sig" href={s.url} target="_blank" rel="noopener noreferrer" title={`Opens ${s.title.slice(0, 90)} in a new window`}>
                        {sigLabel(s)}
                      </a>
                      {s.date && (
                        <>
                          {" · "}
                          <Ago date={s.date} ch={0} />
                        </>
                      )}
                    </>
                  ) : (
                    "None Yet"
                  )}
                </td>
                <td className={"ft-fund" + (c.funds.known ? "" : " none")}>{c.funds.text}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Board({ cards, move }: { cards: CompanyCard[]; move: (c: CompanyCard, s: string) => void }) {
  const [over, setOver] = useState<string | null>(null);
  const [lifted, setLifted] = useState<number | null>(null);
  const drag = useRef<number | null>(null);
  const cols = STATUSES.map((s) => ({ s, list: cards.filter((c) => c.status === s) }));
  function onKey(e: React.KeyboardEvent, c: CompanyCard) {
    if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      if (lifted === c.id) setLifted(null);
      else setLifted(c.id);
      return;
    }
    if (lifted === c.id && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      e.preventDefault();
      const i = STATUSES.indexOf(c.status as (typeof STATUSES)[number]);
      const j = e.key === "ArrowRight" ? Math.min(3, i + 1) : Math.max(0, i - 1);
      if (j !== i) move(c, STATUSES[j]);
      setTimeout(() => document.querySelector<HTMLElement>(`[data-mini="${c.id}"]`)?.focus(), 50);
    }
    if (e.key === "Escape") setLifted(null);
  }
  return (
    <div className="board">
      {cols.map(({ s, list }) => (
        <div
          key={s}
          className={"bcol" + (over === s ? " over" : "")}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(s);
          }}
          onDragLeave={() => setOver(null)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(null);
            const c = cards.find((x) => x.id === drag.current);
            if (c) move(c, s);
          }}
          data-col={s}
        >
          <div className={"col-h " + s}>
            {STATUS_LABEL[s]} <b>{list.length}</b>
          </div>
          {list.map((c) => (
            <div
              key={c.id}
              className={"mini" + (lifted === c.id ? " lifted" : "")}
              draggable
              tabIndex={0}
              data-mini={c.id}
              data-item
              aria-label={`${c.name}, ${STATUS_LABEL[c.status]}. Space picks it up; arrows move it.`}
              onDragStart={() => (drag.current = c.id)}
              onKeyDown={(e) => onKey(e, c)}
            >
              <div className="top2">
                {c.domain && (
                  <span className="clogo" style={{ width: 26, height: 26 }}>
                    <img src={favicon(c.domain)} alt="" width={16} height={16} />
                  </span>
                )}
                <span className="nm">
                  <Link href={`/company/${c.id}`} data-act="open" title={`Open ${c.name} in Scout`}>
                    {c.name}
                  </Link>
                </span>
                <span className="sc">
                  {c.score}
                  <small>%</small>
                </span>
              </div>
              {c.whySegs.length > 0 && (
                <p className="why">
                  <Rich segs={c.whySegs} />
                </p>
              )}
              <div className="facts">
                <span>
                  Funds Raised <b>{c.funds.text}</b>
                </span>
              </div>
              <div className="foot2">
                {/* no up/down votes on a Board card (user, 11-03-26: "Remove up/down indicators from all cards") */}
                <Signals signals={c.signals.slice(0, 3)} />
              </div>
              <div className="stbtns" role="group" aria-label="Move to">
                {STATUSES.filter((x) => x !== c.status).map((x) => (
                  <button key={x} onClick={() => move(c, x)} title={`Move ${c.name} to ${STATUS_LABEL[x]}`}>
                    {STATUS_LABEL[x]}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {!list.length && <div className="empty">Drag a card here</div>}
        </div>
      ))}
    </div>
  );
}

export { StatusPill, partOf };
