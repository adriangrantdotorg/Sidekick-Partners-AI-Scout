#!/usr/bin/env python3
"""The ticker's Live label, four ways (user, 11-02-26, review note Throwaway/Mon, Nov 2nd 2026, 07.20.21pm.md: "the
'live' needs some kind of illumination to indicates its live. also not a fan of the font. show me 4 variations").

Sidekick's theme had switched the dot's glow off (a dark dot, no shadow) and set "Live" small; every option lights it
and changes the type. Each option is the bare Today page cut from the running test site (user: "i need to see them on
an actual page"), its ticker moving at real speed; only the label changes. ?at=<seconds> freezes every animation.
Writes R8-<A..D>-today.html. Run with the test site up on :4702: python3 build_live_label.py
"""
import json
import re

from build_new_badge import FONTS, HERE, live_css, title_case_ok
from build_round5 import chrome, clean, fetch, grab

OPTIONS = [
    ("A", "Breathing Dot", "On-profile",
     "The dot turns mint and breathes a soft glow every 3 s; Live in Source Sans 3 bold on the brass tab."),
    ("B", "Ping Ring", "Classic",
     "A dark tab with a brass edge; a mint ring ripples out from the dot every 2 s, the way a broadcast marks live."),
    ("C", "Lit Edge", "Edge Light",
     "The tab's edge itself glows mint and breathes every 4 s; Live set in Bodoni Moda, the AI SCOUT wordmark's face."),
    ("D", "Light Sweep", "Stretch",
     "The brass tab catches a sheen of light that crosses it every 5 s; the dot holds a steady mint glow."),
]

LABEL = {
    "A": '<div class="lbl"><i></i><span>Live</span></div>',
    "B": '<div class="lbl"><i></i><em class="ring"></em><span>Live</span></div>',
    "C": '<div class="lbl"><i></i><span>Live</span></div>',
    "D": '<div class="lbl"><i></i><span>Live</span><em class="sheen"></em></div>',
}

CSS = """
body{min-height:100vh}
main.ll{max-width:1440px;margin:0 auto;padding:28px 0 60px}
.ll-intro{margin:0 40px 22px;color:var(--wall);font-size:18px;max-width:920px}
.ll-intro h1{font:600 40px/1.1 var(--font-head);font-variant:small-caps;margin:0 0 6px;color:#fff}
.ll-label{margin:34px 40px 12px;color:var(--wall);font-size:18px}
.ll-label b{font:600 28px/1.2 var(--font-head);font-variant:small-caps;color:#fff;margin-right:12px}
.ll-label span.tag{display:inline-block;margin-right:10px;padding:2px 8px;border:1px solid var(--brass);border-radius:4px;font-size:14px;font-weight:700;color:var(--brass)}
.ll-zoom{margin:14px 40px 0;width:330px;overflow:hidden;border-radius:4px;zoom:2.2;box-shadow:0 0 0 1px rgba(201,164,92,.35)}
.ll-zoom .ticker{width:330px}
.ll-cap{margin:6px 40px 0;color:#d8ccad;font-size:15px}
/* every option: the label is set apart, and passing names fade in from under it instead of looking cut */
[data-variation] .ticker .lbl{padding:0 18px;gap:10px}
[data-variation] .ticker .lbl::after{content:"";position:absolute;top:0;bottom:0;left:100%;width:30px;background:linear-gradient(90deg,var(--ticker),transparent);pointer-events:none}
[data-variation] .ticker .lbl i{width:10px;height:10px;border-radius:50%;flex:none;animation:none}
[data-variation] .ticker .lbl span{font:700 15px/1 "Source Sans 3",system-ui,sans-serif}

/* A: Breathing Dot */
[data-variation=A] .ticker .lbl{background:#c9a45c;color:#10261f}
[data-variation=A] .ticker .lbl i{background:#30e1ae;box-shadow:0 0 0 1.5px #0d2c24,0 0 6px 1px rgba(48,225,174,.55);animation:llbreathe 3s ease-in-out infinite}
@keyframes llbreathe{0%,100%{box-shadow:0 0 0 1.5px #0d2c24,0 0 4px 1px rgba(48,225,174,.45)}50%{box-shadow:0 0 0 1.5px #0d2c24,0 0 16px 6px rgba(48,225,174,.95)}}

/* B: Ping Ring */
[data-variation=B] .ticker .lbl{background:#0d2c24;color:#30e1ae;box-shadow:inset -2px 0 0 #c9a45c}
[data-variation=B] .ticker .lbl i{background:#30e1ae;box-shadow:0 0 6px rgba(48,225,174,.8)}
[data-variation=B] .ticker .lbl .ring{position:absolute;left:18px;top:50%;width:10px;height:10px;margin-top:-5px;border-radius:50%;border:2px solid #30e1ae;box-sizing:border-box;animation:llping 2s ease-out infinite}
@keyframes llping{0%{transform:scale(1);opacity:.85}80%,100%{transform:scale(2.8);opacity:0}}

/* C: Lit Edge */
[data-variation=C] .ticker .lbl{background:#0b2a22;color:#f3ead6;box-shadow:inset 0 0 0 1px rgba(48,225,174,.7),0 0 10px rgba(48,225,174,.35);animation:lledge 4s ease-in-out infinite}
[data-variation=C] .ticker .lbl i{background:#30e1ae;box-shadow:0 0 8px rgba(48,225,174,.9)}
[data-variation=C] .ticker .lbl span{font:600 16px/1 "Bodoni Moda",Georgia,serif;letter-spacing:.06em !important}
@keyframes lledge{0%,100%{box-shadow:inset 0 0 0 1px rgba(48,225,174,.45),0 0 6px rgba(48,225,174,.2)}50%{box-shadow:inset 0 0 0 1px rgba(48,225,174,1),0 0 16px rgba(48,225,174,.6)}}

/* D: Light Sweep */
[data-variation=D] .ticker .lbl{background:#c9a45c;color:#10261f;overflow:hidden}
[data-variation=D] .ticker .lbl::after{display:none}
[data-variation=D] .ticker .lbl i{background:#30e1ae;box-shadow:0 0 0 1.5px #0d2c24,0 0 9px 2px rgba(48,225,174,.75)}
[data-variation=D] .ticker .lbl .sheen{position:absolute;top:0;bottom:0;left:0;width:40%;background:linear-gradient(100deg,transparent,rgba(255,248,224,.75),transparent);transform:translateX(-120%);animation:llsweep 5s ease-in-out infinite}
@keyframes llsweep{0%{transform:translateX(-120%)}28%{transform:translateX(320%)}100%{transform:translateX(320%)}}
[data-variation=D] .ticker{--fade:1}
[data-variation=D] .ticker .track{-webkit-mask-image:linear-gradient(90deg,transparent 70px,#000 110px);mask-image:linear-gradient(90deg,transparent 70px,#000 110px)}

@media (prefers-reduced-motion: reduce){[data-variation] .ticker .lbl, [data-variation] .ticker .lbl *{animation:none !important}}
"""

