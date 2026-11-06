"""Sidekick's dark mode, round 1 (user, 11-03-26: "add a dark mode to the app. the current setting is designated its
light mode"). Three dark looks, each drawn on the REAL Today and company pages of the made-up local Scout: the page
the site serves, with its scripts but not the line that picks the look, the option's dark block added after the site's own
CSS, html[data-theme="dark"]. The emerald floor, its motion, the logo and the brass call to action stay; the cream
cards turn dark. The block of the pick is what ships in brand/theme.css.

    (cd Engine && SCOUT_PGLITE=.local-db/sidekick-fixture.tar.gz NEXT_PUBLIC_SCOUT_FIRM=sidekick-partners npx next start -p 4701) &
    python3 "Sidekick Partners/design/pages/build_dark.py"

The pages load the site's CSS and pictures from http://localhost:4701, so that server runs while user looks.
"""
import json
import pathlib
import re
import urllib.request

HERE = pathlib.Path(__file__).parent
SITE = "http://localhost:4701"
PAGES = {"today": "/", "company": "/company/1"}

# the theme's cream-card list (brand/theme.css "the cream cards"): every content section
CARDS = (".x-sec, .x-deal, .x-rounds, .dcol .sec, .x-start, .x-already, .x-notrec, .building .pg, .x-row, .memo, .ph, .ph-lede, "
         ".filters, .x-ftable, .list, .lanes, .pgh, .doc .main, .doc .rail, .snav, .pane, .tabs, .tabadd, .x-rows > .empty, "
         "main > .empty, .today > .empty, .board, [role=\"tabpanel\"] > div > .explain")

OPTIONS = [
    {"id": "A", "name": "Forest Cards", "tag": "On-Brand",
     "desc": "The cards turn Sidekick's own deep forest, a shade above the floor, with cream words and brass rules; links mint.",
     "p": dict(card="#12302a", surface="#173a32", elevated="#1d453b", border="rgba(201,164,92,.40)", text="#f3ead6", text2="#ddd1b4",
               text3="#bcb193", heading="#fbf5e6", link="#30e1ae", gold="#e2c27e", green="#30e1ae", amber="#f0c36b", field="#0d2621",
               chip="#1d453b", chipText="#ecd9a8", track="#2c5348", glow="rgba(48,225,174,.30)")},
    {"id": "B", "name": "Charcoal and Brass", "tag": "On-Brand",
     "desc": "Near-black charcoal cards, like a dark boardroom table: cream words, brass rules and brass links; the green stays on the floor.",
     "p": dict(card="#171a1b", surface="#1e2223", elevated="#262b2c", border="rgba(201,164,92,.42)", text="#efe8d8", text2="#d6cfbf",
               text3="#b3ad9f", heading="#fff8e8", link="#e2c27e", gold="#e2c27e", green="#30e1ae", amber="#f0c36b", field="#111415",
               chip="#262b2c", chipText="#e2c27e", track="#363c3d", glow="rgba(201,164,92,.22)")},
    {"id": "C", "name": "Midnight Teal", "tag": "Stretch",
     "desc": "Deep blue-teal cards with a mint edge light, cool words, mint links: further from the cream look, closer to your dark picks elsewhere.",
     "p": dict(card="#0f1d2b", surface="#142638", elevated="#1a3046", border="rgba(48,225,174,.36)", text="#e6eef2", text2="#c6d3da",
               text3="#a2b3bd", heading="#ffffff", link="#30e1ae", gold="#d8b66c", green="#30e1ae", amber="#f0c36b", field="#0b1622",
               chip="#1a3046", chipText="#9fe9d2", track="#26425c", glow="rgba(48,225,174,.42)")},
]


