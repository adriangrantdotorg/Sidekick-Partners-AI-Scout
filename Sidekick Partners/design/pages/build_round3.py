#!/usr/bin/env python3
"""Page look, round 3: Boardroom's background, softer and more opulent, plus one futuristic Wall Street.

user, 10-31-26, picking T1 (Billiard Felt): "show me four variations where the background is different. the current
version feels too static and rough. looking for softer touch, more opulent. Experiment. Also explore a futuristic one,
perhaps a futuristic Wall Street, but still within that green aesthetic that still matches that corporate vibe."
Every background is drawn in code (gradients and SVG), sits fixed behind the cards (they glide over it as you scroll)
and moves slowly; nothing moves for a visitor who asks for reduced motion. Boardroom's cards, brass and type are
unchanged. Writes V1..V5 -today.html / -company.html, the bare pages, nothing added. Run: python3 build_round3.py
"""
import importlib.util
import json
from pathlib import Path
from urllib.parse import quote

# Load this folder's build.py under its own name: it imports ../logo/build.py as "build".
_spec = importlib.util.spec_from_file_location("pages_build", Path(__file__).resolve().parent / "build.py")
b = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(b)


def svg(s):
    return "url(\"data:image/svg+xml," + quote(s, safe="=:/'") + "\")"


VELVET = svg("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 1000' preserveAspectRatio='xMidYMid slice'>"
             "<filter id='f' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'>"
             "<feTurbulence type='fractalNoise' baseFrequency='0.0026 0.0042' numOctaves='3' seed='9'/>"
             "<feColorMatrix type='saturate' values='0'/>"
             "<feComponentTransfer><feFuncR type='table' tableValues='0.00 0.03 0.07 0.13'/>"
             "<feFuncG type='table' tableValues='0.08 0.17 0.27 0.38'/>"
             "<feFuncB type='table' tableValues='0.06 0.12 0.19 0.27'/>"
             "<feFuncA type='table' tableValues='1 1'/></feComponentTransfer>"
             "<feGaussianBlur stdDeviation='8'/></filter>"
             "<rect width='1600' height='1000' filter='url(#f)'/></svg>")

SILK = svg("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 1000' preserveAspectRatio='xMidYMid slice'><defs>"
           "<pattern id='p' width='8' height='8' patternUnits='userSpaceOnUse' patternTransform='rotate(-6)'>"
           "<rect width='8' height='3.4' fill='#d6f3e6'/></pattern>"
           "<pattern id='q' width='8' height='8' patternUnits='userSpaceOnUse' patternTransform='rotate(-3)'>"
           "<rect width='8' height='3.4' fill='#d6f3e6'/></pattern>"
           "<filter id='w' x='-10%' y='-10%' width='120%' height='120%'>"
           "<feTurbulence type='fractalNoise' baseFrequency='0.0022 0.008' numOctaves='2' seed='4' result='t'/>"
           "<feDisplacementMap in='SourceGraphic' in2='t' scale='150' xChannelSelector='R' yChannelSelector='G'/>"
           "<feGaussianBlur stdDeviation='0.7'/></filter>"
           "<filter id='v' x='-10%' y='-10%' width='120%' height='120%'>"
           "<feTurbulence type='fractalNoise' baseFrequency='0.003 0.006' numOctaves='2' seed='12' result='t'/>"
           "<feDisplacementMap in='SourceGraphic' in2='t' scale='170' xChannelSelector='R' yChannelSelector='G'/>"
           "<feGaussianBlur stdDeviation='0.7'/></filter></defs>"
           "<rect x='-120' y='-120' width='1840' height='1240' fill='url(#p)' filter='url(#w)' opacity='.07'/>"
           "<rect x='-120' y='-120' width='1840' height='1240' fill='url(#q)' filter='url(#v)' opacity='.05'/></svg>")

OGEE = svg("<svg xmlns='http://www.w3.org/2000/svg' width='120' height='168' viewBox='0 0 120 168'>"
           "<g fill='none' stroke='#c9a45c' stroke-opacity='.17' stroke-width='1.1'>"
           "<path d='M60 0C60 42 0 42 0 84C0 126 60 126 60 168M60 0C60 42 120 42 120 84C120 126 60 126 60 168'/></g>"
           "<g fill='#e9f5ee' fill-opacity='.035'>"
           "<path d='M60 0C60 42 0 42 0 84C0 126 60 126 60 168C60 126 120 126 120 84C120 42 60 42 60 0Z'/></g>"
           "<g fill='#c9a45c' fill-opacity='.20'><circle cx='60' cy='84' r='3'/><circle cx='0' cy='0' r='2.2'/>"
           "<circle cx='120' cy='0' r='2.2'/><circle cx='0' cy='168' r='2.2'/><circle cx='120' cy='168' r='2.2'/></g>"
           "<g fill='none' stroke='#c9a45c' stroke-opacity='.15' stroke-width='1'>"
           "<path d='M60 72q6 12 0 24q-6-12 0-24M48 84q12-6 24 0q-12 6-24 0'/></g></svg>")

