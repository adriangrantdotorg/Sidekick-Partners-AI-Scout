#!/usr/bin/env python3
"""Design step 3: three whole-page looks for Sidekick Partners AI Scout, on sample data.

Each look draws two whole pages, Today and Company (the Deal Sheet with the three v1 panels), from the same markup;
only the look's colors, type and ornament change. The logo is the pick of record (After Hours E1, ../NOTES.md).
Writes <look>-today.html and <look>-company.html: the bare pages, nothing added.
Run: python3 build.py
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "logo"))
from build import logo  # noqa: E402  Sidekick's real logo, recolored (assets/ holds a copy: off-screen shots read only this folder)
from build_round2 import SIZINGS  # noqa: E402

SAMPLE = '<span class="smp" title="Made-up number for the design">Sample</span>'

# ---------- sample data (made-up startups; real names only for Sidekick's deals, buyers and comps) ----------

IND = {1: "Premium Consumer Brands", 2: "Consumer Health", 3: "E-Commerce Software",
       4: "Vertical SaaS + Embedded Payments", 5: "Tech-Enabled Roll-Ups + AI Services"}

CO = [  # name, industry, fit, raised ($M), one line, new this week
    ("Chairside", 4, 84, 4.1, "Booking, payroll and card payments for independent salons", True),
    ("Cartwise", 3, 78, 2.4, "AI upsell offers for Shopify brands", True),
    ("Ridgepay", 4, 76, 3.0, "Registration and payments for youth sports clubs", False),
    ("Brightbench", 5, 74, 6.5, "Buys dental billing offices and runs them with AI", True),
    ("Crownwell", 1, 71, 3.2, "Premium scalp care, sold online and at Sephora", True),
    ("Shelfwise", 3, 70, 1.8, "Shows brands which stores sell through", False),
    ("Steadfast Health", 2, 69, 5.2, "Menopause care paid for by employers", False),
    ("Olea & Oak", 1, 66, 1.5, "Single-estate olive oil in a refill tin", True),
    ("Parcelpoint", 3, 64, 2.1, "Returns that turn into exchanges for Shopify stores", False),
    ("Tallow Row", 1, 63, 0.9, "Grass-fed tallow skin care", False),
    ("Kinfield", 1, 61, 4.4, "Fresh dog food in a weekly box", False),
    ("Larkspur Labs", 2, 58, 2.7, "Sleep gummies with a 30-day trial", False),
]
MONO = {"Chairside": "#3f8f78", "Cartwise": "#4d7ea8", "Ridgepay": "#8a6d3b", "Brightbench": "#6b5ca5",
        "Crownwell": "#9a5b6f", "Shelfwise": "#4f8a8b", "Steadfast Health": "#7a8c47", "Olea & Oak": "#6f7d3a",
        "Parcelpoint": "#5a6f9a", "Tallow Row": "#a0704a", "Kinfield": "#7d6a4f", "Larkspur Labs": "#5e6aa8"}


def money(m):
    return f"${m:.1f}M"


# ---------- looks ----------

LOOKS = {
    "L1": dict(name="After Hours", tag="Continues your logo", kind="dark",
               desc="The trading floor at night: the logo's dark ground runs through every page, with mint edge "
                    "light on the panels and Bodoni Moda headings.",
               head="Bodoni Moda", headw=600,
               v={"bg": "#0f1f1e", "panel": "#15302d", "panel2": "#1b3a36", "line": "#28504a", "text": "#eaf3f0",
                  "muted": "#a7c3bb", "accent": "#30e1ae", "cta": "#30e1ae", "ctatext": "#0f1f1e",
                  "chip": "#1f4640", "chiptext": "#c9efe2", "hdr": "#0b1716", "warn": "#f0c36b", "ring": "#30e1ae",
                  "ringbg": "#28504a", "edge": "inset 0 1px 0 #30e1ae, inset 0 16px 26px -22px #30e1ae",
                  "rule": "1px solid #28504a", "hfont": '"Bodoni Moda", Georgia, serif'}),
    "L2": dict(name="Park Avenue", tag="Classic", kind="light",
               desc="Sidekick's own light site, dressed like a private bank: ivory paper, forest-green serif "
                    "headings, double hairline rules. The header stays night so the logo reads as picked.",
               head="Libre Baskerville", headw=700,
               v={"bg": "#fbfaf6", "panel": "#ffffff", "panel2": "#f3f6f2", "line": "#e2ded2", "text": "#212121",
                  "muted": "#545b58", "accent": "#1b5d4a", "cta": "#1b5d4a", "ctatext": "#f4f9f8",
                  "chip": "#e7f1ec", "chiptext": "#174d3e", "hdr": "#0f1f1e", "warn": "#8a5a00", "ring": "#1b5d4a",
                  "ringbg": "#e2ded2", "edge": "none", "rule": "3px double #cfc9b8",
                  "hfont": '"Libre Baskerville", Georgia, serif'}),
    "L3": dict(name="Boardroom", tag="Stretch", kind="mixed",
               desc="A partners' boardroom: deep forest walls, cream cards like letter stock, brass rules and "
                    "small capitals. Brass isn't one of Sidekick's colors.",
               head="Cormorant Garamond", headw=600,
               v={"bg": "#123b30", "panel": "#f6f1e4", "panel2": "#efe7d3", "line": "#d9cdb0", "text": "#f3ead6",
                  "muted": "#d8ccad", "accent": "#7a5a1c", "cta": "#c9a45c", "ctatext": "#10261f",
                  "chip": "#e9dfc6", "chiptext": "#5a4214", "hdr": "#0d2c24", "warn": "#8a4b00", "ring": "#1b5d4a",
                  "ringbg": "#d9cdb0", "edge": "inset 0 0 0 1px #c9a45c", "rule": "1px solid #c9a45c",
                  "hfont": '"Cormorant Garamond", Georgia, serif', "ontext": "#f3ead6", "onmuted": "#d8ccad"}),
}
REC = "L2"

FONTS = ("https://fonts.googleapis.com/css2?family=Bodoni+Moda:wght@500;600&family=Cormorant+Garamond:wght@600;700"
         "&family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@400;600;700&display=swap")

NAV = ["Today", "Pipeline", "IC Meeting", "Trends", "Tracking", "Backtest", "Funding ▾"]


def brand():
    f = SIZINGS["E1"][0](30)
    svg = logo("#f4f9f8", 30, mark="#30e1ae", glow=True)
    return (f'<a class="brand" href="#">{svg}<span class="brule"></span>'
            f'<span class="bname" style="font-size:{f:.1f}px">AI SCOUT</span></a>')


def header(look, page):
    items = "".join(f'<a class="{"on" if n == page else ""}" href="#">{n}</a>' for n in NAV)
    return (f'<header class="top"><div class="in">{brand()}<nav>{items}</nav>'
            f'<span class="search">Search ⌘K</span></div></header>')


def ring(fit, size=64):
    r = 26
    c = 2 * 3.14159 * r
    return (f'<span class="ring" style="width:{size}px;height:{size}px"><svg viewBox="0 0 64 64" width="{size}" '
            f'height="{size}"><circle cx="32" cy="32" r="{r}" class="rb"/><circle cx="32" cy="32" r="{r}" class="rf" '
            f'stroke-dasharray="{c * fit / 100:.1f} {c:.1f}" transform="rotate(-90 32 32)"/></svg>'
            f'<b>{fit}%</b></span>')


def mono(name, big=False):
    initials = "".join(w[0] for w in name.replace("&", "").split()[:2])
    cls = "mono big" if big else "mono"
    return f'<span class="{cls}" style="background:{MONO[name]}">{initials}</span>'


def footer():
    return ('<footer class="foot"><div class="in"><span>Sidekick Partners AI Scout · An independent prototype by '
            'the user. Not affiliated with or endorsed by Sidekick Partners.</span>'
            f'<span>Design sample: startups are made up; every made-up number says {SAMPLE}</span></div></footer>')


def today(look):
    must = CO[0]
    short = "".join(
        f'<tr><td class="rk">{i + 1}</td><td><a href="#">{mono(c[0])}<span>{c[0]}</span></a></td>'
        f'<td>{IND[c[1]]}</td><td class="num">{c[2]}%</td><td class="num">{money(c[3])} {SAMPLE}</td></tr>'
        for i, c in enumerate(CO[:10]))
    cards = "".join(
        f'<article class="card"><div class="art" style="--m:{MONO[c[0]]}">{mono(c[0], True)}{ring(c[2], 54)}'
        f'{"<span class=new>New</span>" if c[5] else ""}</div><div class="cb"><h4>{c[0]}</h4>'
        f'<p class="line">{c[4]}</p><p class="meta"><span class="chip">{IND[c[1]]}</span></p>'
        f'<p class="raised">Funds Raised <b>{money(c[3])}</b> {SAMPLE}</p>'
        f'<a class="btn cta sm" href="#">Visit Website</a></div></article>'
        for c in CO[1:9])
    body = f"""
