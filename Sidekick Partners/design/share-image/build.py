"""Sidekick Partners AI Scout's share image (og:image), Plan step 13, 11-03-26.

LinkedIn draws a link's picture at 1.91:1 (1200 x 627). Each option is a full page at that size, rendered at 2x with
WebKit (~/.local/bin/webshot, never Chrome) to <id>.png beside this file; variations.html shows every option full size,
in a LinkedIn message (552px) and in the phone feed (343px). Reference: Courtside Scout's design/share-image/build.py.

    python3 "Sidekick Partners/design/share-image/build.py"

today.png is the Today page of the made-up local Scout (npm run e2e:sidekick's data) until the launch; after it, take
it from the live site and rebuild. The pick (PICK) ships to brand/opengraph-image.jpg, which Engine copies in.
"""
import base64
import html
import json
import os
import pathlib
import re
import subprocess
import sys
import urllib.request

HERE = pathlib.Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "logo"))
import lockup as LOCKUP  # noqa: E402  the logo's one sizing rule
BRAND = HERE.parent.parent / "brand"
W, H = 1200, 627
WEBSHOT = os.path.expanduser("~/.local/bin/webshot")
FONTS = ("https://fonts.googleapis.com/css2?family=Bodoni+Moda:wght@500;600;700"
         "&family=Cormorant+Garamond:wght@500;600;700&family=Source+Sans+3:wght@400;600;700&display=block")

# Real words only: the site's own name, its share description (brand/share-preview.md) and its footer line.
TITLE = "Sidekick Partners AI Scout"
LINE = "Sourcing Seed and Series A startups in Sidekick Partners' five industries, every fact&nbsp;sourced."
BY = "An independent prototype"
INDUSTRIES = ["Premium Consumer Brands", "Consumer Health", "E-Commerce Software", "Vertical SaaS + Embedded Payments",
              "Tech-Enabled Roll-Ups + AI Services"]
DOMAIN = "sidekick-partners-scout.vercel.app"
ALT = "Sidekick Partners AI Scout, an independent prototype by the user for sourcing Seed and Series A startups."
PICK = "A2"  # user, 11-03-26, on A: "do a version where its just this"

FOREST, MINT, NIGHT, FLOOR, CREAM, BRASS, INK = "#1b5d4a", "#30e1ae", "#0f1f1e", "#05211a", "#f6f1e4", "#c9a45c", "#1d2622"


def fonts_css():
    """Google Fonts inlined as base64, so WebKit never shoots before a font arrives (cached, gitignored)."""
    cache = HERE / ".fonts.css"
    if cache.exists():
        return cache.read_text()
    ua = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36"}
    css = urllib.request.urlopen(urllib.request.Request(FONTS, headers=ua)).read().decode()
    css = re.sub(r"url\((https://[^)]+)\)", lambda m: "url(data:font/woff2;base64," + base64.b64encode(
        urllib.request.urlopen(urllib.request.Request(m.group(1), headers=ua)).read()).decode() + ")", css)
    cache.write_text(css)
    return css


def lockup(h):
    """The logo of record, sized by its one rule (design/logo/lockup.py), on a dark ground: brand/logo.svg carries
    the arrows' glow, so it is only ever drawn on dark."""
    return LOCKUP.html(h, "logo.svg")


def page(css, body, zoom=2):
    return (f'<!doctype html><html><head><meta charset="utf-8"><style>{fonts_css()}'
            f'*{{box-sizing:border-box;margin:0}}html{{zoom:{zoom}}}html,body{{width:{W}px;height:{H}px;overflow:hidden}}'
            f'body{{position:relative;-webkit-font-smoothing:antialiased;font-family:"Source Sans 3",sans-serif;color:#fff}}'
            f'.tag{{display:inline-block;padding:7px 14px;border:1.5px solid {BRASS};border-radius:4px;font:600 18px/1 "Source Sans 3";'
            f'letter-spacing:.08em;color:{BRASS}}}{css}</style></head><body>{body}</body></html>')


def floor_svg(color="rgba(48,225,174,.22)", horizon=360):
    """Emerald Exchange's floor, drawn flat (off-screen WebKit skips a 3D-tilted layer): lines converging on the horizon."""
    lines = []
    for i in range(-14, 15):
        lines.append(f'<line x1="{600 + i * 22}" y1="{horizon}" x2="{600 + i * 150}" y2="{H}" />')
    y, gap = horizon + 8, 6
    while y < H:
        lines.append(f'<line x1="0" y1="{y:.0f}" x2="{W}" y2="{y:.0f}" />')
        gap *= 1.32
        y += gap
    return (f'<svg width="{W}" height="{H}" style="position:absolute;inset:0" stroke="{color}" stroke-width="1.2">'
            f'{"".join(lines)}</svg>')


