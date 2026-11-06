"""Sidekick's dark mode, round 3 (user, 11-03-26, on round 2's Slate Blue Today: "Show me another variation of a dark
background that is similar to this, but closer to black or dark gray ... Show me two variations"). Slate Blue's cool
words, mint links and light-brass money, on darker cards; drawn on Today, Filings and Tracking, where round 2 showed
"too many boxes" (build_dark.py's dark block no longer frames each part of a page's header).

    python3 "Sidekick Partners/design/pages/build_dark3.py"   (the made-up local Scout on :4701)
"""
import pathlib

import build_dark as R1
import build_dark2 as R2

HERE = pathlib.Path(__file__).parent
PAGES = {"today": "/", "filings": "/filings", "tracking": "/tracking"}
OPTIONS = [
    {"id": "D", "name": "Slate Ink", "tag": "Your Pick, Darker",
     "desc": "Slate Blue taken nearly to black: deep blue-black cards, white and blue-grey words, mint links.",
     "p": dict(card="#141b24", surface="#1b2430", elevated="#232e3b", border="rgba(255,255,255,.14)", text="#f2f6fa", text2="#cfd8e2",
               text3="#a8b5c3", heading="#ffffff", link="#62e3c0", gold="#f0d690", green="#43e0b2", amber="#f5c96f", field="#10161e",
               chip="#232e3b", chipText="#e4ebf3", track="#33414f", glow="rgba(98,227,192,.26)")},
    {"id": "E", "name": "Blue Charcoal", "tag": "Your Pick, Darker",
     "desc": "A dark charcoal gray with only a hint of blue: neutral cards, white and cool-grey words, mint links.",
     "p": dict(card="#191c21", surface="#21252b", elevated="#2a2f36", border="rgba(255,255,255,.14)", text="#f3f5f8", text2="#d3d8de",
               text3="#aeb5bf", heading="#ffffff", link="#62e3c0", gold="#f0d690", green="#43e0b2", amber="#f5c96f", field="#14171b",
               chip="#2a2f36", chipText="#e6e9ee", track="#383e46", glow="rgba(98,227,192,.22)")},
]


def main():
    src = {k: R2.rendered(v) for k, v in PAGES.items()}
    manifest = {"project": "VC Scout", "subject": "Sidekick Scout dark mode, round 3 (darker Slate Blue)", "surface": "theme", "claude_rec": "D",
                "compares": ["visual.bg"],
                "options": [{"id": o["id"], "name": o["name"], "desc": o["desc"],
                             "tokens": {"visual": {"bg": o["p"]["card"], "accent": [o["p"]["link"]], "base": "dark", "text_temperature": "cool", "energy": "calm"}}} for o in OPTIONS]}
    for kind in PAGES:
        for o in OPTIONS:
            f = HERE / f"F{o['id']}-{kind}.html"
            f.write_text(R1.bare(src[kind], R1.dark_css(o["p"]), o["id"], manifest if kind == "today" and o["id"] == "D" else None))
            print(f)


if __name__ == "__main__":
    main()
