#!/usr/bin/env python3
"""The Deck Screen's read, four ways (user, 11-02-26, review note Throwaway/Mon, Nov 2nd 2026, 07.20.21pm.md, on The
Screen and Moat and Open Questions: "needs to be more visual, more charts. more easier to scan via eyes. currently it is
text heavy and dense. there has to be better ways to communicate numbers. show me 4 variations").

Each option is the whole bare Deck Screen result for the made-up Cartwise deck, cut from the running test site; only
the two sections change. Their status marks (answered, partly, a claim, missing) and key figures are written by hand
here from the sample's own words: building any of them means the read also returns those per line.
Writes R7-<A..D>-deck.html. Run with the test site up on :4702: python3 build_deck_screen.py
"""
import json
import re

from build_new_badge import FONTS, HERE, live_css, title_case_ok
from build_round5 import chrome, clean, fetch, grab

OPTIONS = [
    ("A", "Scorecard", "On-profile", "Each check is one row: a status mark, a short verdict, and a small picture of its number (a range bar, a progress bar, figure chips)."),
    ("B", "Number Tiles", "Bold", "The deck's five key numbers lead as large tiles set against their benchmarks; the six checks follow as a grid of status tiles."),
    ("C", "Charts First", "Stretch", "Charts carry the read: how many checks it answered, the deck against the benchmarks, the road to break-even, a moat gauge."),
    ("D", "Status Table", "Compact", "One table: each check's status, its key figure in large type, and a few words; moat and questions as a short risk list."),
]

# Cartwise, from the sample's own words (Sidekick Partners/deck.ts); status: ok · part · claim · miss
SCREEN = [
    ("Stage and Raise", "ok", "Seed, raising $2.5M", "Inside Sidekick's $1M to $10M check range."),
    ("The Numbers", "part", "$1.2M ARR, up 3.1x, 71% margin", "Retention and payback aren't in the deck."),
    ("Path to Profit", "claim", "Break-even claimed at $3M ARR", "No cost plan behind it."),
    ("Founder–Startup Fit", "ok", "Two founders from Shopify partner agencies", ""),
    ("Exit Path", "ok", "Instacart bought Caper, about $350M", "Commerce platforms buy tools like this (10-19-21)."),
    ("What's Missing", "miss", "Churn, payback, how the 18% lift was measured", ""),
]
MARK = {"ok": ("✓", "Answered"), "part": ("◐", "Partly"), "claim": ("!", "A Claim"), "miss": ("✕", "Missing")}
MOAT = "Thin today: a funded rival could copy the offer engine within a year; the data from 140 stores is the start of one."
CLAIM = "\"Lifts average order value 18%.\""
QUESTION = "How many of your 140 merchants are Shopify Plus brands, and what's monthly churn for the rest?"

