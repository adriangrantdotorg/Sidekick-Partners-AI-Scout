#!/usr/bin/env python3
"""The Shortlist's New badge, four ways (user, 11-02-26: "I don't like the 'new' badge. Show me four variations").

Each option is the real Shortlist card, drawn with the site's own stylesheet (copied from the local test site, Plan step
11) and the test site's six made-up startups; only the New marker changes. The broken favicon is already fixed here:
a startup with no icon shows its letter. Writes new-badge.html. Run with the test site up (cd Engine && SCOUT_PGLITE=
.local-db/sidekick-fixture.tar.gz NEXT_PUBLIC_SCOUT_FIRM=sidekick-partners npx next start -p 4702): python3 build_new_badge.py
"""
import json
import re
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
SITE = "http://localhost:4702"
FONTS = ("https://fonts.googleapis.com/css2?family=Bodoni+Moda:wght@600&family=Cormorant+Garamond:wght@600;700"
         "&family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&display=swap")

# the test site's sample startups (Engine/tests/firms/sidekick-partners/e2e/fixture.ts): made up
ROWS = [  # name, fit, funds, new, found (days ago)
    ("Chairside", 84, "$4.1M", True, "10-30-26"),
    ("Cartwise", 78, "$2.4M", True, "10-29-26"),
    ("Brightbench", 74, "$6.5M", True, "10-28-26"),
    ("Crownwell", 71, "$3.2M", True, "10-27-26"),
    ("Steadfast Health", 69, "$5.2M", True, "10-26-26"),
    ("Olea & Oak", 66, "$1.5M", False, "10-24-26"),
]
TIP = "New this week: a new signal in the last 7 days"