# ---------- A · After Hours: the logo of record, big, on its night ground ----------
def a():
    css = f"""
body{{background:radial-gradient(80% 120% at 50% 110%,#123b31 0%,{NIGHT} 58%)}}
.edge{{position:absolute;left:0;right:0;bottom:0;height:3px;background:linear-gradient(90deg,transparent,{MINT},transparent);box-shadow:0 0 24px {MINT}}}
.wrap{{position:absolute;left:84px;right:84px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;gap:34px}}
.l{{font:400 31px/1.34 "Source Sans 3";color:#e6efe9;max-width:900px}}
.row{{display:flex;align-items:center;gap:22px}}
.by{{font:400 22px/1 "Source Sans 3";color:#a9c2b8}}
"""
    body = (f'<div class="edge"></div><div class="wrap">{lockup(118)}'
            f'<div class="l">{LINE}</div><div class="row"><span class="tag">Prototype</span><span class="by">{BY}</span></div></div>')
    return page(css, body)


# ---------- A2 · Logo Only: A with nothing but the logo (user, 11-03-26: "do a version where its just this") ----------
def a2():
    css = f"""
body{{background:radial-gradient(80% 120% at 50% 110%,#123b31 0%,{NIGHT} 58%)}}
.edge{{position:absolute;left:0;right:0;bottom:0;height:3px;background:linear-gradient(90deg,transparent,{MINT},transparent);box-shadow:0 0 24px {MINT}}}
.wrap{{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}}
"""
    return page(css, f'<div class="edge"></div><div class="wrap">{lockup(118)}</div>')


# ---------- B · Product Shot: the real Today page, tilted, with a mint edge light ----------
def b():
    css = f"""
body{{background:radial-gradient(70% 90% at 80% 45%,#0f4a3a 0%,{FLOOR} 62%,#03150f 100%)}}
.left{{position:absolute;left:60px;top:0;bottom:0;width:440px;display:flex;flex-direction:column;justify-content:center;gap:22px}}
.big{{font:600 96px/.95 'Bodoni Moda';white-space:nowrap;color:#fff}}.big b{{color:{MINT};font-weight:600}}
.l{{font:400 26px/1.34 "Source Sans 3";color:#e3ece7}}
.by{{font:400 20px/1.2 "Source Sans 3";color:#a9c2b8}}
.stage{{position:absolute;left:530px;top:56px;perspective:1600px}}
.shot{{width:820px;height:558px;border-radius:12px;overflow:hidden;transform:rotateY(-16deg) rotateX(4deg);transform-origin:left center;
 box-shadow:0 0 0 1.5px {MINT}bb,0 0 46px rgba(48,225,174,.45),0 40px 80px rgba(0,0,0,.6)}}
.shot img{{width:820px;display:block}}
"""
    body = (f'<div class="left"><img src="logo.svg" style="height:46px;width:auto;align-self:flex-start" alt="">'
            f'<div class="big"><b>AI</b> Scout</div><span class="tag" style="align-self:flex-start">Prototype</span>'
            f'<div class="l">{LINE}</div><div class="by">{BY}</div></div>'
            f'<div class="stage"><div class="shot"><img src="today.png" alt=""></div></div>')
    return page(css, body)


# ---------- C · Boardroom Card: the site's own cream card on Emerald Exchange's floor ----------
def c():
    chips = "".join(f'<span class="chip">{html.escape(i)}</span>' for i in INDUSTRIES)
    css = f"""
body{{background:linear-gradient(180deg,#0b2e25 0%,{FLOOR} 55%,#031a13 100%)}}
.card{{position:absolute;left:70px;right:70px;top:50%;transform:translateY(-50%);background:{CREAM};border:1.5px solid {BRASS};border-radius:4px;
 padding:0 0 40px;overflow:hidden;display:flex;flex-direction:column;gap:26px;box-shadow:0 0 0 6px rgba(48,225,174,.07),0 0 60px rgba(48,225,174,.22),0 30px 70px rgba(0,0,0,.55);color:{INK}}}
.top{{display:flex;justify-content:space-between;align-items:center;background:#0d2c24;padding:30px 52px;border-bottom:2px solid {BRASS}}}
.top .tag{{color:{BRASS};border-color:{BRASS}}}
.l,.chips,.by{{margin:0 52px}}
.l{{font:400 30px/1.34 "Source Sans 3";color:#2f3833}}
.chips{{display:flex;flex-wrap:wrap;gap:10px}}
.chip{{font:600 18px/1 "Source Sans 3";color:{FOREST};background:#e6efe6;border:1px solid #b9d2c4;border-radius:4px;padding:8px 12px}}
.by{{font:400 21px/1 "Source Sans 3";color:#4f564f}}
"""
    body = (f'{floor_svg()}<div class="card"><div class="top">{lockup(70)}<span class="tag">Prototype</span></div>'
            f'<div class="l">{LINE}</div><div class="chips">{chips}</div><div class="by">{BY}</div></div>')
    return page(css, body)