def perspective_grid():
    """A trading-floor grid drawn flat in perspective (vanishing point at the top center), fading upward."""
    w, h = 1600, 600
    lines = []
    for i in range(-20, 21):
        lines.append(f"<line x1='{800 + i * 120}' y1='{h}' x2='800' y2='0'/>")
    k = 0
    while True:
        y = h / (1 + k * 0.55)
        if y < 14:
            break
        lines.append(f"<line x1='0' y1='{y:.1f}' x2='{w}' y2='{y:.1f}'/>")
        k += 1
    return svg(f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 {w} {h}' preserveAspectRatio='xMidYMax slice'>"
               "<defs><linearGradient id='g' x1='0' y1='1' x2='0' y2='0'><stop offset='0' stop-color='#fff'/>"
               "<stop offset='.45' stop-color='#fff' stop-opacity='.45'/><stop offset='1' stop-color='#fff' stop-opacity='0'/>"
               "</linearGradient><mask id='m'><rect width='100%' height='100%' fill='url(#g)'/></mask></defs>"
               f"<g mask='url(#m)' stroke='#30e1ae' stroke-opacity='.30' stroke-width='1.2'>{''.join(lines)}</g></svg>")


GRID = perspective_grid()


COMMON = """
.new{background:#1b5d4a;color:#f3ead6}
body::before,body::after{content:"";position:fixed;z-index:-1;pointer-events:none}
@media (prefers-reduced-motion: reduce){body::before,body::after{animation:none!important}}
"""