<section class="start"><div><h2>Start Here</h2>
<p>Scout reads public funding news, SEC filings and trade press every morning, and ranks startups by how well they
fit Sidekick's thesis. Today's three best picks: <b>Chairside</b>, <b>Cartwise</b> and <b>Ridgepay</b>.</p></div>
<div class="acts"><a class="btn cta" href="#">Open the IC Brief</a><a class="btn ghost" href="#">Dismiss</a></div></section>

<section class="must"><div class="mustart" style="--m:{MONO[must[0]]}">{mono(must[0], True)}</div>
<div class="mustbody"><p class="kicker">Must See · The Highest-Fit Startup Recently in the News</p>
<h1>{must[0]}</h1><p class="lede">{must[4]}.</p>
<p class="meta"><span class="chip">{IND[must[1]]}</span><span class="chip">Seed</span><span class="chip">Dallas</span></p>
<p class="news">Raised a {money(must[3])} seed round {SAMPLE} · 10-28-26</p>
<div class="acts"><a class="btn cta" href="#">Visit Website</a><a class="btn ghost" href="#">Track</a></div></div>
<div class="mustfit">{ring(must[2], 120)}<span>Thesis Fit</span><p class="raised">Funds Raised<br><b>{money(must[3])}</b> {SAMPLE}</p></div></section>