CSS = """
main .ds-two{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:28px;margin:0 40px 28px}
main .ds-two > .x-sec, main .ds-one{margin:0}
main .ds-one{margin:0 40px 28px}
.ds-mark{flex:none;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font:700 16px/1 var(--font-body);color:#f6f1e4}
.ds-mark.ok{background:#1b5d4a}.ds-mark.part{background:#c98a1b}.ds-mark.claim{background:#c98a1b}.ds-mark.miss{background:#b4533a}
.ds-pill{justify-self:start;display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:4px;font:700 14px/1.1 var(--font-body);white-space:nowrap}
.ds-pill.ok{background:#dfeee6;color:#1b5d4a}.ds-pill.part,.ds-pill.claim{background:#f6e6c5;color:#7a4b06}.ds-pill.miss{background:#f3ddd5;color:#8c3a24}
.ds-chip{display:inline-flex;align-items:baseline;gap:6px;padding:6px 10px;border-radius:4px;background:#efe7d3;border:1px solid #d9cdb0;font:600 15px/1.2 var(--font-body);color:#2f3833}
.ds-chip b{font:700 18px/1 var(--font-body);color:#1d2622}
.ds-chip.gone{border-style:dashed;background:transparent;color:#8c3a24}
.ds-chip.up b::after{content:" ▲";font-size:12px;color:#1b5d4a}
.ds-small{font:600 15px/1.35 var(--font-body);color:#4f564f}
.ds-bar{position:relative;height:10px;border-radius:5px;background:#e6dcc4}
.ds-bar i{position:absolute;left:0;top:0;bottom:0;border-radius:5px;background:linear-gradient(90deg,#2a866d,#1b5d4a)}
.ds-bar.warn i{background:linear-gradient(90deg,#d9a441,#c98a1b)}
.ds-tick{position:absolute;top:-5px;width:3px;height:20px;margin-left:-1px;border-radius:1px;background:#7a5a1c}
.ds-ends{display:flex;justify-content:space-between;margin-top:6px;font:600 14px/1 var(--font-body);color:#4f564f}
.ds-meter{display:flex;gap:4px}.ds-meter i{width:34px;height:10px;border-radius:2px;background:#e6dcc4}.ds-meter i.on{background:#c98a1b}
.ds-quote{font:500 24px/1.3 var(--font-head);color:#1d2622}
.ds-q{display:grid;grid-template-columns:30px minmax(0,1fr);gap:12px;align-items:start}

/* A: Scorecard */
.dsA-row{display:grid;grid-template-columns:30px minmax(0,1fr) minmax(0,1.05fr);gap:16px;align-items:center;padding:14px 0;border-top:1px solid #d9cdb0}
.dsA-row:first-of-type{border-top:0}
.dsA-row h3{margin:0;font:700 17px/1.2 var(--font-body);color:#1d2622}
.dsA-row .v{display:block;margin-top:3px;font:600 16px/1.3 var(--font-body);color:#2f3833}
.dsA-viz{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.dsA-viz .ds-bar{width:100%}
.dsA-av{width:30px;height:30px;border-radius:50%;background:#1b5d4a;color:#f6f1e4;display:grid;place-items:center;font:700 14px/1 var(--font-body)}
.dsA-moat{display:grid;gap:22px}
.dsA-moat h3{margin:0 0 8px;font:700 17px/1.2 var(--font-body);color:#1d2622}

/* B: Number Tiles */
.dsB-tiles{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:16px}
.dsB-tile{background:#efe7d3;border:1px solid #d9cdb0;border-radius:4px;padding:16px 18px;display:grid;gap:8px;align-content:start}
.dsB-tile .k{font:700 14px/1.2 var(--font-body);color:#4f564f}
.dsB-tile .n{font:600 40px/1 var(--font-head);color:#1d2622}
.dsB-checks{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:22px}
.dsB-check{border:1px solid #d9cdb0;border-radius:4px;padding:14px 16px;display:grid;gap:6px;border-top:4px solid var(--c)}
.dsB-check h3{margin:0;display:flex;justify-content:space-between;gap:8px;align-items:center;font:700 16px/1.2 var(--font-body);color:#1d2622}
.dsB-check .v{font:600 16px/1.3 var(--font-body);color:#2f3833}
.dsB-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.dsB-card{border:1px solid #d9cdb0;border-radius:4px;padding:16px 18px;display:grid;gap:10px;align-content:start}
.dsB-card h3{margin:0;font:700 16px/1.2 var(--font-body);color:#4f564f}

/* C: Charts First */
.dsC-grid{display:grid;grid-template-columns:240px minmax(0,1fr) minmax(0,1fr);gap:28px;align-items:start}
.dsC-legend{display:grid;gap:8px;margin-top:14px}
.dsC-legend span{display:flex;align-items:center;gap:8px;font:600 15px/1.2 var(--font-body);color:#2f3833}
.dsC-legend i{width:12px;height:12px;border-radius:2px}
.dsC-h{margin:0 0 12px;font:700 16px/1.2 var(--font-body);color:#4f564f}
.dsC-pair{display:grid;gap:4px;margin-bottom:14px}
.dsC-pair .lab{display:flex;justify-content:space-between;font:700 16px/1.2 var(--font-body);color:#1d2622}
.dsC-pair .ds-bar{height:14px}
.dsC-pair .ds-bar.bench i{background:#c9a45c}
.dsC-lines{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px 22px;margin-top:22px;padding-top:18px;border-top:1px solid #d9cdb0}
.dsC-lines div{display:flex;gap:10px;align-items:center;font:600 16px/1.3 var(--font-body);color:#2f3833}
.dsC-lines .ds-mark{width:24px;height:24px;font-size:13px}
.dsC-moat{display:grid;grid-template-columns:220px minmax(0,1fr) minmax(0,1fr);gap:28px;align-items:center}

/* D: Status Table */
.dsD table{width:100%;border-collapse:collapse}
.dsD th{text-align:left;font:700 15px/1.2 var(--font-body);color:#4f564f;padding:10px 12px;border-bottom:1px solid #c9a45c;white-space:nowrap}
.dsD td{padding:14px 12px;border-bottom:1px solid #e6dcc4;vertical-align:middle;font:500 17px/1.35 var(--font-body);color:#2f3833}
.dsD td.chk{font:700 17px/1.2 var(--font-body);color:#1d2622;white-space:nowrap}
.dsD td.fig{font:600 22px/1.2 var(--font-head);color:#1d2622}
.dsD-risk{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}
.dsD-risk div{display:grid;gap:8px;align-content:start}
.dsD-risk h3{margin:0;font:700 16px/1.2 var(--font-body);color:#4f564f}
"""


