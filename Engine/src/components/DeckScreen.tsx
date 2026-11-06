"use client";
// Deck Screen (Plan section 5): drop a pitch deck and Scout reads it the way a partner would. The PDF is read here in
// the browser (its text page by page, and pictures of the pages that carry charts), the AI answers through
// /api/deck, and the result shows once: nothing is saved (user, 10-30-26). Designs: Sidekick Partners/design/pages/
// S2-deck-reading.html and S3-deck-result.html.
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { firm, on, possessive, type DeckResult, type DeckStatus } from "@/firm";
import { areaLabel } from "@/lib/format";
import { DECK_LIMITS, DECK_STATUS, deckSteps, MOAT, READ_STEP, stepDone, type DeckInput } from "@/lib/deck";
import { dragHasFiles, handOff, isPdf, takeHandOff } from "@/lib/deck-drop";
import { copyText, sectionMarkdown } from "@/lib/markdown";
import { deckNote, ueHeading, ueRows } from "@/lib/unit-economics";
import { Clock } from "./Live";
import { FitRing } from "./V2";
import { CopyMd } from "./CopyMd";
import { DROP_WORDS, NotSaved, UnitEconomicsPanel } from "./panels";
import { useUI } from "./ui";

/** Reads a PDF in the browser: every page's text, and JPEG pictures of the pages with the fewest words (charts and
 *  photos carry what the text misses), inside the request limits. */
export async function readPdf(file: File, onPage: (i: number, n: number) => void): Promise<DeckInput> {
  const pdfjs = await import("pdfjs-dist");
  if (!pdfjs.GlobalWorkerOptions.workerSrc) pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const doc = await task.promise;
  try {
    const n = Math.min(doc.numPages, DECK_LIMITS.pages);
    const pages: DeckInput["pages"] = [];
    const words: { i: number; len: number }[] = [];
    for (let i = 1; i <= n; i++) {
      onPage(i, n);
      const page = await doc.getPage(i);
      const tc = await page.getTextContent();
      const text = tc.items
        .map((it) => ("str" in it ? it.str + (it.hasEOL ? "\n" : " ") : ""))
        .join("")
        .replace(/[ \t]+/g, " ")
        .trim();
      pages.push({ n: i, text: text.slice(0, DECK_LIMITS.chars) });
      words.push({ i, len: text.length });
    }
    const pick = [...words].sort((a, b) => a.len - b.len).slice(0, DECK_LIMITS.images).sort((a, b) => a.i - b.i);
    const images: DeckInput["images"] = [];
    let bytes = 0;
    for (const { i } of pick) {
      const page = await doc.getPage(i);
      const vp = page.getViewport({ scale: Math.min(1.6, 1100 / page.getViewport({ scale: 1 }).width) });
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(vp.width);
      canvas.height = Math.round(vp.height);
      await page.render({ canvas, viewport: vp }).promise;
      const data = canvas.toDataURL("image/jpeg", 0.6).split(",")[1] || "";
      if (bytes + data.length > DECK_LIMITS.bytes) break;
      bytes += data.length;
      images.push({ n: i, data });
    }
    return { file: `${file.name} · ${doc.numPages} ${doc.numPages === 1 ? "page" : "pages"}`, pages, images };
  } finally {
    void task.destroy();
  }
}