def dark_css(p):
    """The option's dark block: the card tokens, then every light color the theme writes by hand (brand/theme.css)."""
    d = 'html[data-theme="dark"]'
    cards = ", ".join(f"{d} {s.strip()}" for s in CARDS.split(", "))
    return f"""
/* Sidekick dark mode: the cards (the floor, logo, ticker and brass call to action are the light look's) */
{cards} {{
  --card:{p['card']}; --text:{p['text']}; --text-2:{p['text2']}; --text-3:{p['text3']}; --heading:{p['heading']}; --border:{p['border']};
  --red-ink:{p['link']}; --gold:{p['gold']}; --surface:{p['surface']}; --elevated:{p['elevated']}; --bg-2:{p['surface']};
  --green:{p['green']}; --amber:{p['amber']}; --field:{p['field']}; --shadow:0 18px 44px -18px rgba(0,0,0,.7);
  color-scheme:dark;
}}
/* no box-shadow here: Light joins a page's title, description and filters into one card by turning their own frames
   off (brand/theme.css), and a frame set here put one back on every part (11-03-26: "broken designs - too many boxes") */
/* the search boxes white, with dark words, so they stand out on dark cards (user, 11-03-26: "make the highlight area
   in the screenshot white so it's easier to see") */
{d} :is(.fsearch, .filters .fsearch, .pgh .fsearch, .tabadd .fsearch) {{ background:#ffffff; border-color:#ffffff; }}
{d} .fsearch input {{ color:#1d2622; }}
{d} .fsearch input::placeholder {{ color:#5d6670; }}
{d} .fsearch .ico, {d} .fsearch svg {{ color:#3d4650; }}
{d} .fsearch .kbd {{ color:#3d4650; background:#eef1f4; border-color:#c9cfd6; }}
{d} .fsearch:focus-within {{ border-color:{p['link']}; box-shadow:0 0 0 2px {p['link']}; }}
{d} .building .pg {{ --pg-bg:var(--card); --pg-surface:{p['surface']}; --pg-elev:{p['elevated']}; --pg-border:{p['border']};
  --pg-text:{p['text']}; --pg-text2:{p['text2']}; --pg-text3:{p['text3']}; --pg-head:{p['heading']}; --pg-red:{p['green']};
  --pg-ink:{p['gold']}; --pg-green:{p['green']}; --pg-on-red:{p['card']}; --pg-on-done:#f6f1e4; }}
{d} .x-area {{ background:{p['chip']}; color:{p['chipText']}; }}
{d} .x-st.inv, {d} .x-inv, {d} .x-already b {{ color:{p['gold']}; }}
{d} .x-fit .trk {{ stroke:{p['track']}; }}
{d} .x-bar .tr {{ background:{p['track']}; }}
{d} .x-rtrack, {d} .x-meter i {{ background:{p['elevated']}; }}
{d} .x-acqt tr.lead td, {d} .x-key {{ background:{p['surface']}; }}
{d} .x-steps .done .dot {{ color:#f6f1e4; }}
{d} .x-meta > .x-inv {{ color:{p['gold']} !important; }}
{d} .x-dkey {{ background:{p['surface']}; border-color:{p['border']}; }}
{d} .x-dtable td {{ border-bottom-color:{p['elevated']}; }}
{d} .x-meta > .x-area:first-child {{ color:{p['green']} !important; }}
{d} .x-fit .val {{ stroke:{p['green']}; }}
{d} .x-fit b small, {d} .x-uev.deck, {d} .lane-chip[aria-pressed="true"], {d} .lane-chip[aria-pressed="true"] b {{ color:{p['green']}; }}
{d} .x-bar .tr i, {d} .x-prog i {{ background:{p['green']}; }}
{d} .x-rtrack i {{ background:linear-gradient(90deg, #2a866d, {p['green']}); }}
{d} .x-steps .now .dot, {d} .lane-chip[aria-pressed="true"] {{ border-color:{p['green']}; }}
{d} .tabs button[aria-selected="true"] {{ border-bottom-color:{p['green']}; }}
{d} .x-st.verified {{ background:{p['elevated']}; color:{p['green']}; }}
{d} .lane-chip[aria-pressed="true"], {d} .snav a.on {{ background:{p['elevated']}; }}
{d} .snav a.on {{ border-left-color:{p['green']}; }}
{d} :is(.x-sec a[href^="http"]:not([class]), .sec a[href^="http"]:not([class]), .x-deal a[href^="http"]:not([class]), .x-rounds a[href^="http"]:not([class]), .x-already a, .x-exitnote a, .x-uefyi a, .x-acqt td a:not([class]), .x-deal a[href^="#"]:not([class])) {{ color:{p['link']} !important; }}
"""


def fetch(path):
    return urllib.request.urlopen(SITE + path, timeout=30).read().decode()


def bare(html, css, vid, manifest=None):
    """The site's own page, its scripts on the local Scout (so the live times and the ticker run), every address on the
    local Scout, the dark block after the site's CSS. The look-picking line is left out, so nothing re-themes it."""
    html = re.sub(r"<script>try\{var t=localStorage.*?</script>", "", html, flags=re.S)
    html = re.sub(r'(href|src)="/(?!/)', rf'\1="{SITE}/', html)
    html = re.sub(r'(<html\b[^>]*?)data-theme="[^"]*"', r'\1', html)
    html = html.replace("<html", '<html data-theme="dark"', 1)
    add = f"<style id=\"dark-option\">{css}</style>"
    if manifest:
        add += f'<script type="application/json" id="variation-manifest">{json.dumps(manifest)}</script>'
    html = html.replace("</head>", add + "</head>", 1)
    return re.sub(r"<body\b", f'<body data-variation="{vid}"', html, count=1)


def main():
    src = {k: fetch(v) for k, v in PAGES.items()}
    manifest = {"project": "VC Scout", "subject": "Sidekick Scout dark mode", "surface": "theme", "claude_rec": "A",
                "compares": ["visual.bg", "visual.accent", "visual.base"],
                "options": [{"id": o["id"], "name": o["name"], "desc": o["desc"],
                             "tokens": {"visual": {"bg": o["p"]["card"], "accent": [o["p"]["link"], "#c9a45c"], "base": "dark",
                                                   "ornament": "edge light", "energy": "calm"}}} for o in OPTIONS]}
    out = []
    for kind in PAGES:
        for o in OPTIONS:
            f = HERE / f"D{o['id']}-{kind}.html"
            first = kind == "today" and o["id"] == "A"
            f.write_text(bare(src[kind], dark_css(o["p"]), o["id"], manifest if first else None))
            out.append(f)
    for f in out:
        print(f)


if __name__ == "__main__":
    main()