def sec(label, title, body, copy, cls="x-sec", extra=""):
    return (f'<section class="{cls}" aria-label="{label}"{extra}>{copy}<div class="x-sech"><h2 class="x-h2">{title}</h2></div>{body}</section>')


def mark(s):
    m, word = MARK[s]
    return f'<span class="ds-mark {s}" title="{word}">{m}</span>'


def pill(s):
    m, word = MARK[s]
    return f'<span class="ds-pill {s}">{m} {word}</span>'


def range_bar():  # $2.5M on the $1M to $10M check range
    at = (2.5 - 1) / (10 - 1) * 100
    return (f'<div style="width:100%"><div class="ds-bar"><i style="left:0;width:100%;background:#cfe3d9"></i><span class="ds-tick" style="left:{at:.1f}%"></span></div>'
            '<div class="ds-ends"><span>$1M</span><span>$2.5M raise</span><span>$10M</span></div></div>')


def profit_bar():  # $1.2M of the $3M break-even claim
    return ('<div style="width:100%"><div class="ds-bar warn"><i style="width:40%"></i></div>'
            '<div class="ds-ends"><span>$1.2M ARR now</span><span>40% of the way</span><span>$3M break-even</span></div></div>')


def figures():
    return ('<span class="ds-chip"><b>$1.2M</b>ARR</span><span class="ds-chip up" title="Benchmark: 40% at $1-5M ARR"><b>3.1x</b>Growth</span>'
            '<span class="ds-chip up" title="Benchmark: AI-heavy tools about 60%"><b>71%</b>Gross Margin</span>'
            '<span class="ds-chip gone">Retention ?</span><span class="ds-chip gone">Payback ?</span>')


def moat_meter(n=1):
    return '<span class="ds-meter" title="Moat strength: 1 of 4">' + "".join(f'<i class="{"on" if k < n else ""}"></i>' for k in range(4)) + "</span>"