<section class="block"><h2>Shortlist <small>Top 10 Startups by Thesis Fit · Updated Daily</small></h2>
<table class="short"><thead><tr><th></th><th>Startup</th><th>Industry</th><th class="num">Fit</th><th class="num">Funds Raised</th></tr></thead>
<tbody>{short}</tbody></table></section>

<section class="block"><h2>On the Radar <small>Every Startup Inside the Thesis</small></h2>
<div class="filters"><span class="dd">Funds Raised ▾</span><span class="dd">Industry ▾</span><span class="dd">Fit ▾</span><span class="count">8 of 142 startups {SAMPLE}</span></div>
<div class="grid">{cards}</div><div class="more"><a class="btn ghost" href="#">Show More</a></div></section>"""
    return page(look, "Today", body)


# The deck drop area's words, everywhere it appears (user, 10-31-26: "replace with: We'll crunch the numbers to see
# how they align. No data is saved on our servers.").
DROP_COPY = ('<span>We\'ll crunch the numbers to see how they align.</span>'
             '<span class="notsaved">No data is saved on our servers.</span>')


def company(look):
    c = CO[4]
    ue = [
        ("Price and Revenue", [
            ("Gross Margin", "About 62%", "est", "Estimate: shelf price vs. the category's usual cost",
             "DTC 50-60%, up to 70%", "thumb"),
            ("Contribution Margin", "Unknown", "unk", "", "Median 48% · great 50%+", "ok"),
            ("Retail Reach", "410 Sephora doors", "est", f"Estimate: Sephora launch news {SAMPLE}",
             "No public benchmark", "none")]),
        ("Cost to Win a Customer", [
            ("CAC", "Unknown", "unk", "", "Median $54 · great $15 · warning above $84", "ok")]),
        ("What a Customer Is Worth", [
            ("LTV:CAC", "Unknown", "unk", "", "Median 2.4x · great 3x+", "ok"),
            ("90-Day Repeat Purchase", "Has a subscribe option", "est", "Weak signal: subscribe option on the site",
             "Median 14.7% · great 25%+", "ok")]),
        ("Months to Pay Back", [
            ("CAC Payback", "Unknown", "unk", "", "No public benchmark for brands", "none")]),
    ]
    status = {"ok": "Verified", "thumb": "Rule of Thumb", "none": ""}
    blocks = ""
    for title, lines in ue:
        rows = ""
        for name, val, kind, note, ref, st in lines:
            stl = f'<span class="st {st}">{status[st]}</span>' if status[st] else ""
            rows += (f'<div class="uel"><span class="uen">{name}</span><span class="uev {kind}">{val}</span>'
                     f'<span class="uer">{ref} {stl}</span>{f"<span class=uenote>{note}</span>" if note else ""}</div>')
        blocks += f'<div class="ueb"><h4>{title}</h4>{rows}</div>'
    score = [("Thesis Fit", 27, 30), ("Stage and Check", 20, 20), ("Unit Economics", 0, 20),
             ("Signal Strength", 12, 15), ("Team", 7, 10), ("Geography", 5, 5)]
    bars = "".join(f'<div class="bar"><span>{n}</span><i><b style="width:{g / m * 100:.0f}%"></b></i>'
                   f'<em>{g} of {m}</em></div>' for n, g, m in score)
    similar = "".join(f'<a class="simrow" href="#">{mono(s[0])}<span><b>{s[0]}</b><br><small>{s[4]}</small></span>'
                      f'<em>{s[2]}%</em></a>' for s in (CO[7], CO[9], CO[10]))
    body = f"""
