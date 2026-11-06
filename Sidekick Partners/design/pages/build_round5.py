#!/usr/bin/env python3
"""The company page and the Pipeline, four ways each (user, 11-02-26, after his review note Throwaway/Sidekick Scout
Feedback.md: "incorporate feedback then show me 4 variations of company pages and 4 variations of pipeline pages").

Every option is a bare page in the site's own chrome: the top bar, ticker, footer and stylesheet are cut from the
running test site (with the review's fixes in), and the test site's made-up startups fill them (Crownwell for the
company page). Option A is the site as it is now (the company page with charted Unit Economics); B to D change the
main area. The review's Unit Economics ask ("way too many numbers, not enough visuals") is answered four ways.
Writes R5-<A..D>-company.html and R5-<A..D>-pipeline.html. Run with the test site up on :4702: python3 build_round5.py
"""
import datetime as dt
import json
import re
import shutil
import subprocess

from build_new_badge import FONTS, HERE, live_css, title_case_ok

SITE = "http://localhost:4702"
NOW = dt.datetime.now()
SAMPLE_NOTE = "Made-up startups from the test site; buyers, deals and references are real."


def fetch(path: str) -> str:
    """The page as the browser draws it: the Pipeline renders client-side, and live times fill in."""
    engine = HERE.parent.parent.parent / "Engine"
    r = subprocess.run(["node", str(HERE / "render_dom.mjs"), SITE + path], cwd=engine, capture_output=True, text=True, timeout=120)
    if r.returncode:
        raise SystemExit(r.stderr[-800:])
    return r.stdout


def grab(html: str, start_pat: str, tag: str) -> str:
    """The whole element that starts at start_pat, matching nested tags of the same name."""
    i = html.index(start_pat)
    i = html.rindex("<" + tag, 0, i + 1) if not html[i:].startswith("<") else i
    depth, j = 0, i
    open_re, close = re.compile(r"<" + tag + r"[\s>]"), "</" + tag + ">"
    while True:
        o = open_re.search(html, j)
        c = html.index(close, j)
        if o and o.start() < c:
            depth += 1
            j = o.end()
        else:
            depth -= 1
            j = c + len(close)
            if depth == 0:
                return html[i:j]


def days_ago(stamp: str) -> int:
    t = dt.datetime.strptime(stamp, "%m-%d-%y %I:%M %p")
    return max(0, (NOW - t).days)


def fill_times(html: str) -> str:
    """The live times are drawn in the browser; a page with no script fills them in now."""
    def found(m):
        d = days_ago(m.group(2))
        return m.group(1) + ("Today" if d < 1 else f"{d} day{'s' if d != 1 else ''} ago") + "</span>"
    html = re.sub(r'(Found <span class="live-v l"[^>]*title="([^"]+)"[^>]*>)</span>', found, html)
    html = re.sub(r'(<span class="live-v l"[^>]*title="([^"]+)"[^>]*>)</span>', lambda m: m.group(1) + f"{days_ago(m.group(2))}d ago</span>", html)
    return html


def clean(html: str) -> str:
    html = re.sub(r"<script\b.*?</script>", "", html, flags=re.S)
    html = re.sub(r'src="/_next/static/media/brand-logo[^"]*"', 'src="assets/sk-logo.svg"', html)
    html = re.sub(r'<img alt="" class="x-logo([^"]*)" src="https://www\.google\.com/s2/favicons[^"]*" loading="lazy"/>', lambda m: f'<span class="x-logo{m.group(1)} mono">C</span>', html)
    return fill_times(html.replace("<!-- -->", ""))


def chrome(html: str):
    top = grab(html, '<header class="top"', "header")
    ticker = grab(html, '<div class="ticker"', "div")
    foot = grab(html, '<footer class="foot"', "footer")
    return top, ticker, foot


def page(title: str, oid: str, top: str, ticker: str, main: str, foot: str, css: str, manifest=None) -> str:
    man = f'<script type="application/json" id="variation-manifest">\n{json.dumps(manifest, indent=1)}\n</script>' if manifest else ""
    return f"""<!doctype html>
<html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} · Sidekick Partners AI Scout</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}"><link rel="stylesheet" href="assets/live-scout.css"><style>{BASE_CSS}{css}</style>{man}</head>
<body data-variation="{oid}"><div class="app">{top}{ticker}<main id="main">{main}</main>{foot}</div></body></html>"""


