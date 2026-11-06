// The v1 panels (Plan section 5): Unit Economics and Likely Acquirers, and the Buyer Already Invested line. Plain
// components: the company page renders them on the server, the Deck Screen result in the browser.
import { BUILDER, builderFirst } from "@/firm";
import { areaLabel } from "@/lib/format";
import { REF_LABEL, UE_BLOCKS, type UeRow } from "@/lib/unit-economics";
import { dealDate, type Acquirer } from "@/lib/acquirers";
import type { ExitNote } from "@/firm";
import { CopyMd } from "./CopyMd";

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

/** The panel of a company's Unit Economics lines, block by block; nothing when its industry has no lines. */
export function UnitEconomicsPanel({ rows, heading, fyi = [] }: { rows: UeRow[]; heading: string; fyi?: { text: string; url?: string }[] }) {
  if (!rows.length) return null;
  return (
    <section className="x-sec x-ue" aria-label="Unit Economics" data-testid="ue-panel">
      <CopyMd />
      <div className="x-sech">
        <h2 className="x-h2">Unit Economics</h2>
        <span className="x-count" data-md="sub">
          {heading}
        </span>
      </div>
      <div className="x-ueg">
        {UE_BLOCKS.filter(([b]) => rows.some((r) => r.block === b)).map(([b, label]) => (
          <div className="x-ueb" key={b}>
            <h4>{label}</h4>
            {rows
              .filter((r) => r.block === b)
              .map((r) => (
                <div
                  className="x-uel"
                  key={r.key}
                  data-md="kv"
                  data-kind={r.kind}
                  title={`Reference: ${r.ref}`}
                  data-md-text={`**${r.label}:** ${r.value}${r.note ? ` (${r.note.toLowerCase()}${r.earns ? ", past its reference" : ""})` : ""} · ${r.ref}${r.source ? ` · [${r.source.name}](${r.source.url})` : ""}${REF_LABEL[r.status] ? ` (${REF_LABEL[r.status]})` : ""}`}
                >
                  <span className="x-uen">{r.label}</span>
                  <span className={"x-uev " + r.kind}>
                    {r.value}
                    {r.kind === "est" && <em className="x-uetag">Estimate</em>}
                    {r.earns && <em className="x-uetag on">Past Its Reference</em>}
                    {r.below && <em className="x-uetag off">Below Its Reference</em>}
                    {/* a deck's figure shows the benchmark it is set against; the company page keeps it for the hover */}
                    {r.kind === "deck" && r.status !== "none" && <small className="x-ueref">Benchmark: {r.ref}</small>}
                  </span>
                  {REF_LABEL[r.status] &&
                    (r.source ? (
                      <a className={"x-st " + r.status} href={r.source.url} {...ext} title={`${r.ref} · opens ${r.source.name} in a new window`}>
                        {REF_LABEL[r.status]}
                      </a>
                    ) : (
                      <span className={"x-st " + r.status} title={r.ref}>
                        {REF_LABEL[r.status]}
                      </span>
                    ))}
                </div>
              ))}
          </div>
        ))}
      </div>
      {fyi.map((f, i) => (
        <p className="x-uefyi" key={i}>
          {f.url ? (
            <a href={f.url} {...ext} title="Opens the source in a new window">
              {f.text}
            </a>
          ) : (
            f.text
          )}
        </p>
      ))}
    </section>
  );
}