/** A drop area for a deck: drop a PDF or choose one. On a company page it hands the deck to the Deck Screen page. */
export function DeckDrop({ company, onFile, big }: { company?: string; onFile?: (f: File) => void; big?: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const take = (f: File | undefined) => {
    if (!f) return;
    if (onFile) return onFile(f);
    handOff(f, company);
    router.push("/deck");
  };
  return (
    <div
      className={"x-drop" + (over ? " over" : "") + (big ? " big" : "")}
      data-testid="deck-drop"
      onDragOver={(e) => {
        if (!dragHasFiles(e)) return;
        e.preventDefault();
        e.stopPropagation();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        take(e.dataTransfer.files[0]);
      }}
    >
      <b>{company ? `Drop ${possessive(company)} Pitch Deck` : "Drop a Pitch Deck"}</b>
      <span>{DROP_WORDS[0]}</span>
      <span className="x-dropsafe">{DROP_WORDS[1]}</span>
      <button type="button" className="x-btn ghost" onClick={() => input.current?.click()} title="Choose a PDF from this computer" data-testid="deck-choose">
        Choose a PDF
      </button>
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        data-testid="deck-file"
        onChange={(e) => {
          take(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

type Fit = { score: number; ue: number; outOf: number };
type Phase =
  | { k: "idle" }
  | { k: "reading"; file: string; company?: string; page: [number, number]; read: boolean; at: number; started: number }
  | { k: "result"; r: DeckResult; fit: Fit | null; match: { id: number; name: string } | null }
  | { k: "error"; msg: string; file?: File };

// a red flag is a warning: where this deck stands on it, worst first (user, 11-02-26: "redesigned to communicate these
// are red flags and thus warnings")
const SEEN: Record<string, string> = { found: "Found in This Deck", missing: "Not Addressed in the Deck", clear: "Cleared by the Deck" };
const SEEN_ORDER: Record<string, number> = { found: 0, missing: 1, clear: 2 };
const WarnIco = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <path d="M12 3 2.5 20h19z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M12 9.5v5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="12" cy="17.4" r="1.3" fill="currentColor" />
  </svg>
);

/** The Deck Screen page: a drop area, the read while it runs, then the result. */
export function DeckScreen({ ai, ueMax, sampleFit }: { ai: boolean; ueMax: number; sampleFit: Fit }) {
  const [phase, setPhase] = useState<Phase>({ k: "idle" });
  const ctl = useRef<AbortController | null>(null);

  const run = useCallback(async (file: File, company?: string) => {
    ctl.current?.abort();
    const abort = new AbortController();
    ctl.current = abort;
    const fail = (msg: string) => !abort.signal.aborted && setPhase({ k: "error", msg, file });
    if (!isPdf(file)) return setPhase({ k: "error", msg: "Deck Screen reads PDFs. Save the deck as a PDF and drop it again." });
    const set = (f: (p: Extract<Phase, { k: "reading" }>) => Partial<Extract<Phase, { k: "reading" }>>) => setPhase((p) => (p.k === "reading" && !abort.signal.aborted ? { ...p, ...f(p) } : p));
    setPhase({ k: "reading", file: file.name, company, page: [0, 0], read: false, at: -1, started: Date.now() });
    let input: DeckInput;
    try {
      input = await readPdf(file, (i, n) => set(() => ({ page: [i, n] })));
    } catch {
      return fail("Scout couldn't open this PDF. If it has a password, save a copy without one and drop that.");
    }
    if (abort.signal.aborted) return;
    set(() => ({ read: true, file: input.file }));
    const res = await fetch("/api/deck", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input), signal: abort.signal }).catch(() => null);
    if (!res) return fail("Scout couldn't reach its server. Check the connection, then try again.");
    if (!res.ok || !res.body) return fail(((await res.json().catch(() => null)) as { error?: string } | null)?.error || "The read didn't start. Try again in a minute.");
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const m = JSON.parse(line) as { at?: number; company?: string; done?: DeckResult; fit?: Fit; match?: { id: number; name: string } | null; error?: string };
          if (m.error) return fail(m.error);
          if (m.done) return setPhase({ k: "result", r: m.done, fit: m.fit || null, match: m.match || null });
          if (m.at !== undefined) set((p) => ({ at: m.at!, company: p.company || m.company || undefined }));
        }
      }
    } catch {
      return fail("The read stopped before it finished. Try again.");
    }
    fail("The read stopped before it finished. Try again.");
  }, []);

  // a deck dropped on another page, or on this one from outside its drop area
  useEffect(() => {
    const take = () => {
      const p = takeHandOff();
      if (p) void run(p.file, p.company);
    };
    take();
    // /deck?sample opens straight on the sample result: a link to show what a read looks like
    if (firm.deck && new URLSearchParams(window.location.search).has("sample")) setPhase({ k: "result", r: firm.deck.sample, fit: sampleFit, match: null });
    window.addEventListener("scout:deck", take);
    return () => {
      window.removeEventListener("scout:deck", take);
      ctl.current?.abort();
    };
  }, [run, sampleFit]);

  if (phase.k === "reading") return <Reading p={phase} />;
  if (phase.k === "result") return <Result r={phase.r} fit={phase.fit} match={phase.match} ueMax={ueMax} again={() => setPhase({ k: "idle" })} />;
  const sample = () => firm.deck && setPhase({ k: "result", r: firm.deck.sample, fit: sampleFit, match: null });
  return (
    <div className="x-deck">
      <nav className="crumb" aria-label="Breadcrumb">
        <span>Deck Screen</span>
      </nav>
      <section className="x-sec" aria-label="Deck Screen">
        <div className="x-sech">
          <h1 className="x-h2">Deck Screen</h1>
        </div>
        <p className="x-thin">
          Drop a pitch deck and Scout reads it the way a partner would, checking each point {firm.short} underwrites, so you walk into the meeting with a first pass already done. It takes about two minutes.
        </p>
        {phase.k === "error" && (
          <p className="x-notrec" role="alert" data-testid="deck-error">
            <b>The deck wasn&apos;t read.</b> {phase.msg}{" "}
            {phase.file && (
              <button type="button" className="x-btn ghost" onClick={() => void run(phase.file!)} title="Read the same deck again">
                Try Again
              </button>
            )}
          </p>
        )}
        {ai ? (
          <DeckDrop big onFile={(f) => void run(f)} />
        ) : (
          <p className="x-notrec" role="note" data-testid="deck-off">
            <b>Reading decks is off today.</b> Deck Screen reads decks with AI, and Scout&apos;s daily check found it off. It turns back on by itself when the check passes.
          </p>
        )}
        {firm.deck && (
          <p className="x-sample">
            <button type="button" className="x-btn ghost" onClick={sample} title={`Show the result for ${firm.deck.sample.company}, a made-up deck`} data-testid="deck-sample">
              See a Sample Result
            </button>
            <span>{firm.deck.sample.company} is made up, to show what a read looks like.</span>
          </p>
        )}
      </section>
    </div>
  );
}