<p class="crumb"><a href="#">Pipeline</a> › {c[0]}</p>
<section class="deal"><div class="dealart" style="--m:{MONO[c[0]]}">{mono(c[0], True)}</div>
<div class="dealbody"><h1>{c[0]}</h1><p class="lede">{c[4]}.</p>
<p class="meta"><span class="chip">Industry 1 · {IND[1]}</span><span class="chip">Seed</span><span class="chip">New York</span><span class="new">New</span></p>
<div class="acts"><a class="btn cta" href="#">Visit Website</a><a class="btn ghost" href="#">Track</a><a class="btn ghost" href="#">Draft Memo</a></div></div>
<div class="dealfit">{ring(c[2], 120)}<span>Thesis Fit</span><p class="raised">Funds Raised<br><b>{money(c[3])}</b> {SAMPLE}</p></div></section>

<section class="already"><b>Buyer Already Invested</b><span>Unilever Ventures backed Crownwell's seed round {SAMPLE},
so Unilever leads its likely buyers. Unilever Ventures held 13.2% of Nutrafol before Unilever bought a majority (05-31-22).</span></section>

<div class="two">
<section class="block"><h2>Why It Fits</h2>
<p class="why">A premium take on a tired aisle, like Touchland: scalp care sold as a daily ritual, at a price the drugstore
brands don't reach, already on Sephora's shelves.</p>
<div class="bars">{bars}</div>
<p class="note">Unit Economics: no line is known yet, so it scores 0 of 20. An unknown line costs nothing.</p></section>

<section class="block drop"><h2>Deck Screen</h2><div class="dropzone"><b>Drop Crownwell's Pitch Deck</b>
{DROP_COPY}</div></section>
</div>

<section class="block"><h2>Unit Economics <small>Industry 1 · {IND[1]} · References From 2025-26</small></h2>
<div class="ue">{blocks}</div></section>

<section class="block"><h2>Likely Acquirers <small>Strategic Buyers and What They Paid</small></h2>
<table class="acq"><thead><tr><th>Buyer</th><th>Venture Arm</th><th>What They Bought</th><th class="num">Price</th><th>Multiple</th></tr></thead><tbody>
<tr class="lead"><td><b>Unilever</b></td><td>Unilever Ventures · <span class="inv">Already Invested</span></td><td>Grüns (04-09-26)</td><td class="num">About $1.2B</td><td>About 4x sales <span class="st thumb">Reported</span></td></tr>
<tr class="lead"><td></td><td></td><td>Dr. Squatch (06-25)</td><td class="num">$1.5B</td><td>Not published <span class="st thumb">Reported</span></td></tr>
<tr><td><b>Church &amp; Dwight</b></td><td>None found</td><td>Touchland (05-12-25)</td><td class="num">$700M + earn-out</td><td>5.4x sales · 12.7x EBITDA <span class="st ok">Verified</span></td></tr>
</tbody></table>
<p class="note">75% of 2025's venture-backed acquisitions came after only a Series A (PitchBook-NVCA, Q3 2025).</p></section>