/** The strategic buyers in a company's industry and what they paid; the one already invested leads. */
export function LikelyAcquirersPanel({ area, buyers, also, notes }: { area: string | null; buyers: Acquirer[]; also: string[]; notes: ExitNote[] }) {
  const industry = areaLabel(area) || "this industry";
  return (
    <section className="x-sec x-acq" aria-label="Likely Acquirers" data-testid="acq-panel">
      <CopyMd />
      <div className="x-sech">
        <h2 className="x-h2">Likely Acquirers</h2>
        <span className="x-count" data-md="sub">
          Strategic Buyers and What They Paid
        </span>
      </div>
      {buyers.length ? (
        <div className="x-tscroll">
        <table className="x-acqt">
          <thead>
            <tr>
              <th>Buyer</th>
              <th>Venture Arm</th>
              <th>What They Bought</th>
              <th>Price</th>
              <th>Multiple</th>
            </tr>
          </thead>
          <tbody>
            {buyers.flatMap((b) =>
              (b.deals.length ? b.deals : [null]).map((d, i) => (
                <tr key={`${b.name}-${i}`} className={b.invested ? "lead" : ""}>
                  <td>{i === 0 && <b>{b.name}</b>}</td>
                  <td>
                    {i === 0 &&
                      (b.arm ? (
                        <>
                          <a href={b.arm.proof} {...ext} title={`Opens the proof for ${b.arm.name} in a new window`}>
                            {b.arm.name}
                          </a>
                          {b.invested && (
                            <span className="x-st inv" data-md="tag">
                              Already Invested
                            </span>
                          )}
                        </>
                      ) : (
                        "None Found"
                      ))}
                  </td>
                  <td>
                    {d ? (
                      <>
                        <a href={d.url} {...ext} title={`Opens the source on ${d.company} in a new window`}>
                          {d.company}
                        </a>{" "}
                        ({dealDate(d.date)})
                      </>
                    ) : (
                      "No Deal Loaded Yet"
                    )}
                  </td>
                  <td>
                    {d && (
                      <>
                        {d.price}
                        <a className={"x-st " + (d.verified ? "verified" : "reported")} data-md="tag" href={d.url} {...ext} title={d.verified ? "From a primary source: opens it in a new window" : "Reported in the press: opens the report in a new window"}>
                          {d.verified ? "Verified" : "Reported"}
                        </a>
                      </>
                    )}
                  </td>
                  <td>{d && (d.multiple || <span title="No multiple was published for this deal">—</span>)}</td>
                </tr>
              )),
            )}
          </tbody>
        </table>
        </div>
      ) : (
        <p className="x-thin" data-md="text">
          No checked deals yet for {industry}, so Scout names no buyers rather than guess.
        </p>
      )}
      {also.length > 0 && (
        <p className="x-thin" data-md="text">
          Also buying in {industry}, no deal loaded yet: {also.join(", ")}.
        </p>
      )}
      {notes.map((n, i) => (
        <p className="x-exitnote" key={i}>
          <a href={n.url} {...ext} title="Opens the source in a new window">
            {n.text}
          </a>
        </p>
      ))}
    </section>
  );
}

/** "Unilever Ventures backed Crownwell, so Unilever leads its likely buyers." */
export function BuyerInvested({ company, buyer }: { company: string; buyer: Acquirer }) {
  if (!buyer.arm) return null;
  return (
    <section className="x-already" aria-label="Buyer Already Invested" data-testid="buyer-invested">
      <b>Buyer Already Invested</b>
      <span>
        {buyer.arm.name} backed {company}, so {buyer.name} leads its likely buyers.{" "}
        {buyer.arm.story && (
          <a href={buyer.arm.proof} {...ext} title="Opens the source in a new window">
            {buyer.arm.story}
          </a>
        )}
      </span>
    </section>
  );
}

/** The deck drop area's words, everywhere it appears (user, 10-31-26). */
export const DROP_WORDS = ["We'll crunch the numbers to see how they align.", "No data is saved on our servers."];

/** The Not Saved notice on a deck being read and on its result (user, 10-30-26). */
export function NotSaved() {
  return (
    <section className="x-already x-notsaved" aria-label="Not Saved" data-md="skip">
      <b>Not Saved</b>
      <span>You&apos;re viewing a prototype, so this result disappears when you leave the page. Saving comes in Phase II{BUILDER.name ? `, once ${builderFirst()} joins the team` : ""}.</span>
    </section>
  );
}