BASE_CSS = """
.v5 a{color:inherit}
.ue2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 28px}
.ue2-line{display:grid;gap:8px;padding:12px 0;border-top:1px solid var(--border)}
.ue2-head{display:flex;align-items:baseline;gap:12px}
.ue2-head b{font:700 17px/1.2 var(--font-body);color:var(--heading)}
.ue2-head .v{font:600 16px/1.2 var(--font-body);color:var(--text-3);margin-left:auto}
.ue2-head .v.est{color:var(--forest)}
.ue2-head .x-st{margin-left:6px}
.ue2-chart{position:relative;height:36px}
.ue2-chart .u2-tr{position:absolute;left:0;right:0;top:6px;height:8px;border-radius:4px;background:#e6dcc4}
.ue2-chart .u2-band{position:absolute;top:6px;height:8px;border-radius:4px;background:linear-gradient(90deg,#2a866d,#1b5d4a)}
.ue2-chart .u2-warn{position:absolute;top:6px;height:8px;border-radius:4px;background:repeating-linear-gradient(135deg,#b4533a 0 4px,#e6dcc4 4px 8px)}
.ue2-chart .u2-tk{position:absolute;top:2px;width:3px;height:16px;margin-left:-1px;border-radius:1px;background:#c9a45c;box-shadow:0 0 0 1px #7a5a1c}
.ue2-chart .u2-lb{position:absolute;top:22px;transform:translateX(-50%);font:600 13px/1 var(--font-body);color:#4f564f;white-space:nowrap}
.ue2-chart .u2-lb.end{transform:translateX(-100%)}
.ue2-chart.none .u2-tr{background:repeating-linear-gradient(90deg,#e6dcc4 0 6px,transparent 6px 10px)}
.ue2-chart.none .u2-lb{left:0;transform:none}
.ue2-foot{display:flex;align-items:center;gap:16px;margin-top:16px;color:var(--text-3)}
.ue2-foot .x-btn{min-height:40px}
/* the cream card's dark ink for anything these pages add (the theme's card list doesn't know them) */
.pv-row,.pv-card,.pv-table,.dc-kpi,.bv-rail .x-kpanel{--text:#1d2622;--text-2:#2f3833;--text-3:#4f564f;--heading:#1d2622;--border:#d9cdb0;--surface:#efe7d3;--elevated:#e6dcc4;color:#1d2622}
.pv-row a[href^="http"],.pv-table a[href^="http"],.dc-kpi a{color:#7a5a1c !important;text-decoration:underline dotted 1px;text-underline-offset:3px}
.pv-mono{display:grid;place-items:center;border-radius:4px;color:#fff;font:700 18px/1 var(--font-head);flex:none}
"""

# Crownwell, Industry 1 (Sidekick Partners/unit-economics.ts): each line's scale for the picture, from its reference
UE = [  # label, value, kind, status, source, scale(min,max,unit), band(lo,hi) good area, median, warn(lo,hi), lower_better
    ("Gross Margin", "Unknown", "unk", "Rule of Thumb", None, (0, 100, "%"), (50, 70), None, None),
    ("Contribution Margin", "Unknown", "unk", "Verified", "https://useamp.com/blog/2025-dtc-mega-report/", (0, 80, "%"), (48, 80), 48, None),
    ("CAC", "Unknown", "unk", "Verified", "https://useamp.com/blog/2025-dtc-mega-report/", (0, 120, "$"), (0, 54), 54, (84, 120)),
    ("LTV:CAC", "Unknown", "unk", "Verified", "https://useamp.com/blog/2025-dtc-mega-report/", (0, 5, "x"), (2.4, 5), 2.4, None),
    ("90-Day Repeat Purchase", "Subscribe option", "est", "Verified", "https://useamp.com/blog/2025-dtc-mega-report/", (0, 40, "%"), (14.7, 40), 14.7, (0, 10)),
    ("Retail Reach", "Sephora", "est", "", None, None, None, None, None),
    ("CAC Payback", "Unknown", "unk", "", None, None, None, None, None),
]


def fmt(v, unit):
    if unit == "%":
        return f"{v:g}%"
    if unit == "$":
        return f"${v:g}"
    return f"{v:g}x"


def ue_line(label, value, kind, status, src, scale, band, median, warn):
    st = ""
    if status:
        cls = "verified" if status == "Verified" else "thumb"
        st = f'<a class="x-st {cls}" href="{src}" target="_blank" rel="noopener noreferrer">{status}</a>' if src else f'<span class="x-st {cls}">{status}</span>'
    if not scale:
        chart = '<div class="ue2-chart none"><span class="u2-tr"></span><span class="u2-lb">No reference bar yet</span></div>'
    else:
        lo, hi, unit = scale
        p = lambda v: (v - lo) / (hi - lo) * 100
        parts = ['<span class="u2-tr"></span>']
        if warn:
            parts.append(f'<span class="u2-warn" style="left:{p(warn[0]):.1f}%;width:{p(warn[1]) - p(warn[0]):.1f}%"></span>')
        parts.append(f'<span class="u2-band" style="left:{p(band[0]):.1f}%;width:{p(band[1]) - p(band[0]):.1f}%"></span>')
        if median is not None:
            end = " end" if p(median) > 85 else ""
            parts.append(f'<span class="u2-tk" style="left:{p(median):.1f}%"></span><span class="u2-lb{end}" style="left:{p(median):.1f}%">Median {fmt(median, unit)}</span>')
        else:
            parts.append(f'<span class="u2-lb" style="left:{(p(band[0]) + p(band[1])) / 2:.1f}%">Good: {fmt(band[0], unit)} to {fmt(band[1], unit)}</span>')
        chart = f'<div class="ue2-chart">{"".join(parts)}</div>'
    return f'<div class="ue2-line"><div class="ue2-head"><b>{label}</b><span class="v {kind}">{value}</span>{st}</div>{chart}</div>'