# ---------- D · Brass Nameplate: an engraved brass desk plate on green leather (an object) ----------
def d():
    css = f"""
body{{background:radial-gradient(90% 80% at 50% 30%,#1d4a3c 0%,#0e2b22 55%,#06170f 100%)}}
.stitch{{position:absolute;inset:22px;border:2px dashed rgba(201,164,92,.35);border-radius:10px}}
.plate{{position:absolute;left:150px;right:150px;top:92px;height:250px;border-radius:10px;
 background:linear-gradient(170deg,#f1dca0 0%,#d2ad5f 22%,#b48a3c 48%,#e3c57f 70%,#a87f34 100%);
 box-shadow:inset 0 2px 0 rgba(255,255,255,.55),inset 0 -3px 0 rgba(80,52,10,.45),0 0 0 3px #6e5220,0 26px 50px rgba(0,0,0,.6);
 display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px}}
.plate::before,.plate::after{{content:"";position:absolute;top:50%;width:16px;height:16px;margin-top:-8px;border-radius:50%;
 background:radial-gradient(circle at 35% 35%,#fff4cf,#8a6526 70%);box-shadow:0 1px 2px rgba(0,0,0,.5)}}
.plate::before{{left:22px}}.plate::after{{right:22px}}
.eng{{font:600 30px/1 'Cormorant Garamond';letter-spacing:.32em;color:#4a3410;text-shadow:0 1px 0 rgba(255,246,214,.65);font-variant:small-caps}}
.big{{font:600 92px/1 'Bodoni Moda';letter-spacing:.04em;color:#3f2c0b;text-shadow:0 1.5px 0 rgba(255,246,214,.7),0 -1px 0 rgba(60,40,5,.35)}}
.below{{position:absolute;left:0;right:0;top:380px;display:flex;flex-direction:column;align-items:center;gap:20px;text-align:center}}
.l{{font:400 28px/1.34 "Source Sans 3";color:#e9e1c9;max-width:900px}}
.row{{display:flex;gap:20px;align-items:center}}.by{{font:400 21px/1 "Source Sans 3";color:#c8bb95}}
"""
    body = (f'<div class="stitch"></div><div class="plate"><div class="eng">Sidekick Partners</div><div class="big">AI SCOUT</div></div>'
            f'<div class="below"><div class="l">{LINE}</div><div class="row"><span class="tag">Prototype</span><span class="by">{BY}</span></div></div>')
    return page(css, body)


# ---------- E · Type Poster: one face, huge size contrast, no glow, no logo picture ----------
def e():
    css = f"""
body{{background:{CREAM};color:{INK}}}
.k{{position:absolute;left:80px;top:70px;font:600 30px/1 'Cormorant Garamond';letter-spacing:.2em;font-variant:small-caps;color:{FOREST}}}
.big{{position:absolute;left:68px;top:96px;font:500 250px/1 'Cormorant Garamond';letter-spacing:-.01em;color:{INK};white-space:nowrap}}
.rule{{position:absolute;left:80px;right:80px;top:396px;height:3px;background:{BRASS}}}
.l{{position:absolute;left:80px;right:80px;top:424px;font:400 29px/1.34 "Source Sans 3";color:#2f3833}}
.by{{position:absolute;left:80px;bottom:56px;font:400 21px/1 "Source Sans 3";color:#4f564f}}
.tag{{position:absolute;right:80px;bottom:50px;color:#7a5a1c}}
"""
    body = (f'<div class="k">Sidekick Partners</div><div class="big">AI Scout</div><div class="rule"></div>'
            f'<div class="l">{LINE}</div><div class="by">{BY}</div><span class="tag">Prototype</span>')
    return page(css, body)


