#!/usr/bin/env python3
"""Found Date, round 2: four ways to mark a new startup in the Shortlist with the mint glow dot and fewer words.

user, 11-02-26, picking C (Found Date) from new-badge.html: "show 4 variations of C · Found Date. try including the
mint glow dot. in variations also find ways to make its less text heavy". Same Shortlist card and stylesheet as
build_new_badge.py (run that first with the test site up, so assets/live-scout.css exists). Writes found-date.html.
Run: python3 build_found_date.py
"""
import json
import re

from build_new_badge import FONTS, HERE, ROWS, TIP, title_case_ok

AGE = {"10-30-26": "3d", "10-29-26": "4d", "10-28-26": "5d", "10-27-26": "6d", "10-26-26": "7d", "10-24-26": "9d"}
DOT = f'<i class="nb-dot" title="{TIP}"></i>'

OPTIONS = [
    ("C1", "Dot and Date", "On-profile",
     "The glowing dot marks a new startup; a small date under every name, with no words around it."),
    ("C2", "Dot and Age", "Fewest Lines",
     "One line per row: the dot for new, then a muted age after the name (3d, 9d) instead of a date."),
    ("C3", "Found Column", "Cleanest Names",
     "The date moves into its own Found column, the dot beside it for new rows; names stand alone."),
    ("C4", "Dot, Date on Hover", "Stretch",
     "Only the dot shows; hovering a row brings in its date. The heading's legend says what the dot means."),
]

CSS = """
body{min-height:100vh}
main.nb{max-width:1440px;margin:0 auto;padding:28px 0 60px}
.nb-intro{margin:0 40px 22px;color:var(--wall);font-size:18px;max-width:900px}
.nb-intro h1{font:600 40px/1.1 var(--font-head);font-variant:small-caps;letter-spacing:.03em;margin:0 0 6px;color:#fff}
.nb-label{margin:34px 40px 12px;color:var(--wall);font-size:18px}
.nb-label b{font:600 28px/1.2 var(--font-head);font-variant:small-caps;letter-spacing:.03em;color:#fff;margin-right:12px}
.nb-label span.tag{display:inline-block;margin-right:10px;padding:2px 8px;border:1px solid var(--brass);border-radius:4px;font-size:14px;font-weight:700;color:var(--brass)}
.x-race{height:auto}
/* the mint glow dot (round 1's A), breathing slowly; still for reduced motion */
.nb-dot{display:inline-block;width:10px;height:10px;border-radius:50%;background:#1b5d4a;flex:none;animation:nbbreathe 6s ease-in-out infinite}
@keyframes nbbreathe{0%,100%{box-shadow:0 0 0 2px rgba(48,225,174,.25),0 0 6px 1px rgba(48,225,174,.35)}50%{box-shadow:0 0 0 3px rgba(48,225,174,.45),0 0 14px 4px rgba(48,225,174,.55)}}
@media (prefers-reduced-motion: reduce){.nb-dot{animation:none;box-shadow:0 0 0 3px rgba(48,225,174,.35)}}
.nb-slot{display:inline-grid;width:10px;place-items:center}
.nb-two{display:grid;gap:2px}
.nb-date{font:600 14px/1.2 var(--font-body);color:var(--text-3)}
.nb-age{font:600 15px/1 var(--font-body);color:var(--text-3);margin-left:2px}
/* C3: a Found column between the name and the fit */
[data-variation=C3] .x-rhead, [data-variation=C3] .x-rr{grid-template-columns:44px 34px minmax(160px,280px) 120px minmax(0,1fr) 150px}
.nb-col{display:inline-flex;align-items:center;gap:8px;font:600 16px/1 var(--font-body);color:var(--text-3)}
/* C4: the date waits for a hover */
[data-variation=C4] .nb-date{max-height:0;opacity:0;overflow:hidden;transition:max-height .2s ease,opacity .2s ease}
[data-variation=C4] .x-rr:hover .nb-date, [data-variation=C4] .x-rr:focus-visible .nb-date{max-height:20px;opacity:1}
.nb-legend{font:600 15px/1 var(--font-body);color:var(--text-3);display:inline-flex;align-items:center;gap:8px}
"""


def name_cell(opt, name, new, found):
    dot = DOT if new else '<span class="nb-slot"></span>'
    if opt == "C1":
        return f'<span class="x-rname">{dot}<span class="nb-two"><span>{name}</span><span class="nb-date">{found}</span></span></span>'
    if opt == "C2":
        return f'<span class="x-rname">{dot}<span>{name}</span><span class="nb-age" title="Found {found}">{AGE[found]}</span></span>'
    if opt == "C3":
        return f'<span class="x-rname">{name}</span><span class="nb-col">{DOT if new else ""}{found}</span>'
    return f'<span class="x-rname">{dot}<span class="nb-two"><span>{name}</span><span class="nb-date">Found {found}</span></span></span>'