function Reading({ p }: { p: Extract<Phase, { k: "reading" }> }) {
  const steps = deckSteps();
  const done = (key: string) => (key === READ_STEP.key ? p.read : p.read && stepDone(key, p.at, false));
  const n = steps.filter((s) => done(s.key)).length;
  const now = steps.find((s) => !done(s.key))?.key;
  return (
    <div className="x-deck" data-testid="deck-reading">
      <nav className="crumb" aria-label="Breadcrumb">
        <span>Deck Screen</span>
      </nav>
      <section className="x-sec" aria-label="Reading the Deck">
        <div className="x-sech">
          <h1 className="x-h2">{p.company ? `Reading ${possessive(p.company)} Deck` : "Reading the Deck"}</h1>
        </div>
        <p className="x-thin">Scout reads the deck the way a partner would, checking each point {firm.short} underwrites, so you walk into the meeting with a first pass already done.</p>
        <p className="x-thin">{p.file}</p>
        <div className="x-prog" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={n} aria-label="Checks done">
          <i style={{ width: `${(n / steps.length) * 100}%` }} />
        </div>
        <div className="x-progline">
          <span>A first pass takes about 2 minutes</span>
          <span>
            <Clock since={p.started} /> so far
          </span>
        </div>
        <ul className="x-steps">
          {steps.map((s) => (
            <li key={s.key} className={done(s.key) ? "done" : s.key === now ? "now" : "todo"} data-step={s.key}>
              <span className="dot" aria-hidden="true">
                {done(s.key) ? "✓" : ""}
              </span>
              <span>
                <b>{s.label}</b>
                <small>{s.key === READ_STEP.key && !p.read && p.page[1] ? `Reading page ${p.page[0]} of ${p.page[1]}` : s.asks}</small>
              </span>
            </li>
          ))}
        </ul>
      </section>
      <NotSaved />
    </div>
  );
}

