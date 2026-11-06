#!/usr/bin/env python3
"""The top of the company page, six ways (user, 11-02-26, review note Throwaway/Sidekick Scout Feedback 1.md: "Come
up with 6 new designs for this above area as I'm still underwhelmed, specifically about the information design and
layout. It looks too all over the place. For example the one-line description of what the company is should probably
be near where its name is." and "It's still not clear that 'premium consumer brands' and 'buyer already invested' are
tags so to speak. They also should not be viewed as similar to '6 days ago'.").

Every option is the whole bare page, cut from the running test site (Crownwell, with Unit Economics gone and the Fit
Table Pipeline in); only the top area changes. In all six the one-line description sits under the name, the industry
and Buyer Already Invested are tags (filled chips with an icon), and dates and backers are labeled facts, never chips.
Writes R6-<A..F>-company.html. Run with the test site up on :4702: python3 build_round6.py
"""
import json
import re

from build_new_badge import FONTS, HERE, live_css, title_case_ok
from build_round5 import chrome, clean, fetch, grab

OPTIONS = [
    ("A", "Identity Then Numbers", "On-profile", "Who it is first (name, what it does, its tags, the facts with labels), then one row of numbers: the fit, the money, the picture."),
    ("B", "Cover Banner", "Stretch", "The picture becomes a cover across the card, with the name, what it does and the tags set on it; the numbers sit below."),
    ("C", "Identity Rail", "Calm", "A left column holds who it is, top to bottom, facts as a labeled list; the fit and the picture fill the right."),
    ("D", "Scoreboard", "Bold", "The fit ring leads the line, the name and tags beside it, the money at the end; the five fit parts run across as meters."),
    ("E", "Editorial Masthead", "Stretch", "Centered like a magazine cover: tags above, a large name, what it does as a serif line, then the numbers in two panels."),
    ("F", "Fact Sheet", "Scannable", "The name and what it does on top; then a labeled sheet (Industry, Signal, Found, Backed By, Funds, Latest) beside the fit."),
]

TAG_ICO = ('<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" fill="none" '
           'stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="7.5" cy="7.5" r="1.6" fill="currentColor"/></svg>')
FLAG_ICO = ('<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" '
            'stroke-width="2"/><path d="m8 12.5 2.6 2.6L16.5 9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>')

