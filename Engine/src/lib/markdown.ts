// Copy as Markdown (user, 10-31-26: "on hover of a section, that sections text can be copied in markdown format"): a
// section of the page, as the reader sees it, turned into Markdown. Headings → ##, tables → Markdown tables, term
// lists → **Term:** text, rows marked data-md="li" → one bullet each (its data-md-text when it has one; data-md="kv":
// its first part in bold). Buttons, icons and anything marked data-md="skip" stay out; a status chip (data-md="tag")
// reads "(Verified)". Browser only.

const SKIP = "button, svg, img, input, textarea, select, script, style, .x-mdcopy, [data-md=skip], [hidden]";

/** An element's words on one line: links keep their address, a tag reads "(Verified)". */
export function inline(el: Element): string {
  const c = el.cloneNode(true) as Element;
  c.querySelectorAll(SKIP).forEach((n) => n.remove());
  c.querySelectorAll("[data-md=tag]").forEach((n) => (n.textContent = n.textContent?.trim() ? ` (${n.textContent.trim()})` : ""));
  c.querySelectorAll("a[href^='http']").forEach((a) => (a.textContent = `[${(a.textContent || "").trim()}](${a.getAttribute("href")})`));
  c.querySelectorAll("br").forEach((n) => n.replaceWith(" · "));
  return (c.textContent || "").replace(/\s+/g, " ").replace(/\s+([,.;:)])/g, "$1").trim();
}

const cells = (tr: Element) => Array.from(tr.children).map((td) => inline(td).replace(/\|/g, "\\|"));

const partsOf = (el: Element) =>
  Array.from(el.querySelectorAll("[data-md-part]"))
    .filter((p) => !p.closest(SKIP))
    .map(inline)
    .filter(Boolean);

/** A row of parts: its data-md-part children joined with " · ", else all its words. */
function parts(el: Element): string {
  const ps = partsOf(el);
  return ps.length ? ps.join(" · ") : inline(el);
}

function walk(el: Element, out: string[]) {
  for (const n of Array.from(el.children)) {
    if (n.matches(SKIP)) continue;
    const tag = n.tagName;
    if (/^H[1-3]$/.test(tag)) out.push(`## ${inline(n)}`);
    else if (/^H[4-6]$/.test(tag)) out.push(`### ${inline(n)}`);
    else if (n.getAttribute("data-md") === "sub") out.push(`_${inline(n).replace(/^\((.*)\)$/, "$1")}_`);
    else if (n.getAttribute("data-md") === "li") out.push(`- ${n.getAttribute("data-md-text") || parts(n)}`);
    else if (n.getAttribute("data-md") === "kv") {
      const [k, ...rest] = partsOf(n);
      out.push(n.getAttribute("data-md-text") ? `- ${n.getAttribute("data-md-text")}` : `- **${k}:** ${rest.join(" · ")}`);
    }
    else if (n.getAttribute("data-md") === "text") out.push(inline(n));
    else if (tag === "TABLE") {
      const head = n.querySelector("thead tr");
      const rows = Array.from(n.querySelectorAll("tbody tr"));
      const lines: string[] = [];
      if (head) {
        const h = cells(head);
        lines.push(`| ${h.join(" | ")} |`, `|${h.map(() => "---").join("|")}|`);
      }
      rows.forEach((r) => lines.push(`| ${cells(r).join(" | ")} |`));
      out.push(lines.join("\n"));
    } else if (tag === "DL") n.querySelectorAll("dt").forEach((dt) => out.push(`- **${inline(dt)}:** ${dt.nextElementSibling ? inline(dt.nextElementSibling) : ""}`));
    else if (tag === "UL" || tag === "OL") Array.from(n.children).forEach((li) => !li.matches(SKIP) && out.push(`- ${parts(li)}`));
    else if (tag === "P" || tag === "BLOCKQUOTE") {
      const t = inline(n);
      if (t) out.push(t);
    } else walk(n, out);
  }
}

/** The section's Markdown: bullets stay together, everything else is a paragraph apart. */
export function sectionMarkdown(section: Element, title?: string, lead?: string): string {
  const out: string[] = [];
  if (title) out.push(`## ${title}`);
  if (lead) out.push(lead);
  walk(section, out);
  return out.reduce((acc, chunk, i) => acc + (i === 0 ? "" : /^- /.test(chunk) && /(^|\n)- [^\n]*$/.test(out[i - 1]) ? "\n" : "\n\n") + chunk, "");
}

/** Puts text on the clipboard, with the old copy command where the clipboard isn't allowed (an http page). */
export async function copyText(text: string): Promise<void> {
  (window as { __lastCopied?: string }).__lastCopied = text;
  try {
    if (navigator.clipboard && window.isSecureContext) return await navigator.clipboard.writeText(text);
  } catch {
    /* fall through to the old way */
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  ta.remove();
}
