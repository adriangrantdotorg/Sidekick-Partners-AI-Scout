#!/usr/bin/env python3
"""Page look, round 4: three variations of V5, Emerald Exchange (the futuristic Wall Street).

user, 10-31-26: "show 3 variations of V5." Each keeps V5's dark emerald floor and slow aurora, the logo and the
type; they differ in one big idea each: smoked-glass cards, market lines across the background, or a Wall Street
skyline at night. Writes F1..F3 -today.html / -company.html the bare pages, nothing added. Run: python3 build_round4.py
"""
import importlib.util
import random
from pathlib import Path

# Round 3 registers V5 and loads this folder's build.py; reuse both so everything shares one set of looks.
_spec = importlib.util.spec_from_file_location("pages_round3", Path(__file__).resolve().parent / "build_round3.py")
r3 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(r3)
b, svg = r3.b, r3.svg

V5 = r3.VARIANTS["V5"]["css"]
V5_NO_GRID = V5[:V5.index("body::after{left:0")] + V5[V5.index("@keyframes v5streak"):]
CARD_GLOW = ".block,.start,.must,.deal,.already{box-shadow:inset 0 0 0 1px #c9a45c,0 0 0 1px rgba(48,225,174,.28),0 26px 60px -30px rgba(48,225,174,.55)}"


def market_lines():
    """Two price lines and a faint price grid, one seamless tile wide (the end meets the start), for a slow pan."""
    w, h, n = 1600, 1000, 80
    rnd = random.Random(7)

    def walk(base, amp):
        ys, y = [], 0.0
        for _ in range(n + 1):
            y += rnd.uniform(-1, 1) * amp
            ys.append(y)
        drift = ys[-1] - ys[0]
        return [base + v - drift * i / n for i, v in enumerate(ys)]

    def path(ys):
        return "M" + " L".join(f"{i * w / n:.1f},{y:.1f}" for i, y in enumerate(ys))

    mint, brass = walk(640, 26), walk(430, 18)
    area = path(mint) + f" L{w},{h} L0,{h} Z"
    grid = "".join(f"<line x1='0' y1='{y}' x2='{w}' y2='{y}'/>" for y in range(100, h, 100))
    grid += "".join(f"<line x1='{x}' y1='0' x2='{x}' y2='{h}'/>" for x in range(0, w, 200))
    return svg(f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 {w} {h}' preserveAspectRatio='none'><defs>"
               "<linearGradient id='a' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#30e1ae' stop-opacity='.16'/>"
               "<stop offset='1' stop-color='#30e1ae' stop-opacity='0'/></linearGradient></defs>"
               f"<g stroke='#30e1ae' stroke-opacity='.07' stroke-width='1'>{grid}</g>"
               f"<path d='{area}' fill='url(#a)'/>"
               f"<path d='{path(brass)}' fill='none' stroke='#e3c47e' stroke-opacity='.45' stroke-width='2'/>"
               f"<path d='{path(mint)}' fill='none' stroke='#30e1ae' stroke-opacity='.75' stroke-width='2.5'/></svg>")


def skyline():
    """A stepped, Art Deco skyline (outlines in mint) and, separately, its lit windows, from one seeded layout."""
    w, h = 1600, 520
    rnd = random.Random(1987)
    towers, x = [], -10
    while x < w:
        tw = rnd.randint(46, 112)
        th = rnd.randint(150, 470) if rnd.random() > .25 else rnd.randint(90, 180)
        towers.append((x, tw, th, rnd.random() > .55))
        x += tw + rnd.randint(2, 10)
    body, wins = [], []
    for x, tw, th, stepped in towers:
        top = h - th
        if stepped:
            s1, s2 = tw * .18, tw * .34
            pts = (f"{x},{h} {x},{top + 40} {x + s1},{top + 40} {x + s1},{top + 14} {x + s2},{top + 14} {x + s2},{top} "
                   f"{x + tw - s2},{top} {x + tw - s2},{top + 14} {x + tw - s1},{top + 14} {x + tw - s1},{top + 40} "
                   f"{x + tw},{top + 40} {x + tw},{h}")
            spire = f"<line x1='{x + tw / 2}' y1='{top}' x2='{x + tw / 2}' y2='{top - 34}'/>" if th > 330 else ""
        else:
            pts, spire = f"{x},{h} {x},{top} {x + tw},{top} {x + tw},{h}", ""
        body.append(f"<polygon points='{pts}'/>{spire}")
        for wy in range(int(top) + 52, h - 16, 18):
            for wx in range(int(x) + 8, int(x + tw) - 10, 12):
                if rnd.random() < .2:
                    c = "#e3c47e" if rnd.random() < .7 else "#30e1ae"
                    wins.append(f"<rect x='{wx}' y='{wy}' width='4' height='7' fill='{c}'/>")
    head = f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 {w} {h}' preserveAspectRatio='xMidYMax slice'>"
    city = (head + "<defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#0b3a2c'/>"
            "<stop offset='1' stop-color='#03140f'/></linearGradient></defs>"
            "<g fill='url(#g)' stroke='#30e1ae' stroke-opacity='.38' stroke-width='1.2'>" + "".join(body) + "</g></svg>")
    lit = head + "<g opacity='.75'>" + "".join(wins) + "</g></svg>"
    return svg(city), svg(lit)