CSS = """
main .x-deal.m6{display:block;margin:0 40px 28px;padding:32px 36px}
.m6 .m6-name{font:600 60px/1.02 var(--font-head);margin:0;color:var(--heading)}
.m6 .m6-desc{font:400 21px/1.45 var(--font-body);color:#2f3833;margin:10px 0 0;max-width:62ch}
.m6-tags{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
.m6-tag{display:inline-flex;align-items:center;gap:8px;padding:7px 13px 7px 11px;border-radius:4px;font:700 16px/1.1 var(--font-body);white-space:nowrap}
.m6-tag.ind{background:#1b5d4a;color:#f6f1e4}
.m6-tag.flag{background:#f1e2bd;color:#5c4210;box-shadow:inset 0 0 0 1px #c9a45c}
.m6-facts{display:flex;flex-wrap:wrap;gap:10px 32px;margin:20px 0 0}
.m6-facts div{display:grid;gap:3px}
.m6-facts dt{font:700 14px/1.2 var(--font-body);color:#4f564f}
.m6-facts dd{margin:0;font:600 18px/1.3 var(--font-body);color:#1d2622}
.m6 a.m6-proof{color:#7a5a1c !important;text-decoration:underline dotted 1px;text-underline-offset:3px}
.m6 .x-acts{margin-top:22px}
.m6-box{background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:18px 22px;display:grid;align-content:start;gap:6px}
.m6-box.m6-funds{align-content:center}
.m6-lab{font:700 15px/1.2 var(--font-body);color:#4f564f}
.m6-amt{font:600 54px/1 var(--font-head);color:#7a5a1c}
.m6-sub{font:600 17px/1.35 var(--font-body);color:#2f3833}
.m6 .x-dmedia{border-radius:4px;overflow:hidden;min-height:220px;height:100%}
.m6 .x-dmedia .x-media{height:100%;width:100%;aspect-ratio:auto}
.m6 .x-kpanel{margin:0}

/* A: identity, then a row of numbers */
.mA-id{display:grid;grid-template-columns:88px minmax(0,1fr);gap:22px;align-items:start}
.mA-id .x-logo{width:88px;height:88px}
.mA-nums{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,.75fr) minmax(0,1fr);gap:20px;margin-top:26px;padding-top:26px;border-top:1px solid #c9a45c}

/* B: the picture as a cover */
main .x-deal.m6.mB{padding:0;overflow:hidden}
.mB-cover{position:relative;min-height:330px;display:flex;align-items:flex-end}
.mB-cover .x-dmedia{position:absolute;inset:0;border-radius:0;min-height:0}
.mB-cover .x-dmedia .x-sky .x-skymark{display:none}
.mB-cover .x-dmedia{border:0;width:100%;height:100%}
.mB-cover::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(7,24,19,0) 15%,rgba(7,24,19,.86) 100%)}
.mB-over{position:relative;z-index:1;display:grid;grid-template-columns:76px minmax(0,1fr);gap:20px;align-items:start;padding:32px 36px}
.mB-over .x-logo{width:76px;height:76px}
.mB .mB-over .m6-name{color:#fff;font-size:64px}
.mB .mB-over .m6-desc{color:#e8e0cc}
.mB-body{padding:24px 36px 32px}
.mB-row{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:18px}
.mB-row .m6-facts,.mB-row .x-acts{margin:0}
.mB-nums{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:20px;margin-top:24px}

/* C: an identity rail on the left */
.mC{display:grid !important;grid-template-columns:400px minmax(0,1fr);gap:34px}
.mC-rail{display:grid;align-content:start;gap:0;padding-right:30px;border-right:1px solid #c9a45c}
.mC-rail .x-logo{width:72px;height:72px;margin-bottom:16px}
.mC-rail .m6-name{font-size:54px}
.mC-rail .m6-facts{flex-direction:column;gap:14px}
.mC-rail .x-acts{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.mC-main{display:grid;gap:20px;align-content:start}
.mC-two{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:20px}

/* D: a scoreboard line */
.mD-band{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:30px;align-items:center}
.mD-band .m6-funds{text-align:right;justify-items:end}
.mD-meters{margin-top:24px;padding:18px 22px;background:var(--surface);border:1px solid var(--border);border-radius:4px}
.mD-mhead{display:flex;align-items:baseline;gap:16px;margin-bottom:12px}
.mD-mhead .x-hint{margin:0;font-size:17px;color:#2f3833}
.mD-mhead .x-howlink{margin-left:auto}
.mD .x-bars{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:22px}
.mD .x-bar{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"lbl n" "tr tr";gap:6px 8px;align-items:baseline}
.mD .x-bar .lbl{grid-area:lbl;font-size:16px}.mD .x-bar .n{grid-area:n}.mD .x-bar .tr{grid-area:tr;width:100%}
.mD-foot{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:18px;margin-top:6px}
.mD-foot .x-acts{margin:0}

/* E: an editorial masthead, centered */
.mE-head{text-align:center;display:grid;justify-items:center;padding:8px 0 4px}
.mE-head .m6-tags{margin:0 0 18px;justify-content:center}
.mE .mE-head .m6-name{font-size:84px;letter-spacing:.01em}
.mE .mE-head .m6-desc{font:500 27px/1.35 var(--font-head);color:#2f3833;max-width:48ch;margin-top:14px}
.mE-head .m6-facts{justify-content:center}
.mE-head .m6-facts div{justify-items:center}
.mE-head .x-acts{justify-content:center}
.mE-rule{width:120px;height:1px;background:#c9a45c;margin:22px auto 0}
.mE-nums{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:20px;margin-top:28px}

/* F: a fact sheet */
.mF-head{display:grid;grid-template-columns:80px minmax(0,1fr) auto;gap:22px;align-items:center}
.mF-head .x-logo{width:80px;height:80px}
.mF-head .x-acts{margin:0;align-self:start}
.mF-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:24px;margin-top:26px}
.mF-sheet{width:100%;border-collapse:collapse}
.mF-sheet th{width:150px;text-align:left;vertical-align:middle;font:700 15px/1.2 var(--font-body);color:#4f564f;padding:12px 12px 12px 0;border-top:1px solid var(--border)}
.mF-sheet td{font:600 18px/1.35 var(--font-body);color:#1d2622;padding:12px 0;border-top:1px solid var(--border)}
.mF-sheet tr:first-child th,.mF-sheet tr:first-child td{border-top:1px solid #c9a45c}
.mF-sheet .m6-amt{font-size:34px}
"""