def option(oid, copy):
    if oid == "A":
        viz = [range_bar(), f'<span class="dsA-viz">{figures()}</span>', profit_bar(),
               '<span class="dsA-viz"><span class="dsA-av">1</span><span class="dsA-av">2</span><span class="ds-small">Shopify partner agencies</span></span>',
               '<span class="dsA-viz"><span class="ds-chip"><b>~$350M</b>Instacart → Caper, 10-19-21</span></span>',
               '<span class="dsA-viz"><span class="ds-chip gone">Churn</span><span class="ds-chip gone">Payback</span><span class="ds-chip gone">18% Lift Method</span></span>']
        rows = "".join(f'<div class="dsA-row">{mark(s)}<div><h3>{l}</h3><span class="v">{v}</span></div><div class="dsA-viz">{z}</div></div>'
                       for (l, s, v, _), z in zip(SCREEN, viz))
        moat = (f'<div class="dsA-moat"><div><h3>Moat</h3><div style="display:flex;gap:12px;align-items:center">{moat_meter()}<b class="ds-pill claim">Thin</b></div>'
                f'<span class="ds-small" style="display:block;margin-top:8px">{MOAT}</span></div>'
                f'<div><h3>The Vaguest Claim</h3><div class="ds-quote">{CLAIM}</div><span class="ds-pill claim" style="margin-top:8px">! No Holdout Test</span></div>'
                f'<div><h3>The Question They\'d Least Like Asked</h3><div class="ds-q"><span class="ds-mark part">?</span><span class="ds-small" style="font-size:17px;color:#1d2622">{QUESTION}</span></div></div></div>')
        return f'<div class="ds-two">{sec("The Screen", "The Screen", rows, copy)}{sec("Moat and Open Questions", "Moat and Open Questions", moat, copy)}</div>'
    if oid == "B":
        tiles = ('<div class="dsB-tiles">'
                 f'<div class="dsB-tile"><span class="k">Raising</span><b class="n">$2.5M</b>{pill("ok")}<span class="ds-small">Seed, inside the $1M to $10M range</span></div>'
                 '<div class="dsB-tile"><span class="k">ARR</span><b class="n">$1.2M</b><span class="ds-small">140 merchants</span></div>'
                 f'<div class="dsB-tile"><span class="k">Growth</span><b class="n">3.1x</b><div class="ds-bar"><i style="width:100%"></i><span class="ds-tick" style="left:13%"></span></div><span class="ds-small">Benchmark 40% at $1-5M ARR</span></div>'
                 f'<div class="dsB-tile"><span class="k">Gross Margin</span><b class="n">71%</b><div class="ds-bar"><i style="width:71%"></i><span class="ds-tick" style="left:60%"></span></div><span class="ds-small">Benchmark about 60%</span></div>'
                 f'<div class="dsB-tile"><span class="k">To Break-Even</span><b class="n">40%</b><div class="ds-bar warn"><i style="width:40%"></i></div><span class="ds-small">$1.2M of a claimed $3M</span></div></div>')
        col = {"ok": "#1b5d4a", "part": "#c98a1b", "claim": "#c98a1b", "miss": "#b4533a"}
        checks = '<div class="dsB-checks">' + "".join(f'<div class="dsB-check" style="--c:{col[s]}"><h3>{l}{pill(s)}</h3><span class="v">{v}</span></div>' for l, s, v, _ in SCREEN) + "</div>"
        cards = (f'<div class="dsB-cards"><div class="dsB-card"><h3>Moat</h3><div style="display:flex;gap:12px;align-items:center">{moat_meter()}<b class="ds-pill claim">Thin</b></div><span class="ds-small">A rival could copy it within a year.</span></div>'
                 f'<div class="dsB-card"><h3>The Vaguest Claim</h3><div class="ds-quote">{CLAIM}</div><span class="ds-pill claim">! No Holdout Test</span></div>'
                 f'<div class="dsB-card"><h3>The Question They\'d Least Like Asked</h3><span class="ds-small" style="font-size:17px;color:#1d2622">{QUESTION}</span></div></div>')
        return sec("The Screen", "The Screen", tiles + checks, copy, "x-sec ds-one") + sec("Moat and Open Questions", "Moat and Open Questions", cards, copy, "x-sec ds-one")
    if oid == "C":
        n = {k: sum(1 for _, s, _, _ in SCREEN if s == k) for k in MARK}
        segs, start, C = [], 0.0, 2 * 3.14159 * 54
        for k, colr in (("ok", "#1b5d4a"), ("part", "#c98a1b"), ("claim", "#e0b25a"), ("miss", "#b4533a")):
            if n[k]:
                ln = C * n[k] / 6
                segs.append(f'<circle cx="70" cy="70" r="54" fill="none" stroke="{colr}" stroke-width="18" stroke-dasharray="{ln - 3:.1f} {C:.1f}" stroke-dashoffset="{-start:.1f}" transform="rotate(-90 70 70)"/>')
                start += ln
        donut = (f'<div><svg viewBox="0 0 140 140" width="200" height="200" role="img" aria-label="3 of 6 checks answered">{"".join(segs)}'
                 '<text x="70" y="68" text-anchor="middle" font-family="Cormorant Garamond" font-weight="600" font-size="34" fill="#1d2622">3 of 6</text>'
                 '<text x="70" y="90" text-anchor="middle" font-family="Source Sans 3" font-weight="600" font-size="13" fill="#4f564f">answered</text></svg>'
                 '<div class="dsC-legend"><span><i style="background:#1b5d4a"></i>3 Answered</span><span><i style="background:#c98a1b"></i>1 Partly</span>'
                 '<span><i style="background:#e0b25a"></i>1 Claim Only</span><span><i style="background:#b4533a"></i>1 Missing</span></div></div>')
        bench = ('<div><h3 class="dsC-h">The Deck Against the Benchmarks</h3>'
                 '<div class="dsC-pair"><span class="lab"><span>Growth</span><span>310% vs 40%</span></span><div class="ds-bar"><i style="width:100%"></i></div><div class="ds-bar bench"><i style="width:13%"></i></div></div>'
                 '<div class="dsC-pair"><span class="lab"><span>Gross Margin</span><span>71% vs 60%</span></span><div class="ds-bar"><i style="width:71%"></i></div><div class="ds-bar bench"><i style="width:60%"></i></div></div>'
                 '<div class="dsC-legend" style="grid-auto-flow:column;justify-content:start;gap:18px"><span><i style="background:#1b5d4a"></i>Cartwise</span><span><i style="background:#c9a45c"></i>Benchmark</span></div></div>')
        road = (f'<div><h3 class="dsC-h">The Road to Break-Even</h3>{profit_bar()}<div style="margin-top:18px"><h3 class="dsC-h">Raise in the Check Range</h3>{range_bar()}</div></div>')
        lines = '<div class="dsC-lines">' + "".join(f'<div>{mark(s)}<span><b style="color:#1d2622">{l}</b><br>{v}</span></div>' for l, s, v, _ in SCREEN) + "</div>"
        gauge = ('<div><svg viewBox="0 0 200 120" width="200" height="120" role="img" aria-label="Moat: thin">'
                 '<path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#e6dcc4" stroke-width="18" stroke-linecap="round"/>'
                 '<path d="M20 100 A80 80 0 0 1 43 43" fill="none" stroke="#c98a1b" stroke-width="18" stroke-linecap="round"/>'
                 '<text x="100" y="96" text-anchor="middle" font-family="Cormorant Garamond" font-weight="600" font-size="30" fill="#1d2622">Thin</text></svg>'
                 '<span class="ds-small" style="display:block;text-align:center">Moat: a rival could copy it within a year</span></div>')
        moat = (f'<div class="dsC-moat">{gauge}<div><h3 class="dsC-h">The Vaguest Claim</h3><div class="ds-quote">{CLAIM}</div><span class="ds-pill claim" style="margin-top:8px">! No Holdout Test</span></div>'
                f'<div><h3 class="dsC-h">The Question They\'d Least Like Asked</h3><span class="ds-small" style="font-size:17px;color:#1d2622">{QUESTION}</span></div></div>')
        return (sec("The Screen", "The Screen", f'<div class="dsC-grid">{donut}{bench}{road}</div>{lines}', copy, "x-sec ds-one")
                + sec("Moat and Open Questions", "Moat and Open Questions", moat, copy, "x-sec ds-one"))
    # D: Status Table
    figs = ["$2.5M", "$1.2M ARR", "$3M", "2 Founders", "~$350M", "3 Gaps"]
    words = ["Seed; inside the $1M to $10M range", "Up 3.1x, 71% margin; no retention or payback", "Break-even claimed; no cost plan",
             "Both from Shopify partner agencies", "Instacart bought Caper (10-19-21)", "Churn, payback, how the 18% lift was measured"]
    trs = "".join(f'<tr><td class="chk">{l}</td><td>{pill(s)}</td><td class="fig">{f}</td><td>{w}</td></tr>' for (l, s, _, _), f, w in zip(SCREEN, figs, words))
    table = f'<div class="dsD"><table><thead><tr><th>Check</th><th>Status</th><th>Key Figure</th><th>In Brief</th></tr></thead><tbody>{trs}</tbody></table></div>'
    risk = (f'<div class="dsD-risk"><div><h3>Moat</h3><div style="display:flex;gap:12px;align-items:center">{moat_meter()}<b class="ds-pill claim">Thin</b></div><span class="ds-small">A rival could copy it within a year.</span></div>'
            f'<div><h3>The Vaguest Claim</h3><div class="ds-quote">{CLAIM}</div><span class="ds-pill claim">! No Holdout Test</span></div>'
            f'<div><h3>The Question They\'d Least Like Asked</h3><span class="ds-small" style="font-size:17px;color:#1d2622">{QUESTION}</span></div></div>')
    return sec("The Screen", "The Screen", table, copy, "x-sec ds-one") + sec("Moat and Open Questions", "Moat and Open Questions", risk, copy, "x-sec ds-one")