def ue_section(cols=2, heading="Unit Economics"):
    lines = "".join(ue_line(*u) for u in UE)
    return (f'<section class="x-sec x-ue" aria-label="Unit Economics"><div class="x-sech"><h2 class="x-h2">{heading}</h2>'
            '<span class="x-count">Industry 1 · Premium Consumer Brands · Green Is Good, Rust Is a Warning, the Brass Tick Is the Median</span></div>'
            f'<div class="ue2" style="grid-template-columns:repeat({cols},minmax(0,1fr))">{lines}</div>'
            '<div class="ue2-foot"><span>2 of 7 lines known, both estimates. A deck fills in the rest.</span>'
            '<a class="x-btn ghost" href="#deck-screen">Drop a Deck</a></div></section>')


# ---------- the company page ----------
CO_OPTIONS = [
    ("A", "Ledger With Charts", "On-profile", "Today's page with the review's fixes; Unit Economics turns into charts: each line a bar of what good looks like, the startup's mark on it, numbers only at the median."),
    ("B", "Brief and Rail", "Calm", "The story on the left (why it fits, the buyer, the charts, the buyers), the numbers in a rail on the right that stays as you scroll."),
    ("C", "Dashboard", "Stretch", "Four headline tiles first (fit, funds, unit economics, likely buyer), then charts: Unit Economics on bars, the buyers' deals as a bar chart of what they paid."),
    ("D", "Dossier", "Editorial", "One column like a memo: numbered sections, Unit Economics as a checklist of what's known, the buyers' deals as a timeline."),
]

DEALS = [  # buyer, company, date, price $B, label, verified, url
    ("PepsiCo", "Poppi", "05-19-25", 1.95, "$1.95B", True, "https://www.pepsico.com/newsroom/press-releases/2025/pepsico-completes-acquisition-of-poppi-accelerating-strategic-portfolio-transformation"),
    ("Unilever", "Dr. Squatch", "06-25", 1.5, "$1.5B", False, "https://cosmeticsbusiness.com/unilever-to-pay-1-5-billion-for-men-s-grooming"),
    ("Unilever", "Grüns", "04-09-26", 1.2, "About $1.2B", False, "https://www.unilever.com/news/press-and-media/press-releases/2026/unilever-to-acquire-us-greens-supplement-company-gruns/"),
    ("PepsiCo", "Siete Foods", "10-01-24", 1.2, "$1.2B", True, "https://www.pepsico.com/newsroom/press-releases/2024/pepsico-to-acquire-siete-foods-for-1-2-billion"),
    ("Refresco", "SunOpta", "05-01-26", 1.2, "About $1.2B", False, "https://www.capstonepartners.com/insights/article-beverage-market-update/"),
    ("Church & Dwight", "Touchland", "05-12-25", 0.7, "$700M + earn-out", True, "https://investor.churchdwight.com/Investors/news/news-details/2025/Church--Dwight-to-Acquire-the-Touchland-Brand-for-700-million-Plus-Earn-out/default.aspx"),
]


def deal_bars():
    rows = "".join(
        f'<a class="db-row{" lead" if b == "Unilever" else ""}" href="{u}" target="_blank" rel="noopener noreferrer">'
        f'<span class="db-who"><b>{c}</b><small>{b} · {d}</small></span><span class="db-bar"><i style="width:{p / 1.95 * 100:.0f}%"></i></span>'
        f'<span class="db-amt">{lab}<em class="x-st {"verified" if v else "reported"}">{"Verified" if v else "Reported"}</em></span></a>'
        for b, c, d, p, lab, v, u in DEALS)
    return (f'<section class="x-sec" aria-label="Likely Acquirers"><div class="x-sech"><h2 class="x-h2">Likely Acquirers</h2>'
            '<span class="x-count">What Buyers in Premium Consumer Brands Paid · Unilever Leads: Its Venture Arm Backed Crownwell</span></div>'
            f'<div class="db">{rows}</div><p class="x-exitnote"><a href="https://nvca.org/wp-content/uploads/2025/10/Q3-2025-PitchBook-NVCA-Venture-Monitor.pdf" target="_blank" rel="noopener noreferrer">'
            "75% of 2025's venture-backed acquisitions came after only a Series A (PitchBook-NVCA, Q3 2025).</a></p></section>")