OPTIONS = [
    ("A", "Mint Glow Dot", "On-profile",
     "A small forest dot before the name, glowing mint and breathing slowly (6 s). No word.",
     lambda n: (f'<i class="nb-dot" title="{TIP}"></i>', n, "")),
    ("B", "Brass Small Capitals", "Classic",
     "The word set like the headings: brass Cormorant small capitals after the name, no box.",
     lambda n: ("", n + f' <span class="nb-word" title="{TIP}">New</span>', "")),
    ("C", "Found Date", "Stretch",
     "No flag: a quiet line under the name says when Scout found it, so a new one reads at a glance and an old one says how old.",
     None),
    ("D", "Edge Light", "On-profile",
     "New rows carry a thin glowing brass edge on the left; the heading's legend names it. Nothing beside the name.",
     lambda n: ("", n, "")),
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
/* A: Mint Glow Dot */
.nb-dot{display:inline-block;width:10px;height:10px;border-radius:50%;background:#1b5d4a;margin-right:-4px;box-shadow:0 0 0 0 rgba(48,225,174,.0);animation:nbbreathe 6s ease-in-out infinite;flex:none}
@keyframes nbbreathe{0%,100%{box-shadow:0 0 0 2px rgba(48,225,174,.25),0 0 6px 1px rgba(48,225,174,.35)}50%{box-shadow:0 0 0 3px rgba(48,225,174,.45),0 0 14px 4px rgba(48,225,174,.55)}}
@media (prefers-reduced-motion: reduce){.nb-dot{animation:none;box-shadow:0 0 0 3px rgba(48,225,174,.35)}}
/* B: Brass Small Capitals */
.nb-word{font:600 19px/1 var(--font-head);font-variant:small-caps;letter-spacing:.06em !important;color:#7a5a1c;margin-left:4px}
/* C: Found Date */
.nb-two{display:grid;gap:3px}
.nb-found{font:600 14px/1.2 var(--font-body);color:var(--text-3)}
.nb-found.new{color:#1b5d4a}
/* D: Edge Light */
[data-variation=D] .x-rr.nb-new{box-shadow:inset 3px 0 0 #c9a45c, inset 14px 0 16px -12px rgba(201,164,92,.55)}
.nb-legend{font:600 15px/1 var(--font-body);color:var(--text-3);display:inline-flex;align-items:center;gap:8px}
.nb-legend i{display:inline-block;width:3px;height:16px;background:#c9a45c;box-shadow:0 0 8px rgba(201,164,92,.8)}
"""


def live_css() -> str:
    """The site's own stylesheet, saved beside this page (webshot reads only the page's folder)."""
    dst = HERE / "assets" / "live-scout.css"
    try:
        html = urllib.request.urlopen(SITE + "/", timeout=10).read().decode()
        # every stylesheet the page loads, in order (the build can split them: Engine's, then the firm's theme)
        hrefs = re.findall(r'<link rel="stylesheet" href="(/_next/static/chunks/[^"]+\.css)"', html)
        assert hrefs, "no stylesheet on the page"
        dst.write_bytes(b"\n".join(urllib.request.urlopen(SITE + h, timeout=10).read() for h in hrefs))
    except Exception as e:  # the site is down: keep the copy we have
        if not dst.exists():
            raise SystemExit(f"start the test site first ({e})")
    return "assets/live-scout.css"


def rows(opt):
    out = []
    for i, (name, fit, funds, new, found) in enumerate(ROWS):
        letter = name[0]
        if opt == "C":
            line = f'<span class="nb-found new">New · Found {found}</span>' if new else f'<span class="nb-found">Found {found}</span>'
            nm = f'<span class="x-rname nb-two"><span>{name}</span>{line}</span>'
            lead = ""
        else:
            lead, label, _ = dict((o[0], o[4]) for o in OPTIONS)[opt](name) if new else ("", name, "")
            nm = f'<span class="x-rname">{lead}{label}</span>'
        cls = "x-rr nb-new" if (new and opt == "D") else "x-rr"
        tip = f' title="{TIP}"' if (new and opt == "D") else ""
        out.append(f'<a class="{cls}"{tip} style="--w:{fit};--h:140" href="#"><span class="x-rpos">{i + 1}</span>'
                   f'<span class="x-logo sm mono">{letter}</span>{nm}<span class="x-rtrack"><i></i><b>{fit}%</b></span>'
                   f'<span class="x-rfund">{funds}</span></a>')
    return "".join(out)


def section(opt):
    legend = '<span class="nb-legend"><i></i>New This Week</span>' if opt == "D" else ""
    return (f'<section class="x-sec" aria-label="Shortlist" id="opt-{opt}"><div class="x-sech"><h2 class="x-h2">Shortlist</h2>'
            f'<span class="x-count">(Top 10 Startups by Thesis Fit · Updated Daily)</span>{legend}</div>'
            f'<div class="x-race static"><div class="x-rhead"><span>#</span><span></span><span>Company</span>'
            f'<span>Thesis Fit</span><span>Funds Raised</span></div>{rows(opt)}</div></section>')


SMALL = {"and", "for", "of", "the", "a", "an", "to", "in", "on", "at", "with", "or", "by"}


def title_case_ok(label: str) -> bool:
    words = re.findall(r"[A-Za-z][\w'’-]*", label)
    return all(w[0].isupper() or (i and w.lower() in SMALL) for i, w in enumerate(words))


def main():
    css = live_css()
    manifest = {
        "project": "VC Scout", "subject": "Sidekick Scout: the Shortlist's New badge", "surface": "component",
        "claude_rec": "D", "compares": ["ux.attention_cue", "visual.ornament", "motion"],
        "options": [
            {"id": "A", "name": "Mint Glow Dot", "desc": OPTIONS[0][3],
             "tokens": {"visual": {"accent": ["#30e1ae"], "ornament": "glow dot", "energy": "calm"},
                        "motion": [{"element": "new-dot", "kind": "breathe", "period_s": 6, "reactivity": "ambient", "trigger": "idle",
                                    "pace": "slow", "text_moves": False, "flashes": False}],
                        "ux": {"attention_cue": "motion"}}},
            {"id": "B", "name": "Brass Small Capitals", "desc": OPTIONS[1][3],
             "tokens": {"visual": {"accent": ["#7a5a1c"], "ornament": "typographic", "energy": "calm", "fonts": {"display": "cormorant garamond"}},
                        "ux": {"attention_cue": "text"}}},
            {"id": "C", "name": "Found Date", "desc": OPTIONS[2][3],
             "tokens": {"visual": {"ornament": "none", "energy": "calm"}, "ux": {"attention_cue": "text", "detail": "dated"}}},
            {"id": "D", "name": "Edge Light", "desc": OPTIONS[3][3],
             "tokens": {"visual": {"accent": ["#c9a45c"], "ornament": "edge light", "energy": "calm"}, "ux": {"attention_cue": "ornament"}}},
        ],
    }
    body = ['<div class="nb-intro"><h1>The New Badge · Four Options</h1>'
            "Each is the real Shortlist card in the site's own styles, with the test site's made-up startups. Only the New "
            "marker changes. The broken favicon is fixed in all four: a startup with no icon shows its letter.</div>"]
    for oid, name, tag, desc, _ in OPTIONS:
        for label in (name, tag):
            assert title_case_ok(label), label
        body.append(f'<div class="nb-opt" data-variation="{oid}"><p class="nb-label"><b>{oid} · {name}</b>'
                    f'<span class="tag">{tag}</span>{desc}</p>{section(oid)}</div>')
    page = f"""<!doctype html>
<html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>New Badge · Sidekick Partners AI Scout</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}"><link rel="stylesheet" href="{css}"><style>{CSS}</style>
<script type="application/json" id="variation-manifest">
{json.dumps(manifest, indent=1)}
</script></head>
<body><main class="nb">{''.join(body)}</main></body></html>"""
    m = re.search(r'<script type="application/json" id="variation-manifest">(.*?)</script>', page, re.S)
    json.loads(m.group(1))
    (HERE / "new-badge.html").write_text(page)
    print("wrote", HERE / "new-badge.html")


if __name__ == "__main__":
    main()