TOKENS = {
    "A": {"visual": {"ornament": "edge light", "energy": "calm"}, "ux": {"structure": "rows", "detail": "inline charts", "density": "balanced"}},
    "B": {"visual": {"ornament": "edge light", "energy": "balanced"}, "ux": {"structure": "tiles", "detail": "big numbers", "density": "roomy"}},
    "C": {"visual": {"ornament": "charts", "energy": "balanced"}, "ux": {"structure": "charts first", "detail": "charts", "density": "roomy"}},
    "D": {"visual": {"ornament": "none", "energy": "calm"}, "ux": {"structure": "table", "detail": "status pills", "density": "compact"}},
}


def main():
    live_css()
    for _, name, tag, _ in OPTIONS:
        assert title_case_ok(name) and title_case_ok(tag), name
    for lab in ("Raising", "ARR", "Growth", "Gross Margin", "To Break-Even", "The Deck Against the Benchmarks", "The Road to Break-Even",
                "Raise in the Check Range", "Check", "Status", "Key Figure", "In Brief", "No Holdout Test", "18% Lift Method", *[w for _, w in MARK.values()]):
        assert title_case_ok(lab), lab
    html = clean(fetch("/deck?sample"))
    top, ticker, foot = chrome(html)
    main_ = grab(html, '<main id="main">', "main")[len('<main id="main">'):-len("</main>")]
    two = grab(main_[main_.index('<div class="x-two">'):], '<div class="x-two">', "div")
    copy = re.search(r'<button type="button" class="x-mdcopy".*?</button>', two, re.S).group(0)
    manifest = {"project": "VC Scout", "subject": "Sidekick Scout: the Deck Screen's read, more visual", "surface": "page", "claude_rec": "A",
                "compares": ["ux.structure", "ux.detail", "ux.density"],
                "options": [{"id": o, "name": n, "desc": d, "tokens": TOKENS[o]} for o, n, t, d in OPTIONS]}
    for o, *_ in OPTIONS:
        m = main_.replace(two, option(o, copy))
        man = f'<script type="application/json" id="variation-manifest">\n{json.dumps(manifest, indent=1)}\n</script>' if o == "A" else ""
        page = f"""<!doctype html>
<html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Deck Screen · Sidekick Partners AI Scout</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}"><link rel="stylesheet" href="assets/live-scout.css"><style>{CSS}</style>{man}</head>
<body data-variation="{o}"><div class="app">{top}{ticker}<main id="main">{m}</main>{foot}</div></body></html>"""
        (HERE / f"R7-{o}-deck.html").write_text(page)
    print("wrote", ", ".join(f"R7-{o}-deck.html" for o, *_ in OPTIONS))


if __name__ == "__main__":
    main()