V = lambda **k: {"visual": k}
OPTIONS = [
    {"id": "A", "name": "After Hours", "fn": a, "tag": "On-Profile",
     "desc": "The logo of record, big, on its night ground, with a mint edge light along the bottom.",
     "tokens": V(bg=NIGHT, accent=[MINT], ornament="edge light", energy="calm", layout="logo banner",
                 fonts={"display": "bodoni moda", "body": "source sans 3"})},
    {"id": "A2", "name": "Logo Only", "fn": a2, "tag": "Your Pick, Refined",
     "desc": "After Hours with nothing but the logo: Sidekick's wordmark and arrows, the mint rule and AI SCOUT, centered on the night ground, the mint edge light along the bottom.",
     "tokens": V(bg=NIGHT, accent=[MINT], ornament="edge light", energy="calm", layout="logo only",
                 fonts={"display": "bodoni moda"})},
    {"id": "B", "name": "Product Shot", "fn": b, "tag": "On-Profile",
     "desc": "The real Today page tilted with a mint edge light, the name big on the left (Courtside's pick, in Sidekick's look). Sample startups until the launch; then the live page.",
     "tokens": V(bg=FLOOR, accent=[MINT], ornament="edge light", energy="balanced", layout="product shot",
                 fonts={"display": "bodoni moda", "body": "source sans 3"})},
    {"id": "C", "name": "Boardroom Card", "fn": c, "tag": "On-Profile",
     "desc": "The site's own cream card with its brass rule, floating over Emerald Exchange's floor, the five industries as chips.",
     "tokens": V(bg=FLOOR, accent=[BRASS, MINT], ornament="edge light", energy="calm", layout="card on floor",
                 fonts={"display": "bodoni moda", "body": "source sans 3"})},
    {"id": "D", "name": "Brass Nameplate", "fn": d, "tag": "Stretch: an Object",
     "desc": "An engraved brass desk plate on stitched green leather: AI SCOUT in Bodoni, Sidekick Partners in small capitals.",
     "tokens": V(bg="#0e2b22", accent=[BRASS], ornament="object", energy="calm", layout="physical object",
                 fonts={"display": "bodoni moda", "body": "source sans 3"})},
    {"id": "E", "name": "Type Poster", "fn": e, "tag": "Stretch: Type Only",
     "desc": "Cream paper, one giant Cormorant AI Scout, one brass rule, the line. No logo picture, no glow.",
     "tokens": V(bg=CREAM, accent=[BRASS], ornament="none", energy="calm", layout="type poster", base="light",
                 fonts={"display": "cormorant garamond", "body": "source sans 3"})},
]


def render(src, out):
    if out.exists():
        out.unlink()
    subprocess.run([WEBSHOT, str(src), str(out), str(W * 2), str(H * 2), "--wait", "1.2"], capture_output=True, timeout=90)
    assert out.exists() and out.stat().st_size > 10000, out


def preview_card(png, width):
    """How a shared link reads in LinkedIn: the picture, then the page title and the domain under it."""
    return (f'<div class="li" style="width:{width}px"><img src="{png}" alt="" width="{width}">'
            f'<div class="li-t"><b>{TITLE} (prototype)</b><span>{DOMAIN}</span></div></div>')


ROUND_LEDE = (f"The picture LinkedIn, Slack, iMessage and X show when someone shares {DOMAIN}. Today there is none, so a "
              "shared link would show a grey box. Each option is 1200 x 627 (LinkedIn's size), shown full size, in a "
              "LinkedIn message and in the phone feed. The words are the site's own: its name, its share description "
              "and its footer line.")
FINAL_LEDE = (f"The share image that ships: what LinkedIn, Slack, iMessage and X show when someone shares {DOMAIN}. "
              "Shown full size (1200 x 627), in a LinkedIn message and in the phone feed, with the site's title and "
              "address under it as LinkedIn draws them.")