def deal_timeline():
    items = sorted(DEALS, key=lambda d: d[2][-2:] + d[2][:2])
    rows = "".join(f'<li><span class="tl-date">{d}</span><span class="tl-dot"></span><a href="{u}" target="_blank" rel="noopener noreferrer"><b>{b}</b> bought <b>{c}</b></a> · {lab}'
                   f' <em class="x-st {"verified" if v else "reported"}">{"Verified" if v else "Reported"}</em></li>' for b, c, d, p, lab, v, u in items)
    return f'<ol class="tl">{rows}</ol>'


CO_CSS = {
    "A": "",
    "B": """
main .bv-grid{display:grid;grid-template-columns:minmax(0,1fr) 400px;gap:28px;margin:0 40px}
main .bv-grid .x-sec,main .bv-grid .x-already,main .bv-grid .x-rounds{margin:0 0 28px}
.bv-rail{position:sticky;top:96px;align-self:start;display:grid;gap:20px}
.bv-rail .x-kpanel{background:var(--card);box-shadow:inset 0 0 0 1px var(--brass),0 0 0 1px rgba(48,225,174,.28),0 26px 60px -30px rgba(48,225,174,.55);--text:#1d2622;--text-2:#2f3833;--text-3:#4f564f;--heading:#1d2622;--border:#d9cdb0;color:var(--text)}
.bv-rail .x-latest{background:transparent;border:0;padding:0}
.bv-grid .dbody{margin:0 0 28px;grid-template-columns:minmax(0,1fr)}
.bv-head{padding:28px 32px}
.bv-head .x-dname{margin:0 0 8px}
.bv-head .x-why{font-size:20px;color:var(--text-2);margin:14px 0 18px}
""",
    "C": """
.dc-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px;margin:0 40px 28px}
.dc-kpi{background:var(--card);border-radius:4px;padding:20px 22px;box-shadow:inset 0 0 0 1px var(--brass),0 0 0 1px rgba(48,225,174,.28),0 26px 60px -30px rgba(48,225,174,.55);color:#1d2622;display:grid;gap:6px;align-content:start}
.dc-kpi span{font:700 15px/1.2 var(--font-body);color:#4f564f}
.dc-kpi b{font:600 44px/1 var(--font-head);color:#1d2622}
.dc-kpi small{font:600 15px/1.3 var(--font-body);color:#4f564f}
.dc-kpi .mini{height:8px;border-radius:4px;background:#e6dcc4;overflow:hidden}.dc-kpi .mini i{display:block;height:100%;background:#1b5d4a}
.dc-head{display:flex;align-items:center;gap:20px;margin:24px 40px 18px;color:#f3ead6}
.dc-head h1{font:600 52px/1 var(--font-head);margin:0;color:#fff}
.dc-head .x-meta{color:#d8ccad}
.dc-head .x-meta *{color:#d8ccad !important;background:none !important;border-color:#d8ccad66 !important}
.dc-head .x-meta a{color:#30e1ae !important}
.dc-head .x-meta > .x-area:first-child{color:#8ee6c8 !important}.dc-head .x-meta > .x-inv{color:#e3c27e !important}
.db{display:grid;gap:10px}
.db-row{display:grid;grid-template-columns:240px minmax(0,1fr) 220px;align-items:center;gap:16px;padding:8px 0;text-decoration:none !important}
.db-row.lead .db-who b{color:#7a5a1c}
.db-who{display:grid}.db-who b{font:700 17px/1.2 var(--font-body);color:#1d2622}.db-who small{font-size:14px;color:#4f564f}
.db-bar{height:16px;border-radius:4px;background:#e6dcc4;overflow:hidden}.db-bar i{display:block;height:100%;background:linear-gradient(90deg,#c9a45c,#7a5a1c)}
.db-amt{font:700 16px/1.2 var(--font-body);color:#1d2622;display:flex;gap:8px;align-items:center}
""",
    "D": """
main .dd-col{max-width:920px;margin:0 auto;padding:0 0 40px}
main .dd-col .x-sec,main .dd-col .x-already,main .dd-col .x-rounds{margin:0 0 28px}
.dd-col .dbody{margin:0 0 28px;grid-template-columns:minmax(0,1fr)}
.dd-num{font:600 18px/1 var(--font-head);color:#7a5a1c;letter-spacing:.08em !important;margin-right:14px}
.dd-check{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.dd-check li{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:12px;align-items:baseline;padding:8px 0;border-top:1px solid #d9cdb0}
.dd-check .ic{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font:700 13px/1 var(--font-body);border:2px dashed #4f564f;color:#4f564f}
.dd-check .ic.ok{border:0;background:#1b5d4a;color:#f6f1e4}
.dd-check b{font:700 17px/1.2 var(--font-body)}.dd-check small{display:block;font-size:15px;color:#4f564f}
.dd-meter{display:flex;align-items:center;gap:14px;margin:4px 0 16px;color:#4f564f}
.dd-meter i{flex:1;height:10px;border-radius:5px;background:#e6dcc4;overflow:hidden}.dd-meter i b{display:block;height:100%;width:28%;background:#1b5d4a}
.tl{list-style:none;margin:0;padding:0 0 0 8px;border-left:2px solid #d9cdb0;display:grid;gap:14px}
.tl li{position:relative;padding-left:22px;font-size:17px}
.tl .tl-dot{position:absolute;left:-7px;top:6px;width:12px;height:12px;border-radius:50%;background:#c9a45c}
.tl .tl-date{display:block;font:700 14px/1.2 var(--font-body);color:#4f564f}
.tl a{text-decoration:none !important;color:#1d2622 !important}
""",
}