/** A check's status: a word with its mark (never a "!"), defined in the key above the table. */
function DeckStatusChip({ s, part }: { s: DeckStatus; part?: boolean }) {
  return (
    <span className={"x-dst " + s} data-md-part={part ? "" : undefined}>
      <i aria-hidden="true" />
      {DECK_STATUS[s].word}
    </span>
  );
}

function Result({ r, fit, match, ueMax, again }: { r: DeckResult; fit: Fit | null; match: { id: number; name: string } | null; ueMax: number; again: () => void }) {
  const ui = useUI();
  const box = useRef<HTMLDivElement>(null);
  // the deck's figures against their references (deckBenchmarks, Sidekick 11-02-26); the note under the ring only when
  // Unit Economics scores them
  const rows = on("unitEconomics") || on("deckBenchmarks") ? ueRows(r.area, null, r.unitEconomics) : [];
  const checks = Object.fromEntries((firm.deck?.screen || []).map((s) => [s.key, s.label]));
  const chips = [r.area ? areaLabel(r.area) : "Outside the Thesis", r.stage, r.sample ? "Sample Deck" : "From a Dropped Deck"].filter(Boolean) as string[];
  return (
    <div className="x-deck" data-testid="deck-result" ref={box}>
      <nav className="crumb" aria-label="Breadcrumb">
        <span>Deck Screen</span>
        <span>›</span>
        <span>{r.company}</span>
      </nav>
      {r.sample ? (
        <section className="x-already" aria-label="Sample Result" data-md="skip">
          <b>Sample Result</b>
          <span>{r.company} is made up, to show what a read looks like. Every figure on it is a sample.</span>
        </section>
      ) : (
        <NotSaved />
      )}
      <header className="x-deal x-deckhead">
        <div className="x-dl">
          <h1 className="x-dname">{r.company}</h1>
          <p className="x-why big">{r.oneLine}.</p>
          <div className="x-tags">
            {chips.map((c) => (
              <span className="x-area" key={c}>
                {c}
              </span>
            ))}
          </div>
          {r.file && <p className="x-thin">{r.file}</p>}
          <div className="x-acts" data-md="skip">
            <button
              type="button"
              className="x-btn site cta"
              data-testid="deck-copy-notes"
              title="Copy the whole result as Markdown, ready for a memo"
              onClick={async () => {
                if (!box.current) return;
                await copyText(sectionMarkdown(box.current, `Deck Screen: ${r.company}`));
                ui.toast("Memo Notes Copied");
              }}
            >
              Copy Memo Notes
            </button>
            <button type="button" className="x-btn ghost" onClick={again} title="Read another deck" data-testid="deck-again">
              Drop Another Deck
            </button>
            {match && (
              <Link className="x-btn ghost" href={`/company/${match.id}`} title={`Open ${match.name} in Scout`}>
                Open {match.name} in Scout
              </Link>
            )}
          </div>
        </div>
        <div className="x-dr x-deckfit" data-md="skip">
          {fit && <FitRing fit={fit.score} name={r.company} size="xl" />}
          <span className="x-flabel">Thesis Fit</span>
          <p className="x-thin">
            Raising <b>{r.raising || "Not in the Deck"}</b>
          </p>
          {fit && on("unitEconomics") && (
            <p className="x-hint" data-testid="deck-fit-note">
              {deckNote(rows, fit, ueMax, r.area)}
            </p>
          )}
        </div>
      </header>
      <section className="x-sec" aria-label="Bottom Line">
        <CopyMd />
        <div className="x-sech">
          <h2 className="x-h2">Bottom Line</h2>
        </div>
        <p className="x-bottomline">{r.bottomLine}</p>
      </section>
      <section className="x-sec" aria-label="The Screen">
        <CopyMd />
        <div className="x-sech">
          <h2 className="x-h2">The Screen</h2>
        </div>
        {/* the Status Table (user's pick, round 7's D, revised in round 9): each word defined above it */}
        <dl className="x-dkey" data-testid="deck-key">
          {(Object.keys(DECK_STATUS) as DeckStatus[]).map((k) => (
            <div key={k}>
              <dt>
                <DeckStatusChip s={k} />
              </dt>
              <dd>{DECK_STATUS[k].means}</dd>
            </div>
          ))}
        </dl>
        <table className="x-dtable" data-testid="deck-table">
          <thead>
            <tr>
              <th>Check</th>
              <th>Status</th>
              <th>Key Figure</th>
              <th>In Brief</th>
            </tr>
          </thead>
          <tbody>
            {r.screen.map((s) => (
              <tr key={s.key}>
                <td className="chk">{checks[s.key] || s.key}</td>
                <td>
                  <DeckStatusChip s={s.status} />
                </td>
                <td className={"fig" + (s.figure ? "" : " none")}>{s.figure || "None Given"}</td>
                <td>{s.text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="x-sec" aria-label="Moat and Open Questions">
        <CopyMd />
        <div className="x-sech">
          <h2 className="x-h2">Moat and Open Questions</h2>
        </div>
        <div className="x-mq">
          <div data-md="kv">
            <h4 data-md-part>Moat Strength</h4>
            <span className={"x-meter " + r.moat.strength} role="img" aria-label={`Moat strength: ${MOAT[r.moat.strength].n} of 4`} title={`Moat strength: ${MOAT[r.moat.strength].n} of 4`}>
              {[0, 1, 2, 3].map((k) => (
                <i key={k} className={k < MOAT[r.moat.strength].n ? "on" : ""} />
              ))}
            </span>
            <b className={"x-moatw " + r.moat.strength} data-md-part>
              {MOAT[r.moat.strength].word}
            </b>
            <p data-md-part>{r.moat.text}</p>
          </div>
          <div data-md="kv">
            <h4 data-md-part>The Vaguest Claim</h4>
            <p className="x-quote" data-md-part>
              {r.vaguestClaim.quote}
            </p>
            <DeckStatusChip s={r.vaguestClaim.status} part />
            <p data-md-part>{r.vaguestClaim.why}</p>
          </div>
          <div data-md="kv">
            <h4 data-md-part>The Question They&apos;d Least Like Asked</h4>
            <p className="x-ask" data-md-part>
              {r.hardestQuestion}
            </p>
          </div>
        </div>
      </section>
      <UnitEconomicsPanel rows={rows} heading={`From the Deck · ${ueHeading(r.area)}`} />
      {r.area && (
        <section className="x-sec x-redflags" aria-label="Red Flags">
          <CopyMd />
          <div className="x-sech">
            <h2 className="x-h2">Red Flags</h2>
            <span className="x-count" data-md="sub">
              (Warning Signs Investors Check in {areaLabel(r.area)})
            </span>
          </div>
          {r.redFlags.length ? (
            <ul className="x-flags">
              {[...r.redFlags]
                .sort((a, b) => SEEN_ORDER[a.seen] - SEEN_ORDER[b.seen])
                .map((f) => (
                  <li key={f.flag} className={"x-flag " + f.seen} data-md="li">
                    <WarnIco />
                    <span className="x-flag-t" data-md-part>
                      {f.flag}
                    </span>
                    <span className="x-flag-st" data-md-part>
                      {SEEN[f.seen]}
                    </span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="x-thin">The read didn&apos;t check this industry&apos;s red flags.</p>
          )}
        </section>
      )}
    </div>
  );
}