CITY, LIT = skyline()

GLASS = """
.block,.start,.must,.deal,.already{--text:#eef6f2;--muted:#b9cfc7;--panel:rgba(7,38,29,.58);--panel2:rgba(14,58,45,.55);
 --line:rgba(201,164,92,.38);--chip:rgba(48,225,174,.13);--chiptext:#c6f5e5;--ringbg:rgba(255,255,255,.14);--ring:#30e1ae;
 --warn:#f2c46e;--accent:#e3c47e;-webkit-backdrop-filter:blur(16px) saturate(1.25);backdrop-filter:blur(16px) saturate(1.25);
 box-shadow:inset 0 1px 0 rgba(48,225,174,.55),inset 0 0 0 1px rgba(201,164,92,.45),0 30px 70px -34px rgba(0,0,0,.8)}
.btn.ghost{border-color:rgba(255,255,255,.28)}
.smp{border-color:#9fb8b0;color:#c9dcd6}
.new{background:#30e1ae;color:#05211a}
.already{border-left-color:#30e1ae}
.art .ring{background:rgba(5,33,26,.85)}
"""

LINES = f"""
body{{background:#05211a}}
body::before{{inset:-10%;background:
 radial-gradient(ellipse 60% 42% at 22% 8%,rgba(48,225,174,.30),transparent 70%),
 radial-gradient(ellipse 55% 50% at 82% 28%,rgba(36,140,104,.50),transparent 70%),
 radial-gradient(ellipse 120% 90% at 50% 40%,transparent 50%,rgba(0,0,0,.55) 100%),#05211a;
 animation:v5aurora 60s ease-in-out infinite alternate}}
body::after{{top:0;bottom:0;left:0;width:200vw;background:{market_lines()} 0 0/100vw 100% repeat-x;
 animation:f2pan 120s linear infinite}}
@keyframes v5aurora{{from{{filter:hue-rotate(0deg) brightness(1)}}to{{filter:hue-rotate(-12deg) brightness(1.12)}}}}
@keyframes f2pan{{from{{transform:translateX(0)}}to{{transform:translateX(-100vw)}}}}
{CARD_GLOW}
"""

SKY = V5_NO_GRID + f"""
main::before{{content:"";position:fixed;z-index:-1;pointer-events:none;left:0;right:0;bottom:0;height:52vh;
 background:{CITY} center bottom/cover no-repeat}}
body::after{{left:0;right:0;bottom:0;height:52vh;background:{LIT} center bottom/cover no-repeat;
 animation:f3lights 16s ease-in-out infinite alternate}}
@keyframes f3lights{{from{{opacity:.35}}to{{opacity:1}}}}
@media (prefers-reduced-motion: reduce){{main::before{{animation:none!important}}}}
"""

OPTIONS = {
    "F1": dict(name="Smoked Glass", ground="#05211a", css=V5 + GLASS,
               desc="Emerald Exchange with the cards turned to smoked emerald glass: the aurora, grid floor and light "
                    "streaks show softly through them, edged in mint light and a brass hairline.",
               motion=[("background", "aurora", 60, "bed"), ("grid", "breathe", 14, "bed"),
                       ("streaks", "travel-line", 40, "line")]),
    "F2": dict(name="Market Lines", ground="#05211a", css=LINES,
               desc="The market itself as the backdrop: a mint price line and a brass one over a faint price grid, "
                    "panning slowly from right to left under the aurora, the way a trading screen scrolls.",
               motion=[("background", "aurora", 60, "bed"), ("chart", "travel-line", 120, "line")]),
    "F3": dict(name="Skyline", ground="#05211a", css=SKY,
               desc="Wall Street at night: a stepped Art Deco skyline traced in mint along the bottom, its office "
                    "windows glowing up and down slowly, the aurora and light streaks above.",
               motion=[("background", "aurora", 60, "bed"), ("windows", "breathe", 16, "bed"),
                       ("streaks", "travel-line", 40, "line")]),
}
REC = "F3"

for fid, o in OPTIONS.items():
    look = dict(b.LOOKS["L3"])
    look["v"] = dict(look["v"], bg=o["ground"])
    look["name"] = o["name"]
    b.LOOKS[fid] = look
    b.EXTRA[fid] = b.EXTRA["L3"] + r3.COMMON + o["css"]

b.add_round("r4", "Design step 3 · round 4", "Emerald Exchange", [(i, o["name"], o["desc"]) for i, o in OPTIONS.items()],
            "⏳ Waiting on your pick · my pick: F3 Skyline",
            {"project": "VC Scout", "subject": "Sidekick Partners AI Scout: Emerald Exchange variations", "surface": "theme",
             "claude_rec": REC, "compares": ["visual.texture", "visual.ornament", "motion"],
             "options": [{"id": i, "name": o["name"], "desc": o["desc"], "tokens": {
                 "visual": dict(b.MANIFEST_TOKENS["L3"]["visual"], bg=o["ground"], base="dark", texture=o["name"].lower(),
                                ornament={"F1": "glass, edge light", "F2": "market lines", "F3": "skyline"}[i],
                                energy="balanced"),
                 "motion": r3.motion_tokens(o)}} for i, o in OPTIONS.items()]},
            ref=("V5", "V5 · your pick"))

if __name__ == "__main__":
    b.build_pages(list(OPTIONS))