VARIANTS = {
    "V1": dict(name="Emerald Velvet", tag="Opulent", ground="#0e3a2c",
               desc="Crushed velvet in deep emerald: soft, smooth folds with no grain, and a band of light that drifts "
                    "slowly across them, the way a lamp catches velvet when you move.",
               motion=[("background", "sheen", 56, "diagonal")],
               css=f"""
body{{background:#0e3a2c}}
body::before{{inset:-6%;background:radial-gradient(ellipse 120% 90% at 50% 40%,transparent 58%,rgba(0,0,0,.45) 100%),{VELVET} center/cover;
 animation:v1drift 90s ease-in-out infinite alternate}}
body::after{{inset:-40% -60%;background:linear-gradient(112deg,transparent 40%,rgba(200,255,228,.09) 47%,rgba(255,250,235,.05) 51%,transparent 58%);
 animation:v1sheen 56s ease-in-out infinite alternate}}
@keyframes v1drift{{from{{transform:translate3d(-1.5%,-1%,0) scale(1.02)}}to{{transform:translate3d(1.5%,1%,0) scale(1.05)}}}}
@keyframes v1sheen{{from{{transform:translate3d(-28%,0,0)}}to{{transform:translate3d(28%,0,0)}}}}
"""),
    "V2": dict(name="Watered Silk", tag="Opulent", ground="#0f402f",
               desc="Moiré silk, the watermarked fabric of a private bank's wall panels: fine rippling lines that "
                    "shimmer as a slow sheen passes over them.",
               motion=[("background", "sheen", 64, "diagonal")],
               css=f"""
body{{background:#0f402f}}
body::before{{inset:0;background:radial-gradient(ellipse 120% 90% at 50% 40%,transparent 55%,rgba(0,0,0,.42) 100%),
 {SILK} center/cover,radial-gradient(ellipse 80% 60% at 30% 15%,#17583f,transparent 70%),#0f402f}}
body::after{{inset:-40% -60%;background:linear-gradient(105deg,transparent 42%,rgba(214,243,230,.08) 49%,transparent 56%);
 animation:v2sheen 64s ease-in-out infinite alternate}}
@keyframes v2sheen{{from{{transform:translate3d(-30%,0,0)}}to{{transform:translate3d(30%,0,0)}}}}
"""),
    "V3": dict(name="Club Damask", tag="Opulent", ground="#0f3b2d",
               desc="A private club's wallpaper: a tone-on-tone ogee pattern traced in faint brass, warmed by two "
                    "wall-lamp glows that drift slowly.",
               motion=[("background", "aurora", 60, "bed")],
               css=f"""
body{{background:#0f3b2d}}
body::before{{inset:0;background:radial-gradient(ellipse 120% 90% at 50% 40%,transparent 55%,rgba(0,0,0,.42) 100%),
 {OGEE} 0 0/120px 168px,#0f3b2d}}
body::after{{inset:-20%;background:radial-gradient(circle at 25% 25%,rgba(255,214,150,.13),transparent 32%),
 radial-gradient(circle at 75% 60%,rgba(255,214,150,.10),transparent 34%);animation:v3glow 60s ease-in-out infinite alternate}}
@keyframes v3glow{{from{{transform:translate3d(-4%,-2%,0)}}to{{transform:translate3d(4%,3%,0)}}}}
"""),
    "V4": dict(name="Pinstripe Lacquer", tag="Opulent", ground="#0d3528",
               desc="Gordon Gekko's suit on a lacquered library wall: glossy deep green with fine chalk pinstripes, "
                    "and a slow reflection gliding across the gloss.",
               motion=[("background", "sheen", 48, "diagonal")],
               css="""
body{background:#0d3528}
body::before{inset:0;background:
 repeating-linear-gradient(90deg,rgba(226,206,160,.085) 0 1px,transparent 1px 5px,rgba(226,206,160,.05) 5px 6px,transparent 6px 52px),
 radial-gradient(ellipse 120% 90% at 50% 40%,transparent 50%,rgba(0,0,0,.5) 100%),
 radial-gradient(ellipse 70% 45% at 50% 0%,rgba(80,170,130,.30),transparent 70%),
 linear-gradient(180deg,#124636,#0b2e23)}
body::after{inset:-40% -60%;background:linear-gradient(118deg,transparent 44%,rgba(255,255,255,.07) 48%,rgba(255,255,255,.02) 52%,transparent 55%);
 animation:v4sheen 48s ease-in-out infinite alternate}
@keyframes v4sheen{from{transform:translate3d(-30%,0,0)}to{transform:translate3d(30%,0,0)}}
"""),
    "V5": dict(name="Emerald Exchange", tag="Futuristic · stretch", ground="#05211a",
               desc="Wall Street, a few decades on: a dark emerald trading floor, a slow aurora overhead, a softly glowing "
                    "grid floor and thin streaks of light gliding past like a quiet ticker. The cards glow faintly.",
               motion=[("background", "aurora", 60, "bed"), ("grid", "breathe", 14, "bed"),
                       ("streaks", "travel-line", 40, "line")],
               css="""
body{background:#05211a}
body::before{inset:-10%;background:
 linear-gradient(90deg,transparent,rgba(48,225,174,.55),transparent) 0 22%/26% 2px no-repeat,
 linear-gradient(90deg,transparent,rgba(48,225,174,.40),transparent) 0 47%/18% 2px no-repeat,
 linear-gradient(90deg,transparent,rgba(201,164,92,.45),transparent) 0 71%/22% 2px no-repeat,
 radial-gradient(ellipse 60% 42% at 22% 8%,rgba(48,225,174,.34),transparent 70%),
 radial-gradient(ellipse 55% 50% at 82% 28%,rgba(36,140,104,.55),transparent 70%),
 radial-gradient(ellipse 40% 30% at 60% 0%,rgba(201,164,92,.16),transparent 70%),
 radial-gradient(ellipse 120% 90% at 50% 40%,transparent 50%,rgba(0,0,0,.55) 100%),#05211a;
 animation:v5streak 40s linear infinite,v5aurora 60s ease-in-out infinite alternate}
body::after{left:0;right:0;bottom:0;height:58%;background:""" + GRID + """ center bottom/100% 100% no-repeat;
 animation:v5grid 14s ease-in-out infinite alternate}
@keyframes v5streak{from{background-position:-30% 22%,130% 47%,-30% 71%,0 0,0 0,0 0,0 0,0 0}to{background-position:130% 22%,-30% 47%,130% 71%,0 0,0 0,0 0,0 0,0 0}}
@keyframes v5aurora{from{filter:hue-rotate(0deg) brightness(1)}to{filter:hue-rotate(-12deg) brightness(1.12)}}
@keyframes v5grid{from{opacity:.7}to{opacity:1}}
.block,.start,.must,.deal,.already{box-shadow:inset 0 0 0 1px #c9a45c,0 0 0 1px rgba(48,225,174,.28),0 26px 60px -30px rgba(48,225,174,.55)}
"""),
}
REC = "V1"

for vid, v in VARIANTS.items():
    look = dict(b.LOOKS["L3"])
    look["v"] = dict(look["v"], bg=v["ground"])
    look["name"] = v["name"]
    b.LOOKS[vid] = look
    b.EXTRA[vid] = b.EXTRA["L3"] + COMMON + v["css"]


def motion_tokens(v):
    return [{"element": el, "kind": kind, "period_s": per, "reactivity": "ambient", "trigger": "idle", "pace": "slow",
             "text_moves": False, "flashes": False, "path": path} for el, kind, per, path in v["motion"]]


b.add_round("r3", "Design step 3 · round 3", "Background", [(i, t["name"], t["desc"]) for i, t in VARIANTS.items()],
            "⏳ Waiting on your pick · my pick: V1 Emerald Velvet",
            {"project": "VC Scout", "subject": "Sidekick Partners AI Scout: Boardroom background, opulent", "surface": "theme", "claude_rec": REC,
             "compares": ["visual.texture", "motion"],
             "options": [{"id": i, "name": t["name"], "desc": t["desc"], "tokens": {"visual": dict(b.MANIFEST_TOKENS["L3"]["visual"], bg=t["ground"], texture=t["name"].lower(),
                                    energy="balanced" if i == "V5" else "calm"), "motion": motion_tokens(t)}}
                         for i, t in VARIANTS.items()]})

if __name__ == "__main__":
    b.build_pages(list(VARIANTS))