AT = """<script>
const at = new URLSearchParams(location.search).get("at");
if (at !== null) { const s = document.createElement("style"); s.textContent = `*,*::before,*::after{animation-play-state:paused!important;animation-delay:-${at}s!important}`; document.head.append(s); }
</script>"""


def main():
    live_css()
    for _, name, tag, _ in OPTIONS:
        assert title_case_ok(name) and title_case_ok(tag), name
    html = clean(fetch("/"))
    _, ticker, _ = chrome(html)
    lbl = re.search(r'<div class="lbl">.*?</div>', ticker, re.S).group(0)
    breathe = lambda el, p: {"element": el, "kind": "breathe", "period_s": p, "reactivity": "ambient", "trigger": "idle", "pace": "slow", "text_moves": False, "flashes": False}
    manifest = {"project": "VC Scout", "subject": "Sidekick Scout: the ticker's Live label", "surface": "component", "claude_rec": "C",
                "compares": ["motion", "visual.fonts", "visual.ornament"],
                "options": [
                    {"id": "A", "name": OPTIONS[0][1], "desc": OPTIONS[0][3], "tokens": {"visual": {"accent": ["#30e1ae", "#c9a45c"], "ornament": "glow dot", "energy": "calm", "fonts": {"display": "source sans 3"}}, "motion": [breathe("live-dot", 3)], "ux": {"attention_cue": "motion"}}},
                    {"id": "B", "name": OPTIONS[1][1], "desc": OPTIONS[1][3], "tokens": {"visual": {"accent": ["#30e1ae"], "ornament": "ring", "energy": "balanced", "fonts": {"display": "source sans 3"}}, "motion": [{"element": "live-ring", "kind": "ping", "period_s": 2, "reactivity": "ambient", "trigger": "idle", "pace": "medium", "text_moves": False, "flashes": False}], "ux": {"attention_cue": "motion"}}},
                    {"id": "C", "name": OPTIONS[2][1], "desc": OPTIONS[2][3], "tokens": {"visual": {"accent": ["#30e1ae"], "ornament": "edge light", "energy": "calm", "fonts": {"display": "bodoni moda"}}, "motion": [breathe("live-edge", 4)], "ux": {"attention_cue": "ornament"}}},
                    {"id": "D", "name": OPTIONS[3][1], "desc": OPTIONS[3][3], "tokens": {"visual": {"accent": ["#c9a45c", "#30e1ae"], "ornament": "sheen", "energy": "balanced", "fonts": {"display": "source sans 3"}}, "motion": [{"element": "live-sheen", "kind": "sweep", "period_s": 5, "reactivity": "ambient", "trigger": "idle", "pace": "slow", "path": "line", "text_moves": False, "flashes": False}], "ux": {"attention_cue": "motion"}}},
                ]}
    main_ = grab(html, '<main id="main">', "main")
    top, _, foot = chrome(html)
    for oid, *_ in OPTIONS:
        man = f'<script type="application/json" id="variation-manifest">\n{json.dumps(manifest, indent=1)}\n</script>' if oid == "A" else ""
        page = f"""<!doctype html>
<html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Today · Sidekick Partners AI Scout</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}"><link rel="stylesheet" href="assets/live-scout.css"><style>{CSS}</style>{man}{AT}</head>
<body data-variation="{oid}"><div class="app">{top}{ticker.replace(lbl, LABEL[oid])}{main_}{foot}</div></body></html>"""
        (HERE / f"R8-{oid}-today.html").write_text(page)
    print("wrote", ", ".join(f"R8-{o}-today.html" for o, *_ in OPTIONS))


if __name__ == "__main__":
    main()