<div class="two">
<section class="block"><h2>Funds Raised History</h2>
<div class="hist"><p><b>Seed · {money(c[3])}</b> {SAMPLE}<br><small>09-26 · Unilever Ventures {SAMPLE}</small></p>
<p><b>Pre-Seed · $0.8M</b> {SAMPLE}<br><small>2025 · angels {SAMPLE}</small></p></div></section>
<section class="block"><h2>Similar in the Pipeline</h2>{similar}</section>
</div>
<section class="block"><h2>Team Notes</h2><p class="empty">No notes yet. Notes the team writes here stay with this company.</p></section>"""
    return page(look, "Pipeline", body)


# Copy as Markdown (user, 10-31-26: "on hover of a section, that sections text can be copied in markdown format. the
# tooltip should state that as well"). One button per content section, written here as static HTML; copy-markdown.js
# gives it behavior. Sections with nothing worth copying (a drop area, a loading state) carry "nocopy" or "drop".
COPY_JS = (HERE / "copy-markdown.js").read_text()
COPY_BTN = ('<button class="mdcopy" type="button" aria-label="Copy this section as Markdown" '
            'data-tip="Copy this section as Markdown"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">'
            '<rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/>'
            '<path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" '
            'stroke-width="1.8"/></svg></button>')


def copy_buttons(body):
    import re
    return re.sub(r'(<section class="block(?![^"]*\b(?:nocopy|drop)\b)[^"]*">)', lambda m: m.group(1) + COPY_BTN, body)


def page(look, nav_on, body, title=None):
    L = LOOKS[look]
    v = L["v"]
    css_vars = ";".join(f"--{k}:{val}" for k, val in v.items() if k not in ("hfont",))
    title = title or ("Today" if nav_on == "Today" else "Crownwell")
    kind = "today" if nav_on == "Today" else "company"
    man = ""
    if look in STRIP:
        r = ROUNDS[STRIP[look]]
        if r["manifest"] and look == r["options"][0][0] and kind == "today":
            man = f'<script type="application/json" id="variation-manifest">\n{json.dumps(r["manifest"], indent=1)}\n</script>'
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} · Sidekick Partners AI Scout</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
<style>:root{{{css_vars};--hfont:{v["hfont"]};--hw:{L["headw"]}}}{CSS}{EXTRA.get(look, "")}</style>{man}</head>
<body class="look-{look}" data-variation="{look}">{header(look, nav_on)}<main class="in">{copy_buttons(body)}</main>{footer()}
<div class="mdtoast" role="status" aria-live="polite">✅ Copied as Markdown</div>
<script>{COPY_JS}</script></body></html>"""