def section(opt):
    rows = "".join(
        f'<a class="x-rr" style="--w:{fit};--h:140" href="#" title="Found {found}"><span class="x-rpos">{i + 1}</span>'
        f'<span class="x-logo sm mono">{name[0]}</span>{name_cell(opt, name, new, found)}'
        f'<span class="x-rtrack"><i></i><b>{fit}%</b></span><span class="x-rfund">{funds}</span></a>'
        for i, (name, fit, funds, new, found) in enumerate(ROWS))
    head = "<span>#</span><span></span><span>Company</span>" + ("<span>Found</span>" if opt == "C3" else "") + "<span>Thesis Fit</span><span>Funds Raised</span>"
    legend = f'<span class="nb-legend">{DOT}New This Week</span>'
    return (f'<section class="x-sec" aria-label="Shortlist" id="opt-{opt}"><div class="x-sech"><h2 class="x-h2">Shortlist</h2>'
            f'<span class="x-count">(Top 10 Startups by Thesis Fit · Updated Daily)</span>{legend}</div>'
            f'<div class="x-race static"><div class="x-rhead">{head}</div>{rows}</div></section>')


def main():
    css = "assets/live-scout.css"
    assert (HERE / css).exists(), "run build_new_badge.py first (it saves the site's stylesheet)"
    dot_motion = {"element": "new-dot", "kind": "breathe", "period_s": 6, "reactivity": "ambient", "trigger": "idle", "pace": "slow", "text_moves": False, "flashes": False}
    manifest = {
        "project": "VC Scout", "subject": "Sidekick Scout: the Shortlist's Found Date, with the dot", "surface": "component",
        "claude_rec": "C3", "compares": ["ux.detail", "ux.structure", "ux.attention_cue"],
        "options": [
            {"id": "C1", "name": "Dot and Date", "desc": OPTIONS[0][3], "tokens": {"visual": {"accent": ["#30e1ae"], "energy": "calm"}, "motion": [dot_motion], "ux": {"detail": "date", "structure": "two-line", "attention_cue": "motion"}}},
            {"id": "C2", "name": "Dot and Age", "desc": OPTIONS[1][3], "tokens": {"visual": {"accent": ["#30e1ae"], "energy": "calm"}, "motion": [dot_motion], "ux": {"detail": "relative-age", "structure": "one-line", "attention_cue": "motion"}}},
            {"id": "C3", "name": "Found Column", "desc": OPTIONS[2][3], "tokens": {"visual": {"accent": ["#30e1ae"], "energy": "calm"}, "motion": [dot_motion], "ux": {"detail": "date", "structure": "column", "attention_cue": "motion"}}},
            {"id": "C4", "name": "Dot, Date on Hover", "desc": OPTIONS[3][3], "tokens": {"visual": {"accent": ["#30e1ae"], "energy": "calm"}, "motion": [dot_motion], "ux": {"detail": "on-hover", "structure": "one-line", "attention_cue": "motion"}}},
        ],
    }
    body = ['<div class="nb-intro"><h1>Found Date · Four Ways With the Dot</h1>'
            "Round 2 of the New badge: your pick C, with the mint glow dot and fewer words. The same Shortlist card, styles "
            "and made-up startups as round 1. In C4, hover a row to see its date.</div>"]
    for oid, name, tag, desc in OPTIONS:
        for label in (name, tag):
            assert title_case_ok(label), label
        body.append(f'<div class="nb-opt" data-variation="{oid}"><p class="nb-label"><b>{oid} · {name}</b>'
                    f'<span class="tag">{tag}</span>{desc}</p>{section(oid)}</div>')
    page = f"""<!doctype html>
<html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Found Date · Sidekick Partners AI Scout</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}"><link rel="stylesheet" href="{css}"><style>{CSS}</style>
<script type="application/json" id="variation-manifest">
{json.dumps(manifest, indent=1)}
</script></head>
<body><main class="nb">{''.join(body)}</main></body></html>"""
    json.loads(re.search(r'id="variation-manifest">(.*?)</script>', page, re.S).group(1))
    (HERE / "found-date.html").write_text(page)
    print("wrote", HERE / "found-date.html")


if __name__ == "__main__":
    main()
