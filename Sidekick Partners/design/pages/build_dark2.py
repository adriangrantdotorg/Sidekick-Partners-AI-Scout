"""Sidekick's dark mode, round 2 (user, 11-03-26, on round 1's Charcoal and Brass Pipeline: "All the brown here is
hard to read. This page needs to be redesigned. show 3 variations. The color scheme doesn't work here. It's too dark.").
Measured on that page: 45 pieces of text in the warm grey #b3ad9f (headers, industry, Found, counts, filter labels) read
as brown on charcoal. Each option is lighter, with neutral or cool greys for the words; brass stays only on the call to
action and the card rules, mint on links and bars. Drawn on the REAL Pipeline of the made-up local Scout, like round 1
(build_dark.py's page and dark block).

    (cd Engine && SCOUT_PGLITE=.local-db/sidekick-fixture.tar.gz NEXT_PUBLIC_SCOUT_FIRM=sidekick-partners npx next start -p 4701) &
    python3 "Sidekick Partners/design/pages/build_dark2.py"
"""
import json
import pathlib

import build_dark as R1

HERE = pathlib.Path(__file__).parent
PAGES = {"pipeline": "/pipeline", "today": "/"}

OPTIONS = [
    {"id": "A", "name": "Graphite", "tag": "On-Brand",
     "desc": "Lighter graphite cards, white and neutral grey words (no warm tones), mint links, money in a light brass.",
     "p": dict(card="#2a2f31", surface="#333a3c", elevated="#3d4547", border="rgba(255,255,255,.16)", text="#f4f6f5", text2="#d9dedc",
               text3="#b8c0bd", heading="#ffffff", link="#5be8be", gold="#ecd394", green="#43e0b2", amber="#f5c96f", field="#23282a",
               chip="#3d4547", chipText="#e7ecea", track="#4a5355", glow="rgba(48,225,174,.26)")},
    {"id": "B", "name": "Evening Forest", "tag": "On-Brand",
     "desc": "Cards in a lighter Sidekick green, a shade above the floor, with white and pale-green words; mint links, light brass money.",
     "p": dict(card="#1f3f36", surface="#264a40", elevated="#2e554a", border="rgba(255,255,255,.16)", text="#f4f9f7", text2="#d5e5df",
               text3="#b2c9c0", heading="#ffffff", link="#5be8be", gold="#ecd394", green="#43e0b2", amber="#f5c96f", field="#183229",
               chip="#2e554a", chipText="#e3f0eb", track="#3b6457", glow="rgba(48,225,174,.32)")},
    {"id": "C", "name": "Slate Blue", "tag": "Stretch",
     "desc": "Cool slate-blue cards with white and blue-grey words, mint links: the furthest from the cream look, closest to your dark picks elsewhere.",
     "p": dict(card="#253243", surface="#2d3b4e", elevated="#364659", border="rgba(255,255,255,.16)", text="#f2f6fa", text2="#d2dbe5",
               text3="#adbaca", heading="#ffffff", link="#62e3c0", gold="#f0d690", green="#43e0b2", amber="#f5c96f", field="#1e2938",
               chip="#364659", chipText="#e4ebf3", track="#43556b", glow="rgba(98,227,192,.30)")},
]


def rendered(path):
    """The page as the browser draws it (the Pipeline draws its rows in the browser), its scripts then removed so the
    saved page stays as drawn (render_dom.mjs, run from Engine/ for its Playwright)."""
    import re
    import subprocess
    html = subprocess.run(["node", str(HERE / "render_dom.mjs"), R1.SITE + path], cwd=HERE.parent.parent.parent / "Engine",
                          capture_output=True, text=True, timeout=120, check=True).stdout
    return re.sub(r"<script\b[^>]*>.*?</script>", "", html, flags=re.S)


def main():
    src = {k: rendered(v) for k, v in PAGES.items()}
    manifest = {"project": "VC Scout", "subject": "Sidekick Scout dark mode, round 2 (Pipeline)", "surface": "theme", "claude_rec": "A",
                "compares": ["visual.bg", "visual.text_temperature", "visual.base"],
                "options": [{"id": o["id"], "name": o["name"], "desc": o["desc"],
                             "tokens": {"visual": {"bg": o["p"]["card"], "accent": [o["p"]["link"], "#c9a45c"], "base": "dark",
                                                   "text_temperature": "neutral" if o["id"] == "A" else "cool", "energy": "calm"}}} for o in OPTIONS]}
    for kind in PAGES:
        for o in OPTIONS:
            f = HERE / f"E{o['id']}-{kind}.html"
            first = kind == "pipeline" and o["id"] == "A"
            f.write_text(R1.bare(src[kind], R1.dark_css(o["p"]), o["id"], manifest if first else None))
            print(f)


if __name__ == "__main__":
    main()