CSS = """
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:18px/1.55 "Source Sans 3",system-ui,sans-serif}
a{color:inherit;text-decoration:none}
.in{max-width:1320px;margin:0 auto;padding:0 40px}
main.in{padding-top:32px;padding-bottom:56px}
.top{background:var(--hdr);border-bottom:1px solid #1d3a37}
.top .in{display:flex;align-items:center;gap:28px;height:76px}
.brand{display:flex;align-items:baseline;gap:13px;white-space:nowrap}
.brule{width:2px;height:30px;background:#30e1ae;box-shadow:0 0 10px 1px #30e1ae;border-radius:2px;align-self:center}
.bname{font-family:"Bodoni Moda",Georgia,serif;font-weight:600;color:#30e1ae;letter-spacing:.05em;line-height:1}
.top nav{display:flex;gap:24px;margin-left:auto;font-weight:600;color:#eaf3f0;white-space:nowrap}
.top nav a{padding:6px 0;border-bottom:2px solid transparent}
.top nav a.on{border-bottom-color:#30e1ae;color:#ffffff}
.search{border:1px solid #2f5a54;color:#bcd5ce;border-radius:4px;padding:6px 12px;font-size:16px;white-space:nowrap}
h1,h2,h4{font-family:var(--hfont);font-weight:var(--hw);margin:0}
h2{font-size:30px;line-height:1.2;padding-bottom:12px;margin-bottom:20px;border-bottom:var(--rule)}
h2 small{font-family:"Source Sans 3",sans-serif;font-weight:600;font-size:17px;color:var(--muted);margin-left:10px}
.block,.start,.must,.deal,.already{background:var(--panel);border:1px solid var(--line);border-radius:4px;box-shadow:var(--edge);padding:28px 32px;margin:0 0 28px}
.smp{display:inline-block;font:700 12px/1 "Source Sans 3",sans-serif;letter-spacing:.06em;text-transform:uppercase;padding:3px 6px;border-radius:3px;border:1px dashed var(--muted);color:var(--muted);vertical-align:middle}
.btn{display:inline-flex;align-items:center;min-height:42px;padding:0 20px;border-radius:4px;font-weight:700;white-space:nowrap}
.btn.cta{background:var(--cta);color:var(--ctatext)}
.btn.ghost{border:1px solid var(--line);color:var(--text);background:transparent}
.btn.sm{min-height:38px;padding:0 14px;font-size:16px}
.acts{display:flex;gap:12px;flex-wrap:wrap}
.chip{display:inline-block;background:var(--chip);color:var(--chiptext);border-radius:4px;padding:3px 10px;font-size:16px;font-weight:600;margin:0 8px 6px 0}
.new{display:inline-block;background:var(--accent);color:var(--bg);font-size:14px;font-weight:700;padding:2px 9px;border-radius:999px}
.look-L2 .new{color:#fff}.look-L3 .new{background:#1b5d4a;color:#f3ead6}
.ring{position:relative;display:inline-grid;place-items:center;flex:none}
.ring svg{position:absolute;inset:0}
.ring .rb{fill:none;stroke:var(--ringbg);stroke-width:6}
.ring .rf{fill:none;stroke:var(--ring);stroke-width:6;stroke-linecap:round}
.ring b{position:relative;font-weight:700;font-size:17px}
.mono{display:inline-grid;place-items:center;width:36px;height:36px;border-radius:4px;color:#fff;font-weight:700;font-size:15px;flex:none}
.mono.big{width:96px;height:96px;font-size:36px;font-family:var(--hfont)}
/* Start Here */
.start{display:flex;gap:32px;align-items:center;justify-content:space-between}
.start h2{border:0;padding:0;margin:0 0 6px;font-size:26px}
.start p{margin:0;max-width:820px;color:var(--muted)}
.start b{color:var(--text)}
/* Must See */
.must{display:grid;grid-template-columns:220px 1fr 220px;gap:36px;align-items:center}
.mustart,.dealart{height:200px;border-radius:4px;display:grid;place-items:center;background:linear-gradient(135deg,var(--m),#0f1f1e)}
.kicker{margin:0 0 6px;font-weight:700;color:var(--accent);font-size:16px;letter-spacing:.04em}
.must h1,.deal h1{font-size:52px;line-height:1.05;margin-bottom:8px}
.lede{margin:0 0 12px;font-size:20px;color:var(--muted)}
.news{margin:4px 0 16px;color:var(--muted)}
.mustfit,.dealfit{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center}
.mustfit span,.dealfit span{font-weight:700;color:var(--muted);font-size:16px}
.mustfit .ring b,.dealfit .ring b{font-size:30px}
.raised{margin:6px 0 0;color:var(--muted);font-size:16px}
.raised b{color:var(--text);font-size:22px}
/* Shortlist */
table{width:100%;border-collapse:collapse}
th{text-align:left;font-size:16px;color:var(--muted);font-weight:700;padding:8px 12px;border-bottom:1px solid var(--line);white-space:nowrap}
td{padding:10px 12px;border-bottom:1px solid var(--line)}
td a{display:flex;align-items:center;gap:12px;font-weight:700}
.num{text-align:right;white-space:nowrap}
.rk{color:var(--muted);width:40px}
/* Radar */
.filters{display:flex;gap:12px;align-items:center;margin:0 0 20px;flex-wrap:wrap}
.dd{border:1px solid var(--line);border-radius:4px;padding:7px 14px;font-weight:600}
.count{margin-left:auto;color:var(--muted)}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
.card{border:1px solid var(--line);border-radius:4px;overflow:hidden;background:var(--panel2);display:flex;flex-direction:column}
.art{position:relative;height:150px;display:grid;place-items:center;background:linear-gradient(135deg,var(--m),#0f1f1e)}
.art .ring{position:absolute;right:10px;top:10px;background:rgba(15,31,30,.82);border-radius:50%;color:#eaf3f0}
.art .ring .rb{stroke:#36524d}.art .ring .rf{stroke:#30e1ae}
.art .new{position:absolute;left:10px;top:10px}
.cb{padding:16px 18px 18px;display:flex;flex-direction:column;gap:6px;flex:1}
.cb h4{font-size:24px}
.cb .line{margin:0;color:var(--muted);font-size:17px;line-height:1.4}
.cb .meta{margin:4px 0 0}
.cb .raised{margin:0 0 8px}
.cb .btn{align-self:flex-start;margin-top:auto}
.more{text-align:center;margin-top:24px}
/* Company */
.crumb{margin:0 0 16px;color:var(--muted)}
.deal{display:grid;grid-template-columns:220px 1fr 220px;gap:36px;align-items:center}
.already{display:flex;gap:18px;align-items:baseline;border-left:4px solid var(--accent)}
.already b{white-space:nowrap;color:var(--accent);font-size:20px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:28px}
.why{margin:0 0 18px}
.bars{display:flex;flex-direction:column;gap:10px}
.bar{display:grid;grid-template-columns:170px 1fr 80px;gap:12px;align-items:center}
.bar i{height:10px;background:var(--ringbg);border-radius:5px;overflow:hidden}
.bar i b{display:block;height:100%;background:var(--ring)}
.bar em{font-style:normal;color:var(--muted);text-align:right;white-space:nowrap}
.note{margin:16px 0 0;color:var(--muted);font-size:17px}
.dropzone{border:2px dashed var(--line);border-radius:4px;padding:28px;display:flex;flex-direction:column;gap:10px;text-align:center}
.dropzone b{font-size:22px}
.dropzone span{color:var(--muted)}
.notsaved{font-weight:700;color:var(--warn)!important}
.ue{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.ueb{border:1px solid var(--line);border-radius:4px;padding:16px;background:var(--panel2)}
.ueb h4{font-size:20px;margin-bottom:10px}
.uel{display:flex;flex-direction:column;padding:10px 0;border-top:1px solid var(--line)}
.uen{font-weight:700}
.uev{font-size:20px;font-weight:700}
.uev.unk{color:var(--muted);font-weight:600}
.uev.est::after{content:" · estimate";font-size:15px;font-weight:600;color:var(--muted)}
.uer,.uenote{font-size:16px;color:var(--muted)}
.st{display:inline-block;font-size:13px;font-weight:700;padding:1px 7px;border-radius:3px;margin-left:4px;white-space:nowrap}
.st.ok{background:var(--chip);color:var(--chiptext)}
.st.thumb{border:1px solid var(--line);color:var(--muted)}
.acq .lead td{background:var(--panel2)}
.inv{font-weight:700;color:var(--accent)}
.hist p{margin:0 0 14px}
.hist small,.simrow small{color:var(--muted);font-size:16px}
.simrow{display:flex;align-items:center;gap:14px;padding:10px 0;border-top:1px solid var(--line)}
.simrow em{margin-left:auto;font-style:normal;font-weight:700}
.empty{color:var(--muted);margin:0}
.foot{border-top:1px solid var(--line);padding:22px 0 40px;color:var(--muted);font-size:16px}
/* Copy as Markdown */
.block{position:relative}
.block>h2{padding-right:56px}
.mdcopy{position:absolute;top:20px;right:20px;width:40px;height:40px;border-radius:4px;border:1px solid var(--line);background:var(--panel);
 color:var(--muted);display:grid;place-items:center;cursor:pointer;opacity:0;transition:opacity .18s;z-index:2;padding:0}
.block:hover>.mdcopy,.mdcopy:focus-visible{opacity:1}
.mdcopy:hover{color:var(--text);border-color:var(--accent)}
.mdcopy::after{content:attr(data-tip);position:absolute;right:0;top:calc(100% + 8px);white-space:nowrap;background:#10261f;color:#f3ead6;
 font:600 15px/1.2 "Source Sans 3",sans-serif;padding:7px 10px;border-radius:4px;opacity:0;pointer-events:none;transition:opacity .15s}
.mdcopy:hover::after,.mdcopy:focus-visible::after{opacity:1}
.mdtoast{position:fixed;top:20px;right:20px;z-index:50;background:#10261f;color:#f3ead6;border:1px solid #c9a45c;border-radius:4px;
 padding:10px 14px;font:600 17px "Source Sans 3",sans-serif;opacity:0;transform:translateY(-6px);transition:opacity .18s,transform .18s;pointer-events:none}
.mdtoast.on{opacity:1;transform:none}
@media (prefers-reduced-motion: reduce){.mdcopy,.mdcopy::after,.mdtoast{transition:none}}
.foot .in{display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap}
"""