def pieces():
    html = clean(fetch("/company/4"))
    top, ticker, foot = chrome(html)
    main = grab(html, '<main id="main">', "main")[len('<main id="main">'):-len("</main>")]
    deal = grab(main, '<header class="x-deal"', "header")
    hist = grab(main, 'aria-label="Funds Raised History"', "section")
    p = {
        "top": top, "ticker": ticker, "foot": foot,
        "crumb": grab(main, '<nav class="crumb"', "nav"),
        "rest": main[main.index(deal) + len(deal):],
        "logo": grab(deal, '<span class="x-logo big mono"', "span"),
        "fitp": grab(deal, '<section class="x-kpanel fitp"', "section"),
        "acts": grab(deal, '<div class="x-acts"', "div"),
        "media": grab(deal, '<div class="x-dmedia"', "div"),
        "why": re.search(r'<p class="x-why big">(.*?)</p>', deal, re.S).group(1),
        "found": re.search(r'Found <span[^>]*>([^<]+)</span>', deal).group(1),
        "amt": re.search(r'<span class="x-amt"[^>]*>([^<]+)</span>', deal).group(1),
        "round_date": re.search(r'<td class="r-date">([^<]+)</td>', hist).group(1),
    }
    p["ring"] = grab(p["fitp"], '<div class="x-tl static"', "div")
    p["bars"] = grab(p["fitp"], '<div class="x-bars"', "div")
    p["hint"] = re.search(r'<p class="x-hint">.*?</p>', p["fitp"], re.S).group(0)
    p["how"] = re.search(r'<a class="x-howlink".*?</a>', p["fitp"], re.S).group(0)
    b = re.search(r'Backed by <a href="([^"]+)"[^>]*>([^<]+)</a>', deal)
    p["backed_url"], p["backed"] = b.group(1), b.group(2)
    s = re.search(r'<a class="x-sig" href="([^"]+)".*?<span>([^<]+)</span>.*?<span class="live-v[^>]*>([^<]+)</span>', deal, re.S)
    p["sig_url"], p["sig"], p["sig_ago"] = s.group(1), s.group(2).strip(), s.group(3)
    p["src_url"] = re.search(r'<td><span><a href="([^"]+)"', hist).group(1)
    return p


def link(url, text):
    return f'<a class="m6-proof" href="{url}" target="_blank" rel="noopener noreferrer" title="Opens the source in a new window">{text}</a>'


def parts(p):
    tags = (f'<div class="m6-tags"><span class="m6-tag ind" title="Industry 1 of Sidekick\'s five">{TAG_ICO}Premium Consumer Brands</span>'
            f'<span class="m6-tag flag" title="{p["backed"]} backed Crownwell, so Unilever leads its likely buyers">{FLAG_ICO}Buyer Already Invested</span></div>')
    facts = (f'<dl class="m6-facts"><div><dt>Found</dt><dd>{p["found"]}</dd></div>'
             f'<div><dt>Backed By</dt><dd>{link(p["backed_url"], p["backed"])}</dd></div>'
             f'<div><dt>Latest Signal</dt><dd>{link(p["sig_url"], p["sig"])}, {p["sig_ago"]}</dd></div></dl>')
    funds = (f'<div class="m6-box m6-funds"><span class="m6-lab">Funds Raised</span><b class="m6-amt">{p["amt"]}</b>'
             f'<span class="m6-sub">Seed, {p["round_date"]} · {link(p["src_url"], "Example News")}</span></div>')
    name = '<h1 class="m6-name x-dname">Crownwell</h1>'
    desc = f'<p class="m6-desc">{p["why"]}</p>'
    return tags, facts, funds, name, desc