def company_pages():
    html = clean(fetch("/company/4"))
    top, ticker, foot = chrome(html)
    main = grab(html, '<main id="main">', "main")[len('<main id="main">'):-len("</main>")]
    crumb = grab(main, '<nav class="crumb"', "nav")
    deal = grab(main, '<header class="x-deal"', "header")
    fitp = grab(main, '<section class="x-kpanel fitp"', "section")
    fundp = grab(main, '<section class="x-kpanel fundp"', "section")
    buyer = grab(main, 'aria-label="Buyer Already Invested"', "section")
    deck = grab(main, 'aria-label="Deck Screen"', "section")
    ue_old = grab(main, 'data-testid="ue-panel"', "section")
    acq = grab(main, 'data-testid="acq-panel"', "section")
    hist = grab(main, 'aria-label="Funds Raised History"', "section")
    # Team Notes (and the memo beside it) sit in the page's two-column body: take the whole body so they stay cards
    notes = grab(main[main.rindex('<div class="dbody">', 0, main.index('aria-label="Team Notes"')):], '<div class="dbody">', "div")
    memo = grab(main, 'id="memo"', "section")
    latest = grab(main, '<div class="x-latest"', "div")
    meta = grab(deal, '<div class="x-tags x-meta"', "div")
    why = re.search(r'<p class="x-why big">.*?</p>', deal).group(0)
    acts = grab(deal, '<div class="x-acts"', "div")
    rest = main[main.index(acq) + len(acq):]
    out = {}
    # A: the page as it is, with charted Unit Economics
    out["A"] = main.replace(ue_old, ue_section())
    # B: the story left, the numbers in a rail right
    head = f'<section class="x-sec bv-head" aria-label="Crownwell"><h1 class="x-dname">Crownwell</h1>{meta}{why}{acts}</section>'
    left = head + buyer + ue_section(cols=1) + acq + hist + notes
    rail = f'<div class="bv-rail">{fitp}{fundp}<section class="x-kpanel" aria-label="Latest">{latest}</section>{deck}</div>'
    out["B"] = crumb + f'<div class="bv-grid"><div>{left}</div>{rail}</div>'
    # C: headline tiles, then charts
    kpis = ('<div class="dc-kpis">'
            '<div class="dc-kpi"><span>Thesis Fit</span><b>71%</b><small>Strong across the board</small></div>'
            '<div class="dc-kpi"><span>Funds Raised</span><b>$3.2M</b><small>Seed · <a href="https://news.example.com/crownwell" target="_blank" rel="noopener noreferrer">1 source</a></small></div>'
            '<div class="dc-kpi"><span>Unit Economics</span><b>0 of 20</b><div class="mini"><i style="width:0%"></i></div><small><a href="#deck-screen">Drop a deck</a> to score it</small></div>'
            '<div class="dc-kpi"><span>Likely Buyer</span><b>Unilever</b><small>Its venture arm backed Crownwell</small></div></div>')
    dhead = f'<div class="dc-head"><h1>Crownwell</h1>{meta}</div>'
    out["C"] = crumb + dhead + kpis + ue_section(cols=3, heading="Unit Economics") + deal_bars() + deck + hist + notes
    # D: one column, numbered, a checklist and a timeline
    def sec(n, title, body, label=None):
        return (f'<section class="x-sec" aria-label="{label or title}"><div class="x-sech"><h2 class="x-h2"><span class="dd-num">{n:02d}</span>{title}</h2></div>{body}</section>')
    check = ('<div class="dd-meter"><span>2 of 7 known</span><i><b></b></i><a href="#deck-screen">Drop a deck</a></div><ul class="dd-check">'
             + "".join(f'<li><span class="ic{" ok" if k == "est" else ""}">{"✓" if k == "est" else "?"}</span><span><b>{l}</b><small>{v if k == "est" else "Unknown"}</small></span>'
                       + (f'<a class="x-st {"verified" if s == "Verified" else "thumb"}" href="{u}" target="_blank" rel="noopener noreferrer">{s}</a>' if u else (f'<span class="x-st thumb">{s}</span>' if s else "<span></span>"))
                       + "</li>" for l, v, k, s, u, *_ in UE) + "</ul>")
    company = f'{meta}{why}{acts}'
    funding = re.sub(r">Funds Raised History</h2>", '><span class="dd-num">05</span>Funding</h2>', hist, count=1)
    assert funding != hist, "the Funds Raised History heading moved"
    body = (sec(1, "Crownwell", company) + buyer + sec(2, "Why It Fits", fitp.replace('class="x-kpanel fitp"', 'class="x-kpanel fitp dd-plain"'))
            + sec(3, "Unit Economics", check) + sec(4, "Exit Path", deal_timeline(), "Likely Acquirers") + deck + funding + notes)
    out["D"] = crumb + f'<div class="dd-col">{body}</div>'
    return top, ticker, foot, out