EXTRA = {
    # Boardroom: forest walls, cream cards; words that sit on the wall itself use the light set.
    "L3": """
.block,.start,.must,.deal,.already{--text:#1d2622;--muted:#4f564f;color:var(--text)}
.crumb,.foot{color:var(--onmuted)}.crumb a{color:var(--ontext)}
.foot{border-top-color:#2c5a4b}
h2{font-variant:small-caps;letter-spacing:.04em;font-size:32px}
.kicker{font-variant:small-caps;letter-spacing:.08em;font-size:18px}
.btn.cta{box-shadow:inset 0 0 0 1px #10261f,inset 0 0 0 2px #c9a45c}
.smp{border-color:#8a7a55;color:#5a4f37}
.foot .smp{border-color:#d8ccad;color:#d8ccad}
""",
    "L2": """
.must h1,.deal h1{color:#1b5d4a}
h2{color:#1b5d4a}
""",
}


MANIFEST_TOKENS = {
    "L1": {"visual": {"bg": "#0f1f1e", "text": "#eaf3f0", "accent": ["#30e1ae"], "base": "dark", "saturation": "high",
                      "ornament": "edge light", "radius": 4, "fonts": {"display": "bodoni moda", "body": "source sans 3"},
                      "layout": "tiles + shortlist + deal sheet"}},
    "L2": {"visual": {"bg": "#fbfaf6", "text": "#212121", "accent": ["#1b5d4a"], "base": "light", "saturation": "low",
                      "ornament": "double hairline rules", "radius": 4,
                      "fonts": {"display": "libre baskerville", "body": "source sans 3"},
                      "layout": "tiles + shortlist + deal sheet"}},
    "L3": {"visual": {"bg": "#123b30", "text": "#1d2622", "accent": ["#c9a45c"], "base": "mixed", "saturation": "low",
                      "ornament": "brass rules, small caps", "radius": 4,
                      "fonts": {"display": "cormorant garamond", "body": "source sans 3"},
                      "layout": "tiles + shortlist + deal sheet"}},
}