def mastheads(p):
    tags, facts, funds, name, desc, = parts(p)
    L, fitp, acts, media = p["logo"], p["fitp"], p["acts"], p["media"]
    out = {}
    out["A"] = (f'<header class="x-deal m6 mA"><div class="mA-id">{L}<div>{name}{desc}{tags}{facts}{acts}</div></div>'
                f'<div class="mA-nums">{fitp}{funds}{media}</div></header>')
    out["B"] = (f'<header class="x-deal m6 mB"><div class="mB-cover">{media}<div class="mB-over">{L}<div>{name}{desc}{tags}</div></div></div>'
                f'<div class="mB-body"><div class="mB-row">{facts}{acts}</div><div class="mB-nums">{fitp}{funds}</div></div></header>')
    out["C"] = (f'<header class="x-deal m6 mC"><aside class="mC-rail">{L}{name}{desc}{tags}{facts}{acts}</aside>'
                f'<div class="mC-main">{fitp}<div class="mC-two">{funds}{media}</div></div></header>')
    funds_d = funds.replace('class="m6-box m6-funds"', 'class="m6-funds" style="display:grid;gap:6px"')
    out["D"] = (f'<header class="x-deal m6 mD"><div class="mD-band">{p["ring"]}<div>{name}{desc}{tags}</div>{funds_d}</div>'
                f'<div class="mD-meters"><div class="mD-mhead"><span class="m6-lab">Thesis Fit</span>{p["hint"]}{p["how"]}</div>{p["bars"]}</div>'
                f'<div class="mD-foot">{facts}{acts}</div></header>')
    out["E"] = (f'<header class="x-deal m6 mE"><div class="mE-head">{tags}{name}{desc}{facts}{acts}<span class="mE-rule"></span></div>'
                f'<div class="mE-nums">{fitp}{funds}</div></header>')
    sheet = ('<table class="mF-sheet"><tbody>'
             f'<tr><th>Industry</th><td><span class="m6-tag ind">{TAG_ICO}Premium Consumer Brands</span></td></tr>'
             f'<tr><th>Exit Signal</th><td><span class="m6-tag flag">{FLAG_ICO}Buyer Already Invested</span></td></tr>'
             f'<tr><th>Found</th><td>{p["found"]}</td></tr>'
             f'<tr><th>Backed By</th><td>{link(p["backed_url"], p["backed"])}</td></tr>'
             f'<tr><th>Funds Raised</th><td><b class="m6-amt">{p["amt"]}</b> Seed, {p["round_date"]} · {link(p["src_url"], "Example News")}</td></tr>'
             f'<tr><th>Latest Signal</th><td>{link(p["sig_url"], p["sig"])}, {p["sig_ago"]}</td></tr></tbody></table>')
    out["F"] = (f'<header class="x-deal m6 mF"><div class="mF-head">{L}<div>{name}{desc}</div>{acts}</div>'
                f'<div class="mF-grid">{sheet}{fitp}</div></header>')
    return out


def page(oid, p, masthead, manifest=None):
    man = f'<script type="application/json" id="variation-manifest">\n{json.dumps(manifest, indent=1)}\n</script>' if manifest else ""
    return f"""<!doctype html>
<html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Crownwell · Sidekick Partners AI Scout</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}"><link rel="stylesheet" href="assets/live-scout.css"><style>{CSS}</style>{man}</head>
<body data-variation="{oid}"><div class="app">{p["top"]}{p["ticker"]}<main id="main">{p["crumb"]}{masthead}{p["rest"]}</main>{p["foot"]}</div></body></html>"""


TOKENS = {
    "A": {"visual": {"ornament": "edge light", "energy": "calm"}, "ux": {"structure": "identity then numbers", "detail": "labeled facts"}},
    "B": {"visual": {"ornament": "cover image", "energy": "balanced"}, "media": {"placement": "cover"}, "ux": {"structure": "cover banner", "detail": "labeled facts"}},
    "C": {"visual": {"ornament": "edge light", "energy": "calm"}, "ux": {"structure": "two-column rail", "detail": "labeled facts"}},
    "D": {"visual": {"ornament": "edge light", "energy": "balanced"}, "ux": {"structure": "scoreboard", "detail": "meters"}},
    "E": {"visual": {"ornament": "none", "energy": "calm", "layout": "centered"}, "ux": {"structure": "editorial", "detail": "labeled facts"}},
    "F": {"visual": {"ornament": "none", "energy": "calm"}, "ux": {"structure": "fact sheet", "detail": "table"}},
}


def main():
    live_css()
    for _, name, tag, _ in OPTIONS:
        assert title_case_ok(name) and title_case_ok(tag), name
    for label in ("Found", "Backed By", "Latest Signal", "Funds Raised", "Industry", "Exit Signal", "Thesis Fit"):
        assert title_case_ok(label), label
    p = pieces()
    heads = mastheads(p)
    manifest = {"project": "VC Scout", "subject": "Sidekick Scout: the top of the company page, six ways", "surface": "page",
                "claude_rec": "A", "compares": ["ux.structure", "ux.detail"],
                "options": [{"id": o, "name": n, "desc": d, "tokens": TOKENS[o]} for o, n, t, d in OPTIONS]}
    for o, *_ in OPTIONS:
        (HERE / f"R6-{o}-company.html").write_text(page(o, p, heads[o], manifest if o == "A" else None))
    print("wrote", ", ".join(f"R6-{o}-company.html" for o, *_ in OPTIONS))


if __name__ == "__main__":
    main()