# ---------- the Pipeline ----------
PI_OPTIONS = [
    ("A", "Picture Rows", "On-profile", "Today's Pipeline with the review's fixes: the title and filters on a cream card, a row per startup with its picture."),
    ("B", "Compact Ledger", "Dense", "No pictures: one cream line per startup with its fit, industry, found date, funds and actions, so twice as many fit on a screen."),
    ("C", "Card Grid", "Stretch", "Three cards across, picture on top, fit on the picture, the essentials below: a board you scan by eye."),
    ("D", "Fit Table", "Analytical", "A table like the Shortlist for every startup: a fit bar per row, found date, funds and latest signal in columns."),
]

PIPE = [  # name, industry, fit, funds, stage, line, found days, signal days, color
    ("Chairside", "Vertical SaaS + Embedded Payments", 84, "$4.1M", "Seed", "Booking, payroll and card payments for independent salons and spas.", 3, 2, "#3f8f78"),
    ("Cartwise", "E-Commerce Software", 78, "$2.4M", "Seed", "AI upsell offers for Shopify brands.", 4, 3, "#4d7ea8"),
    ("Brightbench", "Tech-Enabled Roll-Ups + AI Services", 74, "$6.5M", "Series A", "Buys dental billing offices and runs them with AI.", 5, 4, "#6b5ca5"),
    ("Crownwell", "Premium Consumer Brands", 71, "$3.2M", "Seed", "Premium scalp care sold online and at Sephora.", 6, 5, "#9a5b6f"),
    ("Steadfast Health", "Consumer Health", 69, "$5.2M", "Seed", "Menopause care paid for by employers.", 7, 6, "#7a8c47"),
    ("Olea & Oak", "Premium Consumer Brands", 66, "$1.5M", "Seed", "Single-estate olive oil in a refill tin.", 9, 8, "#6f7d3a"),
]


def ring(fit, size=56):
    r, c = 22, 2 * 3.14159 * 22
    return (f'<span class="pv-ring" style="width:{size}px;height:{size}px"><svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="{r}" class="rb"/>'
            f'<circle cx="28" cy="28" r="{r}" class="rf" stroke-dasharray="{c * fit / 100:.1f} {c:.1f}" transform="rotate(-90 28 28)"/></svg><b>{fit}%</b></span>')


def days(n):
    return "Today" if n < 1 else f"{n} day{'s' if n != 1 else ''} ago"


