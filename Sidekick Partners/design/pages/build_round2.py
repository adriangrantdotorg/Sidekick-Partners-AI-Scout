#!/usr/bin/env python3
"""Page look, round 2: Boardroom (L3) with a richer green, three textures.

user, 10-31-26, picking L3: "the green blackground needs to feel more luxury, leather texture. almost like the felt
or the texture of a pool table (but of course classy, 80s wall street style)".
Each texture is drawn in code (SVG noise tiles, no image files) and laid under Boardroom's cream cards, unchanged.
Writes T1..T3 -today.html / -company.html, the bare pages, nothing added. Run: python3 build_round2.py
"""
import importlib.util
import json
from pathlib import Path
from urllib.parse import quote

# Load this folder's build.py under its own name: it imports ../logo/build.py as "build".
_spec = importlib.util.spec_from_file_location("pages_build", Path(__file__).resolve().parent / "build.py")
b = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(b)


def tile(svg):
    return "url(\"data:image/svg+xml," + quote(svg, safe="=:/'") + "\")"


# Billiard felt: fine wool fibers with a slight nap (stretched noise), dark specks and light hairs.
FELT_DARK = tile("<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='f'>"
                 "<feTurbulence type='fractalNoise' baseFrequency='0.95 0.55' numOctaves='3' stitchTiles='stitch'/>"
                 "<feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 0.62'/></filter>"
                 "<rect width='100%' height='100%' filter='url(#f)'/></svg>")
FELT_LIGHT = tile("<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='f'>"
                  "<feTurbulence type='fractalNoise' baseFrequency='1.4 0.7' numOctaves='2' seed='7' stitchTiles='stitch'/>"
                  "<feColorMatrix values='0 0 0 0 0.75  0 0 0 0 0.95  0 0 0 0 0.8  0 0 0 1.6 -1.05'/></filter>"
                  "<rect width='100%' height='100%' filter='url(#f)'/></svg>")

# Club leather: a pebbled grain, lit from the upper left so it reads as embossed.
PEBBLE = tile("<svg xmlns='http://www.w3.org/2000/svg' width='360' height='360'><filter id='f'>"
              "<feTurbulence type='turbulence' baseFrequency='0.17' numOctaves='2' seed='3' stitchTiles='stitch' result='n'/>"
              "<feDiffuseLighting in='n' surfaceScale='1.6' lighting-color='#9a9a9a'>"
              "<feDistantLight azimuth='225' elevation='58'/></feDiffuseLighting></filter>"
              "<rect width='100%' height='100%' filter='url(#f)'/></svg>")

# Desk leather: smooth hide with soft mottling and a faint fine grain.
HIDE = tile("<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><filter id='f'>"
            "<feTurbulence type='fractalNoise' baseFrequency='0.012' numOctaves='3' seed='11' stitchTiles='stitch' result='m'/>"
            "<feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' seed='4' stitchTiles='stitch' result='g'/>"
            "<feBlend in='m' in2='g' mode='multiply'/>"
            "<feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 0.55'/></filter>"
            "<rect width='100%' height='100%' filter='url(#f)'/></svg>")

COMMON = ".new{background:#1b5d4a;color:#f3ead6}\n"

TEXTURES = {
    "T1": dict(name="Billiard Felt", ground="#14503a",
               desc="Pool-table baize in a deep billiard green: fine wool fibers with a soft nap, lit from above like "
                    "a lamp over the table, darker toward the edges.",
               css=f"""
body{{background-color:#14503a;
 background-image:radial-gradient(ellipse 70% 55% at 50% 22%,rgba(255,246,214,.13),transparent 70%),
  radial-gradient(ellipse 120% 90% at 50% 40%,transparent 55%,rgba(0,0,0,.42) 100%),{FELT_LIGHT},{FELT_DARK};
 background-size:100% 100%,100% 100%,320px 320px,320px 320px}}
"""),
    "T2": dict(name="Club Leather", ground="#173e30",
               desc="The pebbled green leather of a partners' club chair: an embossed grain lit from the upper left, "
                    "with a soft sheen across the top.",
               css=f"""
body{{background-color:#173e30;
 background-image:radial-gradient(ellipse 80% 50% at 40% 0%,rgba(255,240,205,.10),transparent 70%),
  radial-gradient(ellipse 120% 90% at 50% 40%,transparent 60%,rgba(0,0,0,.38) 100%),{PEBBLE};
 background-size:100% 100%,100% 100%,360px 360px;background-blend-mode:normal,normal,soft-light}}
"""),
    "T3": dict(name="Desk Leather", ground="#174a38",
               desc="A partner's desk: smooth, mottled green hide framed by a gold-tooled double line, the way a "
                    "leather writing inlay sits in a mahogany desk.",
               css=f"""
body{{background-color:#174a38;
 background-image:radial-gradient(ellipse 120% 90% at 50% 40%,transparent 55%,rgba(0,0,0,.36) 100%),{HIDE};
 background-size:100% 100%,400px 400px}}
body::after{{content:"";position:fixed;inset:12px;border:1px solid rgba(201,164,92,.85);outline:1px solid rgba(201,164,92,.45);
 outline-offset:5px;border-radius:2px;pointer-events:none;z-index:5}}
.top{{position:relative;z-index:6}}
"""),
}
REC = "T1"

for tid, t in TEXTURES.items():
    look = dict(b.LOOKS["L3"])
    look["v"] = dict(look["v"], bg=t["ground"])
    look["name"] = t["name"]
    b.LOOKS[tid] = look
    b.EXTRA[tid] = b.EXTRA["L3"] + COMMON + t["css"]


b.add_round("r2", "Design step 3 · round 2", "Texture", [(i, t["name"], t["desc"]) for i, t in TEXTURES.items()],
            "✅ Picked: T1 Billiard Felt (10-31-26)",
            {"project": "VC Scout", "subject": "Sidekick Partners AI Scout: Boardroom background texture", "surface": "theme", "claude_rec": REC,
             "compares": ["visual.texture"],
             "options": [{"id": i, "name": t["name"], "desc": t["desc"], "tokens": {"visual": dict(b.MANIFEST_TOKENS["L3"]["visual"], bg=t["ground"], texture=t["name"].lower())}}
                         for i, t in TEXTURES.items()]})

if __name__ == "__main__":
    b.build_pages(list(TEXTURES))