# A design round is the bare real pages, one per option, nothing added: no strip, no labels, no frames, no
# screenshots (user, 10-31-26: "I'm still seeing screenshots", then of the switcher strip: "never include these top
# frames"). Each option's pages open as tabs of one new Chrome window (`open-pages`); the chat says which tab is which.
STRIP = {}   # look id -> its round key (the manifest lives in the first option's Today page, invisible)
ROUNDS = {}  # round key -> title, options [(id, name, desc)], status, manifest


def add_round(key, title, label, options, status, manifest=None, ref=None):
    ROUNDS[key] = dict(title=title, label=label, options=options, status=status, manifest=manifest)
    for oid, _, _ in options:
        STRIP[oid] = key


# His casing standard for labels: Courtside Scout's titleCase() (src/lib/format.ts); every word capitalized except
# these, unless first. "remember my casing preference" (user, 10-31-26).
SMALL = {"and", "for", "of", "the", "a", "an", "to", "in", "on", "at", "with", "or", "by"}
LABELS = (r'<(h2|h4|th|dt)\b[^>]*>(.*?)</\1>', r'<span class="(?:uen|st [^"]*|chip|kicker|dd)"[^>]*>(.*?)</span>',
          r'<(?:a|button) class="btn[^"]*"[^>]*>(.*?)</(?:a|button)>', r'<b class="lbl">(.*?)</b>')


def not_title_case(html):
    import re
    bad = []
    for pat in LABELS:
        for m in re.finditer(pat, html, re.S):
            label = re.sub(r"<[^>]+>", " ", m.group(m.lastindex)).replace("&amp;", "&")
            for part in re.split(r"[·:]", label):
                words = [w.strip("()\"'“”,.") for w in part.split()]
                words = [w for w in words if w and w[0].isalpha()]
                for i, w in enumerate(words):
                    if w[0].islower() and not (i > 0 and w.lower() in SMALL):
                        bad.append(f"{label.strip()!r} ({w})")
                        break
    return sorted(set(bad))


def bare(html, name):
    """Guards: a design page is the bare page (nothing above the site's own header), and labels are Title Case."""
    import re
    # a page cut from the LIVE site opens with invisible parts before its header (a hidden div, a zero-size icon sheet,
    # two wrappers): those are the site's own, never an added strip (11-04-26, the Backtest round)
    live = r'(?:<div hidden="">.*?</div>)?(?:<svg width="0" height="0"[^>]*>.*?</svg>)?(?:<div id="app-root"><div class="app">)?'
    if not re.search(r'<body[^>]*>\s*' + live + r'\s*<header class="top">', html, re.S):
        raise SystemExit(f"❌ {name}: something sits above the site header. Design pages carry nothing added: "
                         f"no strip, label or frame (user, 10-31-26: \"never include these top frames\").")
    bad = not_title_case(html)
    if bad:
        raise SystemExit(f"❌ {name}: labels must be Title Case (his standard; small words: {', '.join(sorted(SMALL))}):\n  "
                         + "\n  ".join(bad))
    return html


def build_pages(looks):
    for lid in looks:
        (HERE / f"{lid}-today.html").write_text(bare(today(lid), f"{lid}-today"))
        (HERE / f"{lid}-company.html").write_text(bare(company(lid), f"{lid}-company"))
    print("wrote", " ".join(f"{lid}-today.html {lid}-company.html" for lid in looks))


ROUND1 = ["L1", "L2", "L3"]
add_round("r1", "Design step 3 · round 1", "Look", [(i, LOOKS[i]["name"], LOOKS[i]["desc"]) for i in ROUND1],
          "✅ Picked: L3 Boardroom (10-31-26)",
          {"project": "VC Scout", "subject": "Sidekick Partners AI Scout: page look", "surface": "theme",
           "claude_rec": REC, "compares": ["visual.base", "visual.accent", "visual.ornament", "visual.font.display"],
           "options": [{"id": i, "name": LOOKS[i]["name"], "desc": LOOKS[i]["desc"], "tokens": MANIFEST_TOKENS[i]}
                       for i in ROUND1]})

if __name__ == "__main__":
    build_pages(ROUND1)
