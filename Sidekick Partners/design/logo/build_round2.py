#!/usr/bin/env python3
"""Logo round 2: After Hours (option E) without "Partners", AI SCOUT sized three ways.

user, 10-31-26, picking E: "After Hours - Redesign, as you will be removing partners, and as such, I think the
AI Scout portion will need to be sized appropriately to ensure it looks good."
Writes logo-variations-2.html beside this file. Run: python3 build_round2.py
"""
import json

from build import (CSS, FONTS, FOREST, HERE, JADE, MINT, NIGHT, PALE, arrows, favicon, header, logo, tab)

OUT = HERE / "logo-variations-2.html"

# Measured 10-31-26. Sidekick's logo PNG is 463 units tall; its letters ("S", the "k" ascenders) are 300 units
# tall and the word "Sidekick" is 1585 units wide. Bodoni Moda 600: capitals are 0.77 of the font size, and
# "AI SCOUT" with no letter spacing is 4.90 font sizes wide.
from lockup import CAP, LETTER_SPACING_EM, LETTERS_H, LOGO_H, font_size  # E1, the pick: its one rule

WORD_W, INK_W = 1585, 4.90

SIZINGS = {
    # id: (font size from the logo's height h, letter spacing in em)
    "E1": (font_size, LETTER_SPACING_EM),
    "E2": (lambda h: WORD_W * h / LOGO_H / (INK_W + 7 * 0.24), 0.24),
    "E3": (lambda h: h / CAP, 0.03),
}


def lock(sid, fg, mark, accent, glow, h):
    size, ls = SIZINGS[sid]
    f = size(h)
    shadow = f"0 0 14px 2px {accent}" if glow else "none"
    return (f'<div class="lk2">{logo(fg, h, mark=mark, glow=glow)}'
            f'<span class="r2" style="height:{h}px;background:{accent};box-shadow:{shadow}"></span>'
            f'<span class="n2" style="color:{accent};font-size:{f:.1f}px;letter-spacing:{ls}em;'
            f'margin-right:-{ls}em">AI SCOUT</span></div>')


def header_brand(sid):
    return lock(sid, PALE, MINT, MINT, True, 32)


OPTIONS = [
    ("E1", "Same letter height", "AI SCOUT's capitals are exactly as tall as the letters of \"Sidekick\" and sit on "
     "the same line, so both words share a top and a bottom edge. Spacing tightened so it doesn't run long.",
     "cap-match"),
    ("E2", "Same width", "AI SCOUT is exactly as wide as the word \"Sidekick\", on the same line, keeping the wide "
     "spacing from your pick. Smaller letters, so Sidekick stays the lead.", "width-match"),
    ("E3", "Same height as the whole logo", "AI SCOUT's capitals run from the top of the arrows down to the "
     "line, the full height of Sidekick's logo. The boldest of the three.", "full-height"),
]
REC = "E1"

CSS2 = """
.lk2{display:flex;align-items:baseline;gap:30px}
.r2{display:inline-block;width:2px;border-radius:2px}
.n2{font-family:"Bodoni Moda",Georgia,serif;font-weight:600;line-height:1;white-space:nowrap}
.hdr .lk2{gap:14px}
.bottom{grid-template-columns:1fr}
.rev{justify-items:center}
.ref{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:24px;background:#fff;border:1px solid var(--line);
  border-radius:4px;padding:18px 28px;margin:0 0 40px}
.ref .hero{min-height:0;padding:28px 36px;border-radius:4px}
.ref p{margin:0;color:var(--muted)}
.cmp{border-collapse:collapse;margin:0 0 40px;background:#fff;border:1px solid var(--line)}
.cmp th,.cmp td{padding:10px 18px;border-bottom:1px solid var(--line);text-align:left;white-space:nowrap}
.cmp th{font-weight:600}
"""