def gallery(only=None):
    manifest = {"project": "VC Scout", "subject": "Sidekick Scout share image (LinkedIn link preview)",
                "surface": "layout", "claude_rec": "B", "compares": ["visual.layout", "visual.ornament", "visual.font"],
                "options": [{"id": o["id"], "name": o["name"], "desc": o["desc"], "tokens": o["tokens"]} for o in OPTIONS]}
    cards = []
    for o in [x for x in OPTIONS if not only or x["id"] == only]:
        png = f"{o['id'].lower()}.png"
        st = "st" if o["tag"].startswith("Stretch") else "on"
        cards.append(f'''<section class="var" data-variation="{o['id']}" id="opt-{o['id']}">
<h2><span class="id">{o['id']}</span>{html.escape(o['name'])}<span class="tag {st}">{o['tag']}</span></h2>
<p>{html.escape(o['desc'])}</p>
<img class="full" src="{png}" alt="{html.escape(o['name'])}">
<div class="sizes"><div><h3>In a LinkedIn Message (Laptop)</h3>{preview_card(png, 552)}</div>
<div><h3>In the Feed (Phone)</h3>{preview_card(png, 343)}</div></div>
<a class="dl" href="{png}" download="sidekick-scout-share-{o['id'].lower()}.png">Download PNG</a></section>''')
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sidekick Scout Share Image{' · Final' if only else ''}</title><style>{fonts_css()}
:root{{--bg:#05211a;--card:#0d2c24;--line:#22493d;--text:#f3ead6;--dim:#c9c0a6;--brass:#c9a45c;--mint:#30e1ae}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--text);font:400 18px/1.55 "Source Sans 3",sans-serif;padding:40px 16px 80px}}
main{{max-width:1240px;margin:0 auto;display:grid;gap:40px}}
header h1{{font:600 46px/1 "Cormorant Garamond";font-variant:small-caps;letter-spacing:.04em;margin:0 0 10px}}header p{{color:var(--dim);margin:0;max-width:900px}}
.var{{background:var(--card);border:1px solid var(--line);border-radius:4px;padding:24px}}
.var h2{{display:flex;align-items:center;flex-wrap:wrap;gap:14px;margin:0 0 6px;font:600 30px/1.2 "Cormorant Garamond"}}
.id{{display:inline-grid;place-items:center;width:40px;height:40px;border-radius:4px;background:var(--brass);color:#10261f;font:700 22px/1 "Source Sans 3"}}
.tag{{font:600 14px/1 "Source Sans 3";letter-spacing:.06em;padding:6px 10px;border-radius:4px;border:1px solid}}
.tag.on{{color:var(--mint);border-color:#30e1ae66}}.tag.st{{color:var(--brass);border-color:#c9a45c88}}
.var p{{color:var(--dim);margin:0 0 18px;max-width:900px}}
.full{{width:100%;height:auto;display:block;border-radius:4px;aspect-ratio:1200/627}}
.sizes{{display:flex;flex-wrap:wrap;gap:32px;margin-top:22px;align-items:flex-start}}
.sizes h3{{font:600 15px/1 "Source Sans 3";letter-spacing:.04em;color:var(--dim);margin:0 0 10px}}
.li{{max-width:100%;border:1px solid #3a3b42;border-radius:8px;overflow:hidden;background:#1b1f23}}.li img{{display:block;width:100%;height:auto}}
.li-t{{padding:12px 14px;display:grid;gap:4px}}.li-t b{{font:600 17px/1.3 -apple-system,Helvetica,sans-serif;color:#fff}}.li-t span{{font:400 14px/1.3 -apple-system,Helvetica,sans-serif;color:#b0b7bf}}
.dl{{display:inline-block;margin-top:20px;padding:10px 16px;border:1px solid var(--brass);border-radius:4px;color:var(--text);text-decoration:none;font:600 15px/1 "Source Sans 3"}}
</style></head><body><main><header><h1>Sidekick Scout Share Image{' · Final' if only else ''}</h1>
<p>{FINAL_LEDE if only else ROUND_LEDE}</p></header>
{"".join(cards)}</main>
{'' if only else '<script type="application/json" id="variation-manifest">' + json.dumps(manifest) + '</script>'}</body></html>'''


def main():
    for o in OPTIONS:
        src = HERE / f"{o['id'].lower()}.html"
        src.write_text(o["fn"]())
        render(src, HERE / f"{o['id'].lower()}.png")
        print("rendered", o["id"], o["name"])
    out = HERE / "variations.html"
    out.write_text(gallery())
    json.loads(re.search(r'id="variation-manifest">(.*?)</script>', out.read_text(), re.S).group(1))
    print("wrote", out)
    if PICK:
        # the pick as it ships, on the same preview page as the round (user, 11-03-26: "I want to see it on a
        # preview page like the others"): full size, in a LinkedIn message and in the phone feed
        (HERE / "final.html").write_text(gallery(only=PICK))
        print("wrote", HERE / "final.html")
        # The pick ships as a JPEG at 2x (about 0.4 MB) beside the firm's other brand files; Engine copies it in.
        subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "90", str(HERE / f"{PICK.lower()}.png"),
                        "--out", str(BRAND / "opengraph-image.jpg")], capture_output=True, check=True)
        (BRAND / "opengraph-image.alt.txt").write_text(ALT + "\n")
        print("shipped", PICK, "to", BRAND / "opengraph-image.jpg")


if __name__ == "__main__":
    main()
