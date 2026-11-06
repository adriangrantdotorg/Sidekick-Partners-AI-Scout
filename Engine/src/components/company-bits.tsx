"use client";

import { useState } from "react";
import { Copy, Sparkles } from "lucide-react";
import { useUI } from "./ui";
import { Ago, Clock } from "./Live";
import { AiChip } from "./cards";
import { postJSON, sendJSON } from "@/lib/client";
import { firm } from "@/firm";
import { CopyMd } from "./CopyMd";
import { copyText } from "@/lib/markdown";

type Note = { id: number; body: string; createdAt: string };

export function CompanyNotes({ companyId, name, initial }: { companyId: number; name: string; initial: Note[] }) {
  const ui = useUI();
  const [notes, setNotes] = useState(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  async function add() {
    if (!text.trim() || busy) return;
    setBusy(true);
    const r = await ui.undoable("Note", postJSON<{ note: Note }>("/api/note", { companyId, body: text }), async (r) => {
      const id = r.data!.note.id;
      setNotes((n) => n.filter((x) => x.id !== id));
      await sendJSON("DELETE", "/api/note", { id });
    });
    setBusy(false);
    if (!r.ok) return ui.error("The note didn't save", r.error || "The server did not answer.");
    setNotes((n) => [r.data!.note, ...n]);
    setText("");
    ui.toast("Note Added");
  }
  return (
    <section className="sec" id="notes" aria-label="Team Notes">
      <CopyMd />
      <div className="h">
        <h2>Team Notes</h2>
        <span className="note-h">Everyone sees these</span>
      </div>
      <div className="notes">
        <div className="noteadd" data-md="skip">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.metaKey || e.ctrlKey) && add()}
            placeholder={`Add a note on ${name}`}
            aria-label={`Add a note on ${name}`}
            autoCorrect="off"
            autoCapitalize="off"
            autoComplete="off"
            spellCheck={false}
          />
          <button className="btn" onClick={add} disabled={!text.trim() || busy} title="Save the note for everyone (⌘↩)">
            Add Note
          </button>
        </div>
        {notes.map((n) => (
          <div className="note" key={n.id} data-md="li">
            <span data-md-part>{n.body}</span>
            <div className="who" data-md-part>
              Team note · <Ago date={n.createdAt} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// The memo panel: Draft the Memo, and the draft it writes. No outline is handed out on its own, no download and no copy
// for another AI (user, 11-04-26: "remove the download the Markdown file btn, as it contains elements that are
// incomplete, which is of no value to a prospective investor"). With AI off the panel says so, and nothing else.
export function MemoPanel({ id, name, ai }: { id: number; name: string; ai: boolean }) {
  const ui = useUI();
  const [draft, setDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [since, setSince] = useState<number | null>(null);
  async function aiDraft() {
    setBusy(true);
    setSince(Date.now());
    const r = await postJSON<{ markdown: string }>(`/api/memo/${id}`, {});
    setBusy(false);
    setSince(null);
    if (r.status === 429) return ui.error("Today's AI drafts are used", r.error || "Try again tomorrow.");
    if (!r.ok) return ui.error("The draft didn't come back", r.error || "Try again in a minute.");
    setDraft(r.data!.markdown);
    ui.toast("Draft Ready");
  }
  return (
    <section className="memo" id="memo" aria-label="Draft Investment Memo">
      <h3>
        Draft Investment Memo
        {!ai && <AiChip />}
      </h3>
      {ai ? (
        <p>A first draft of {name}&apos;s memo in {firm.short}&apos;s &quot;{firm.memo.title}&quot; voice, built from what Scout has found. Every data point links to its source, and anything Scout can&apos;t confirm goes to Questions for Founders at the end.</p>
      ) : (
        <p>Drafting is off right now: it needs Scout&apos;s AI, which comes back on with the next daily check.</p>
      )}
      {ai && (
        <div className="row">
          <button className="btn" onClick={aiDraft} disabled={busy} title={`Writes a first draft here in ${firm.short}'s voice`}>
            <Sparkles className="ico" />
            {busy ? (
              <>
                Drafting · <Clock since={since} />
              </>
            ) : (
              "Draft the Memo"
            )}
          </button>
        </div>
      )}
      {draft && (
        <>
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>A first draft for the team to talk through. Give the figures a quick look before it goes further.</p>
          <pre>{draft}</pre>
          {/* Copy the Draft (user, 11-05-26: "do this"): the finished draft only, never the outline, titled so it pastes into a doc or an email */}
          <div className="row">
            <button
              className="btn"
              title="Copies the draft as Markdown, to paste into a doc or an email"
              onClick={async () => {
                await copyText(`# ${firm.memo.title}: ${name}\n\n${draft}\n`);
                ui.toast("Draft Copied");
              }}
            >
              <Copy className="ico" />
              Copy the Draft
            </button>
          </div>
        </>
      )}
    </section>
  );
}