def ref_card():
    old = (f'<div class="lkE">{logo(PALE, 64, mark=MINT, glow=True)}'
           f'<span class="e-rule" style="background:{MINT};box-shadow:0 0 14px 2px {MINT}"></span>'
           f'<div class="e-text"><div class="e-name" style="color:{MINT};font-size:31px">AI SCOUT</div>'
           f'<div class="e-sub" style="color:{PALE};font-size:16px">Partners</div></div></div>')
    return (f'<div class="ref"><div class="hero edge" style="background:{NIGHT}">{old}</div>'
            f'<p><b>Your pick, as it was.</b> Each option below drops "Partners" and sizes AI SCOUT a different '
            f'way. The rest is E as you picked it: the glow, the colors, the Bodoni Moda type.</p></div>')


def build():
    cards, mopts, rows = [], [], []
    for sid, name, desc, token in OPTIONS:
        size, ls = SIZINGS[sid]
        rec = " · my pick" if sid == REC else ""
        rows.append(f"<tr><td><b>{sid}</b> · {name}</td><td>{size(104) * CAP:.0f}px</td>"
                    f"<td>{size(32) * CAP:.0f}px</td><td>{ls}em</td></tr>")
        cards.append(f"""
<section class="opt" id="opt-{sid}" data-variation="{sid}">
  <header class="opt-head"><span class="tile">{sid}</span><h2>{name}</h2><span class="tag profile">After Hours{rec}</span>
    <p class="desc">{desc}</p></header>
  <div class="hero edge" style="background:{NIGHT}">{lock(sid, PALE, MINT, MINT, True, 104)}</div>
  <div class="label">In the site header, real size</div>
  <div class="hdr-wrap">{header(NIGHT, PALE, "#1d3a37", header_brand(sid))}</div>
  <div class="bottom">
    <div><div class="label" style="padding-left:0">Reversed</div><div class="rev" style="background:{PALE}">{lock(sid, FOREST, JADE, FOREST, False, 80)}</div></div>
    <div><div class="label" style="padding-left:0">Browser tab icon (unchanged)</div><div class="tabs">{tab(favicon(NIGHT, arrows(22, MINT, MINT, glow=True)), True)}</div></div>
  </div>
</section>""")
        mopts.append({"id": sid, "name": name, "desc": desc, "tokens": {
            "visual": {"bg": NIGHT, "text": PALE, "accent": [MINT], "base": "dark", "saturation": "high",
                       "ornament": "edge light", "fonts": {"display": "bodoni moda"}, "lockup_size": token,
                       "letter_spacing_em": ls}}})

    manifest = {"project": "VC Scout", "subject": "Sidekick Partners AI Scout logo: After Hours sizing",
                "surface": "graphic", "claude_rec": REC, "compares": ["visual.lockup_size"], "options": mopts}
    mjson = json.dumps(manifest, indent=1)
    json.loads(mjson)

    html = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Scout Logo Round 2</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
<style>{CSS}{CSS2}</style>
<script type="application/json" id="variation-manifest">
{mjson}
</script>
</head><body><div class="wrap">
<h1>Sidekick Partners AI Scout · the logo, round 2</h1>
<p class="lede">Design step 2 of 5. You picked E, After Hours, and asked to drop "Partners" and size AI SCOUT so it
looks right. Three ways to size it, each named for what it matches in Sidekick's logo.</p>
<span class="rec">My pick: E1, Same letter height. Both words share a top and a bottom edge, so it reads as one logo.</span>
{ref_card()}
<table class="cmp"><tr><th>Option</th><th>AI SCOUT capitals, large</th><th>In the header</th><th>Letter spacing</th></tr>
{"".join(rows)}</table>
{"".join(cards)}
<footer>Generated by build_round2.py · Sidekick's logo files from sidekickpartners.com (10-31-26) · sample only, not affiliated with Sidekick Partners.</footer>
</div></body></html>
"""
    OUT.write_text(html)
    print(f"wrote {OUT} ({len(html):,} bytes)")


if __name__ == "__main__":
    build()