PI_CSS = {
    "A": "",
    "B": """
.pv-list{display:grid;gap:10px;margin:0 40px 40px}
.pv-row{display:grid;grid-template-columns:64px 44px minmax(0,1.5fr) minmax(0,1fr) 110px 100px 280px;gap:16px;align-items:center;background:var(--card);border-radius:4px;padding:12px 18px;box-shadow:inset 0 0 0 1px var(--brass),0 0 0 1px rgba(48,225,174,.2),0 18px 40px -26px rgba(48,225,174,.5);color:#1d2622}
.pv-row .nm{display:grid;gap:2px}.pv-row .nm b{font:600 24px/1.1 var(--font-head);color:#1d2622}.pv-row .nm small{font-size:15px;color:#4f564f}
.pv-row .ind{font:600 15px/1.3 var(--font-body);color:#1b5d4a}.pv-row .fd{font:600 15px/1 var(--font-body);color:#4f564f}
.pv-row .fn{font:700 20px/1 var(--font-body);color:#7a5a1c;text-align:right}.pv-row .fn small{display:block;font-size:13px;color:#4f564f;margin-top:4px}
.pv-row .pv-acts{display:flex;flex-wrap:nowrap;gap:8px;justify-content:flex-end}.pv-row .pv-acts .x-btn{min-height:38px;padding:0 12px;font-size:15px;white-space:nowrap}
.pv-row .pv-mono{width:44px;height:44px}
.pv-head{display:grid;grid-template-columns:64px 44px minmax(0,1.5fr) minmax(0,1fr) 110px 100px 280px;gap:16px;margin:0 40px 6px;padding:0 18px;font:700 14px/1 var(--font-body);color:#d8ccad}
""",
    "C": """
.pv-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;margin:0 40px 40px}
.pv-card{background:var(--card);border-radius:4px;overflow:hidden;box-shadow:inset 0 0 0 1px var(--brass),0 0 0 1px rgba(48,225,174,.24),0 26px 60px -30px rgba(48,225,174,.55);color:#1d2622;display:flex;flex-direction:column}
.pv-art{position:relative;height:170px;display:grid;place-items:center;background:linear-gradient(135deg,var(--m),#0f1f1e)}
.pv-art .pv-ring{position:absolute;left:14px;top:14px;background:rgba(15,31,30,.82);border-radius:50%}
.pv-art .pv-ring .rb{stroke:#36524d}.pv-art .pv-ring .rf{stroke:#30e1ae}.pv-art .pv-ring b{color:#eaf3f0}
.pv-art .pv-mono{width:72px;height:72px;font-size:30px;background:rgba(255,255,255,.14)}
.pv-body{padding:16px 18px 18px;display:grid;gap:8px;flex:1}
.pv-body h3{margin:0;font:600 28px/1.1 var(--font-head);color:#1d2622}
.pv-body p{margin:0;color:#2f3833;font-size:18px;line-height:1.4}
.pv-body .meta{display:flex;flex-wrap:wrap;gap:4px 16px;font:600 14px/1.3 var(--font-body);color:#4f564f}.pv-body .meta .ind{color:#1b5d4a}
.pv-body .fn{font:700 22px/1 var(--font-body);color:#7a5a1c;margin-top:auto}
.pv-body .pv-acts{display:flex;gap:8px}.pv-body .pv-acts .x-btn{min-height:38px;font-size:15px}
""",
    "D": """
.pv-table{margin:0 40px 40px;background:var(--card);border-radius:4px;padding:8px 24px 16px;box-shadow:inset 0 0 0 1px var(--brass),0 0 0 1px rgba(48,225,174,.24),0 26px 60px -30px rgba(48,225,174,.55);color:#1d2622}
.pv-table table{width:100%;border-collapse:collapse}
.pv-table th{text-align:left;font:700 15px/1.2 var(--font-body);color:#4f564f;padding:14px 10px;border-bottom:1px solid #c9a45c}
.pv-table td{padding:14px 10px;border-bottom:1px solid #e6dcc4;vertical-align:middle}
.pv-table .co{display:flex;gap:12px;align-items:center}.pv-table .co b{font:700 18px/1.2 var(--font-body)}.pv-table .co small{display:block;font-size:14px;color:#4f564f}
.pv-table th:last-child{white-space:nowrap}
.pv-table .pv-fit{display:flex;align-items:center;gap:10px;min-width:220px}.pv-table .pv-fit i{flex:1;height:12px;border-radius:6px;background:#e6dcc4;overflow:hidden}.pv-table .pv-fit i b{display:block;height:100%;background:linear-gradient(90deg,#2a866d,#1b5d4a)}
.pv-table .pv-fit>b{font:700 16px/1 var(--font-body);color:#1d2622;min-width:3ch;text-align:right}
.pv-table .fn{font:700 18px/1 var(--font-body);color:#7a5a1c;text-align:right;white-space:nowrap}
.pv-table .mut{color:#4f564f;font-size:15px;white-space:nowrap}
.pv-table .pv-mono{width:38px;height:38px;font-size:16px}
""",
}
RING_CSS = ".pv-ring{position:relative;display:inline-grid;place-items:center;flex:none}.pv-ring svg{position:absolute;inset:0}.pv-ring .rb{fill:none;stroke:#e6dcc4;stroke-width:5}.pv-ring .rf{fill:none;stroke:#1b5d4a;stroke-width:5;stroke-linecap:round}.pv-ring b{position:relative;font:700 15px/1 var(--font-body);color:#1d2622}"


