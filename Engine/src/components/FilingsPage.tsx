import { filingRows } from "@/lib/queries";
import { FilingTable } from "./rows";
import { RowFilter } from "./ListHead";
import { AREA_LABEL, titleCase } from "@/lib/format";
import { filingsDrops, rollUpNote } from "@/lib/funding-pages";
import { NAMES } from "@/firm";

/** Form D and Form C filings inside the thesis, at the firm's own address (PATHS.filings). */
export async function FilingsPage() {
  const rows = await filingRows();
  const areas = Object.entries(AREA_LABEL).map(([key, label]) => ({ key, label, n: rows.filter((r) => r.thesisArea === key).length }));
  return (
    <div>
      <div className="ph">
        <h1>{titleCase(NAMES.filings)}</h1>
        <span className="count">{rows.length} Form D and Form C filings inside the thesis</span>
      </div>
      <p className="ph-lede">
        Every day Scout reads the SEC&apos;s daily filing index, drops {filingsDrops()}, and keeps the companies inside the thesis by industry group, name, website and keyword rules. &quot;Before any
        press&quot; means a news search finds nothing on the name yet.{rollUpNote()}
      </p>
      <RowFilter placeholder="Search filings" areas={areas} target="#filings" />
      <div className="list" id="filings">
        <FilingTable rows={rows} />
      </div>
    </div>
  );
}