def pipeline_pages():
    html = clean(fetch("/pipeline"))
    top, ticker, foot = chrome(html)
    main = grab(html, '<main id="main">', "main")[len('<main id="main">'):-len("</main>")]
    ph = grab(main, '<div class="ph"', "div")
    filt = grab(main, '<div class="filters x-pfilters"', "div")
    head = ph + filt
    out = {"A": main}
    act = lambda n: (f'<span class="pv-acts"><a class="x-btn site cta" href="#">Visit Website</a><a class="x-btn ghost" href="#">Track</a></span>' if n == "Chairside"
                     else '<span class="pv-acts"><a class="x-btn site find" href="#">Find Website</a><a class="x-btn ghost" href="#">Track</a></span>')
    rows = "".join(
        f'<div class="pv-row">{ring(f)}<span class="pv-mono" style="background:{col}">{n[0]}</span><span class="nm"><b>{n}</b><small>{ln}</small></span>'
        f'<span class="ind">{ind}</span><span class="fd">{days(fd)}</span><span class="fn">{fu}<small>{st}</small></span>{act(n)}</div>'
        for n, ind, f, fu, st, ln, fd, sd, col in PIPE)
    out["B"] = head + '<div class="pv-head"><span>Fit</span><span></span><span>Startup</span><span>Industry</span><span>Found</span><span>Funds Raised</span><span></span></div>' + f'<div class="pv-list">{rows}</div>'
    cards = "".join(
        f'<article class="pv-card"><div class="pv-art" style="--m:{col}">{ring(f, 60)}<span class="pv-mono">{n[0]}</span></div>'
        f'<div class="pv-body"><h3>{n}</h3><p>{ln}</p><div class="meta"><span class="ind">{ind}</span><span>Found {days(fd)}</span></div>'
        f'<div class="fn">{fu} <small style="font-size:14px;color:#4f564f">{st}</small></div>{act(n)}</div></article>'
        for n, ind, f, fu, st, ln, fd, sd, col in PIPE)
    out["C"] = head + f'<div class="pv-grid">{cards}</div>'
    trs = "".join(
        f'<tr><td class="mut">{i + 1}</td><td><span class="co"><span class="pv-mono" style="background:{col}">{n[0]}</span><span><b>{n}</b><small>{ln}</small></span></span></td>'
        f'<td class="mut">{ind}</td><td><span class="pv-fit"><i><b style="width:{f}%"></b></i><b>{f}%</b></span></td><td class="mut">{days(fd)}</td>'
        f'<td class="mut"><a href="https://news.example.com/" target="_blank" rel="noopener noreferrer">Example News</a> · {sd}d ago</td><td class="fn">{fu}</td></tr>'
        for i, (n, ind, f, fu, st, ln, fd, sd, col) in enumerate(PIPE))
    out["D"] = head + ('<div class="pv-table"><table><thead><tr><th>#</th><th>Startup</th><th>Industry</th><th>Thesis Fit</th><th>Found</th>'
                       f'<th>Latest Signal</th><th style="text-align:right">Funds Raised</th></tr></thead><tbody>{trs}</tbody></table></div>')
    return top, ticker, foot, out


PI_TOKENS = {
    "A": {"visual": {"ornament": "edge light", "energy": "balanced"}, "ux": {"structure": "rows", "density": "roomy"}},
    "B": {"visual": {"ornament": "edge light", "energy": "calm"}, "ux": {"structure": "rows", "density": "compact"}},
    "C": {"visual": {"ornament": "edge light", "energy": "balanced"}, "ux": {"structure": "card grid", "density": "roomy"}},
    "D": {"visual": {"ornament": "none", "energy": "calm"}, "ux": {"structure": "table", "density": "compact"}},
}


def manifest(subject, options, rec, compares, tokens=None):
    toks = tokens or {
        "A": {"visual": {"ornament": "edge light", "energy": "calm"}, "ux": {"structure": "rows", "detail": "charted"}},
        "B": {"visual": {"ornament": "edge light", "energy": "calm"}, "ux": {"structure": "two-column rail", "detail": "charted"}},
        "C": {"visual": {"ornament": "edge light", "energy": "balanced"}, "ux": {"structure": "dashboard tiles", "detail": "charted"}},
        "D": {"visual": {"ornament": "none", "energy": "calm"}, "ux": {"structure": "single column", "detail": "checklist"}},
    }
    return {"project": "VC Scout", "subject": subject, "surface": "page", "claude_rec": rec, "compares": compares,
            "options": [{"id": o, "name": n, "desc": d, "tokens": toks[o]} for o, n, tag, d in options]}


def main():
    live_css()
    shutil.copyfile(HERE.parent.parent / "brand" / "logo.svg", HERE / "assets" / "sk-logo.svg")
    for opts in (CO_OPTIONS, PI_OPTIONS):
        for _, name, tag, _ in opts:
            assert title_case_ok(name) and title_case_ok(tag), name
    top, ticker, foot, co = company_pages()
    for o, name, tag, desc in CO_OPTIONS:
        man = manifest("Sidekick Scout: the company page, four ways", CO_OPTIONS, "A", ["ux.structure", "ux.detail"]) if o == "A" else None
        (HERE / f"R5-{o}-company.html").write_text(page("Crownwell", o, top, ticker, co[o], foot, CO_CSS[o] + RING_CSS, man))
    top, ticker, foot, pi = pipeline_pages()
    for o, name, tag, desc in PI_OPTIONS:
        man = manifest("Sidekick Scout: the Pipeline, four ways", PI_OPTIONS, "B", ["ux.structure", "ux.density"], PI_TOKENS) if o == "A" else None
        (HERE / f"R5-{o}-pipeline.html").write_text(page("Pipeline", o, top, ticker, pi[o], foot, PI_CSS[o] + RING_CSS, man))
    print("wrote", ", ".join(f"R5-{o}-{k}.html" for k in ("company", "pipeline") for o in "ABCD"))


if __name__ == "__main__":
    main()
