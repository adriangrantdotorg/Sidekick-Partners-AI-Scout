#!/usr/bin/env python3
"""Sidekick Partners AI Scout: logo variations (design step 2).

Writes logo-variations.html beside this file. Sidekick's wordmark and arrows come from its own
files (assets/, taken from sidekickpartners.com on 10-31-26) and are only recolored; option C's
third arrow and option D's seal are new drawing. Run: python3 build.py
"""
import itertools
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "logo-variations.html"

# Sidekick's own colors (sidekickpartners.com), plus the jade of its arrow mark.
FOREST, MINT, SAGE, PALE, TEAL, INK = "#1b5d4a", "#30e1ae", "#47846c", "#f4f9f8", "#223e3f", "#212121"
JADE, IVORY, NIGHT = "#2a866d", "#fbfaf6", "#0f1f1e"
SEAL, GOLD = "#154a3b", "#e3c47e"  # option D only (the stretch)

_ids = itertools.count(1)

# The logo PNG is 1817 x 463. The arrows sit top right; these two shapes split them from the wordmark.
WORD_ONLY = "0,0 1505,0 1505,235 1640,235 1640,463 0,463"
ARROW_ONLY = "1505,0 1817,0 1817,463 1640,463 1640,235 1505,235"


def logo(color, height, mark=None, arrows=True, glow=None):
    """Sidekick's real logo, recolored. mark = the arrows' color; arrows=False drops them."""
    i = next(_ids)
    w = 1817 if arrows else 1600
    mark = mark or color
    glow_def = ""
    glow_attr = ""
    if glow:
        glow_def = (f'<filter id="g{i}" x="-20%" y="-20%" width="140%" height="140%">'
                    f'<feGaussianBlur stdDeviation="22" result="b"/>'
                    f'<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>')
        glow_attr = f' filter="url(#g{i})"'
    arrow_part = ""
    if arrows:
        arrow_part = (f'<g{glow_attr}><g mask="url(#m{i})"><rect clip-path="url(#a{i})" width="1817" '
                      f'height="463" fill="{mark}"/></g></g>')
    return (
        f'<svg class="logo" viewBox="0 0 {w} 463" height="{height}" width="{height * w / 463:.0f}" '
        f'role="img" aria-label="Sidekick"><defs>'
        f'<mask id="m{i}" maskUnits="userSpaceOnUse" x="0" y="0" width="1817" height="463">'
        f'<image href="assets/sk-white.png" x="0" y="0" width="1817" height="463"/></mask>'
        f'<clipPath id="w{i}"><polygon points="{WORD_ONLY}"/></clipPath>'
        f'<clipPath id="a{i}"><polygon points="{ARROW_ONLY}"/></clipPath>{glow_def}</defs>'
        f'<g mask="url(#m{i})"><rect clip-path="url(#w{i})" width="1817" height="463" fill="{color}"/></g>'
        f'{arrow_part}</svg>'
    )


# Sidekick's arrow mark as shapes, traced from its favicon (856 x 856), plus option C's third arrow.
OUTER = "140,42 804,42 804,706 677,822 677,168 23,168"
INNER = "140,297 550,297 550,706 423,822 423,424 23,424"
THIRD = "140,552 296,552 296,706 169,822 169,680 23,680"


def arrows(size, outer, inner, third=None, glow=None):
    i = next(_ids)
    glow_def = glow_attr = ""
    if glow:
        glow_def = (f'<defs><filter id="g{i}" x="-25%" y="-25%" width="150%" height="150%">'
                    f'<feGaussianBlur stdDeviation="40" result="b"/>'
                    f'<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>')
        glow_attr = f' filter="url(#g{i})"'
    third_poly = f'<polygon points="{THIRD}" fill="{third}"/>' if third else ""
    return (f'<svg class="mark" viewBox="23 42 781 780" width="{size}" height="{size}" aria-hidden="true">'
            f'{glow_def}<g{glow_attr}><polygon points="{OUTER}" fill="{outer}"/>'
            f'<polygon points="{INNER}" fill="{inner}"/>{third_poly}</g></svg>')


def seal(size, words=True):
    """Option D: a round seal with Sidekick's arrows in the middle."""
    i = next(_ids)
    text = ""
    if words:
        text = (
            f'<path id="t{i}" d="M 48,200 A 152,152 0 0 1 352,200" fill="none"/>'
            f'<path id="b{i}" d="M 30,200 A 170,170 0 0 0 370,200" fill="none"/>'
            f'<text class="seal-t"><textPath href="#t{i}" startOffset="50%" text-anchor="middle">'
            f'SIDEKICK PARTNERS</textPath></text>'
            f'<text class="seal-t"><textPath href="#b{i}" startOffset="50%" text-anchor="middle">'
            f'AI SCOUT</textPath></text>'
            f'<circle cx="34" cy="214" r="4" fill="{GOLD}"/><circle cx="366" cy="214" r="4" fill="{GOLD}"/>'
        )
        ring = (f'<circle cx="200" cy="200" r="190" fill="{SEAL}" stroke="{GOLD}" stroke-width="6"/>'
                f'<circle cx="200" cy="200" r="141" fill="none" stroke="{GOLD}" stroke-width="2"/>')
        mark = (f'<g transform="translate(118 118) scale(0.21)"><polygon points="{OUTER}" fill="{GOLD}"/>'
                f'<polygon points="{INNER}" fill="{GOLD}"/></g>')
    else:
        ring = f'<circle cx="200" cy="200" r="186" fill="{SEAL}" stroke="{GOLD}" stroke-width="14"/>'
        mark = (f'<g transform="translate(88 86) scale(0.29)"><polygon points="{OUTER}" fill="{GOLD}"/>'
                f'<polygon points="{INNER}" fill="{GOLD}"/></g>')
    return (f'<svg class="seal" viewBox="0 0 400 400" width="{size}" height="{size}" aria-hidden="true">'
            f'{ring}{text}{mark}</svg>')


NAV = ["Today", "Pipeline", "IC Meeting", "Trends", "Tracking", "Backtest", "Funding ▾"]


def header(bg, fg, line, brand):
    items = "".join(f"<span>{n}</span>" for n in NAV)
    return (f'<div class="hdr" style="background:{bg};color:{fg};border-bottom:1px solid {line}">'
            f'<div class="hdr-brand">{brand}</div><nav>{items}</nav></div>')


def tab(icon, dark=False):
    cls = "tab dark" if dark else "tab"
    return (f'<div class="{cls}"><span class="fav fav32">{icon}</span>'
            f'<span>Sidekick Partners AI Scout</span><b>×</b></div>'
            f'<div class="favs"><span class="fav fav64">{icon}</span><span class="fav fav32">{icon}</span>'
            f'<span class="fav fav16">{icon}</span><small>64 · 32 · 16 px</small></div>')


def favicon(bg, inner):
    return f'<span class="fav-box" style="background:{bg}">{inner}</span>'


# ---------- the five options ----------

def opt_a():
    def lock(fg, sub, mark, rule, h=118):
        return (f'<div class="lkA" style="color:{fg}">{logo(fg, h, mark=mark)}'
                f'<div class="a-rule" style="--r:{rule}"><i></i><b>◆</b><i></i></div>'
                f'<div class="a-sub" style="color:{sub}">Partners</div>'
                f'<div class="a-name">AI Scout</div></div>')
    hdr_brand = (f'{logo(FOREST, 34, mark=JADE)}<span class="hb-rule" style="background:{SAGE}"></span>'
                 f'<span class="hb-a">AI Scout</span>')
    return dict(
        hero=(PALE, lock(FOREST, TEAL, JADE, MINT)),
        rev=(FOREST, lock(PALE, "#cfe9e0", MINT, MINT, h=88)),
        hdr=header("#ffffff", INK, "#dfe8e5", hdr_brand),
        fav=favicon(PALE, arrows(22, JADE, JADE)),
        dark_tab=False,
    )


def opt_b():
    def lock(fg, plate_bg, plate_fg, line, h=104):
        return (f'<div class="lkB"><div class="b-left">{logo(fg, h, mark=JADE if fg == INK else MINT)}'
                f'<div class="b-sub" style="color:{fg}">Partners</div></div>'
                f'<span class="b-rule" style="background:{line}"></span>'
                f'<span class="plate" style="background:{plate_bg};color:{plate_fg};'
                f'box-shadow:inset 0 0 0 5px {plate_bg},inset 0 0 0 6px {plate_fg}">AI SCOUT</span></div>')
    hdr_brand = (f'{logo(INK, 32, mark=JADE)}<span class="plate plate-sm" style="background:{FOREST};color:{PALE};'
                 f'box-shadow:inset 0 0 0 3px {FOREST},inset 0 0 0 4px {PALE}">AI SCOUT</span>')
    return dict(
        hero=(IVORY, lock(INK, FOREST, PALE, SAGE)),
        rev=(TEAL, lock(PALE, PALE, FOREST, SAGE, h=80)),
        hdr=header(IVORY, INK, "#e6e2d6", hdr_brand),
        fav=favicon(FOREST, arrows(20, PALE, PALE)),
        dark_tab=False,
    )


def opt_c():
    def lock(fg, a1, a2, a3, accent, size=190, h=86):
        return (f'<div class="lkC">{arrows(size, a1, a2, a3)}<div class="c-text">{logo(fg, h, arrows=False)}'
                f'<div class="c-line" style="color:{fg}">Partners <em style="color:{accent}">AI Scout</em></div>'
                f'</div></div>')
    hdr_brand = (f'{arrows(40, PALE, PALE, MINT)}{logo(PALE, 30, arrows=False)}'
                 f'<span class="hb-c">Partners <em>AI Scout</em></span>')
    return dict(
        hero=(TEAL, lock(PALE, PALE, PALE, MINT, MINT)),
        rev=(PALE, lock(FOREST, FOREST, FOREST, "#22c08f", FOREST, size=140, h=64)),
        hdr=header(TEAL, PALE, "#2f5455", hdr_brand),
        fav=favicon(TEAL, arrows(22, PALE, PALE, MINT)),
        dark_tab=True,
    )


def opt_d():
    def lock(fg, size=270, h=84):
        return (f'<div class="lkD">{seal(size)}<div class="d-text">{logo(fg, h, mark=fg)}'
                f'<div class="d-rule"></div><div class="d-name" style="color:{fg}">AI SCOUT</div></div></div>')
    hdr_brand = (f'{seal(46, words=False)}{logo(FOREST, 30, mark=FOREST)}'
                 f'<span class="hb-d">AI SCOUT</span>')
    return dict(
        hero=(IVORY, lock(FOREST)),
        rev=(FOREST, lock(PALE, size=200, h=64)),
        hdr=header(IVORY, INK, "#e6e2d6", hdr_brand),
        fav=f'<span class="fav-seal">{seal(64, words=False)}</span>',
        dark_tab=False,
    )


def opt_e():
    def lock(fg, mark, accent, glow, h=104):
        shadow = f"0 0 14px 2px {accent}" if glow else "none"
        return (f'<div class="lkE">{logo(fg, h, mark=mark, glow=glow)}'
                f'<span class="e-rule" style="background:{accent};box-shadow:{shadow}"></span>'
                f'<div class="e-text"><div class="e-name" style="color:{accent}">AI SCOUT</div>'
                f'<div class="e-sub" style="color:{fg}">Partners</div></div></div>')
    hdr_brand = (f'{logo(PALE, 32, mark=MINT, glow=True)}<span class="e-rule e-rule-sm"></span>'
                 f'<span class="hb-e">AI SCOUT</span>')
    return dict(
        hero=(NIGHT, lock(PALE, MINT, MINT, True)),
        rev=(PALE, lock(FOREST, JADE, FOREST, False, h=80)),
        hdr=header(NIGHT, PALE, "#1d3a37", hdr_brand),
        fav=favicon(NIGHT, arrows(22, MINT, MINT, glow=True)),
        dark_tab=True,
    )


OPTIONS = [
    ("A", "Letterhead", "Classic", opt_a,
     "Sidekick's logo as is, over a hairline rule and AI Scout in an engraved serif italic, like a "
     "private bank's letterhead.", "Cormorant Garamond",
     {"bg": PALE, "text": FOREST, "accent": [MINT], "base": "light", "saturation": "low", "energy": "calm",
      "ornament": "hairline rule", "fonts": {"display": "cormorant garamond", "body": "source sans 3"},
      "lockup": "stacked"}),
    ("B", "Brass Nameplate", "Classic", opt_b,
     "Sidekick's logo untouched, with AI Scout on a forest-green nameplate beside it, like the plate on a "
     "Wall Street door.", "Libre Baskerville",
     {"bg": IVORY, "text": INK, "accent": [FOREST], "base": "light", "saturation": "low", "energy": "calm",
      "ornament": "nameplate", "radius": 4, "fonts": {"display": "libre baskerville", "body": "source sans 3"},
      "lockup": "horizontal"}),
    ("C", "Third Arrow", "Stretch", opt_c,
     "A third, smaller mint arrow joins Sidekick's two: the scout out ahead. The only option that changes "
     "Sidekick's mark itself.", "Playfair Display",
     {"bg": TEAL, "text": PALE, "accent": [MINT], "base": "dark", "saturation": "mid", "energy": "balanced",
      "ornament": "none", "fonts": {"display": "playfair display", "body": "source sans 3"},
      "lockup": "emblem left"}),
    ("D", "The Seal", "Stretch", opt_d,
     "A round seal in forest and champagne gold, Sidekick's arrows in the middle, the name around the rim: "
     "old-money private equity. Gold isn't one of Sidekick's colors.", "Cinzel",
     {"bg": IVORY, "text": FOREST, "accent": [GOLD], "base": "light", "saturation": "low", "energy": "calm",
      "ornament": "crest", "fonts": {"display": "cinzel", "body": "source sans 3"}, "lockup": "seal"}),
    ("E", "After Hours", "On your taste profile", opt_e,
     "The trading floor at night: Sidekick's logo in pale mint, its arrows and AI Scout lit by a soft mint "
     "edge light. Built from your profile's leans (edge light, a saturated accent, 4px corners).",
     "Bodoni Moda",
     {"bg": NIGHT, "text": PALE, "accent": [MINT], "base": "dark", "saturation": "high", "energy": "balanced",
      "ornament": "edge light", "radius": 4, "fonts": {"display": "bodoni moda", "body": "source sans 3"},
      "lockup": "horizontal"}),
]

REC = "B"

CSS = """
:root{--page:#eef2f1;--ink:#1c2321;--muted:#4a5654;--card:#ffffff;--line:#d7e0dd}
*{box-sizing:border-box}
body{margin:0;background:var(--page);color:var(--ink);font:18px/1.55 "Source Sans 3",system-ui,sans-serif}
.wrap{max-width:1360px;margin:0 auto;padding:48px 32px 96px}
h1{font:600 40px/1.15 "Libre Baskerville",Georgia,serif;margin:0 0 12px}
.lede{max-width:980px;margin:0 0 10px;color:var(--muted)}
.rec{display:inline-block;margin:6px 0 32px;padding:8px 14px;border-radius:4px;background:#e2efe9;color:#123d31;font-weight:600}
.opt{background:var(--card);border:1px solid var(--line);border-radius:4px;margin:0 0 48px;overflow:hidden}
.opt-head{display:flex;flex-wrap:wrap;align-items:center;gap:12px 16px;padding:22px 28px;border-bottom:1px solid var(--line)}
.tile{display:inline-grid;place-items:center;width:44px;height:44px;border-radius:4px;background:#1b5d4a;color:#f4f9f8;font:700 22px "Source Sans 3",sans-serif}
.opt-head h2{margin:0;font:600 28px/1.2 "Libre Baskerville",Georgia,serif}
.tag{padding:4px 12px;border-radius:999px;border:1px solid #9cbcb2;color:#1e4d40;font-size:16px;font-weight:600}
.tag.stretch{border-color:#c9b27a;color:#6b5420}
.tag.profile{border-color:#2fbf93;color:#0f6a50}
.desc{flex-basis:100%;margin:0;color:var(--muted)}
.font{flex-basis:100%;margin:0;color:var(--muted);font-size:16px}
.hero{display:grid;place-items:center;min-height:380px;padding:56px 40px}
.label{font-size:16px;color:var(--muted);padding:14px 28px 0}
.hdr-wrap{padding:8px 28px 0}
.hdr{display:flex;align-items:center;justify-content:space-between;gap:24px;height:72px;padding:0 24px;border-radius:4px}
.hdr-brand{display:flex;align-items:center;gap:14px;white-space:nowrap}
.hdr nav{display:flex;gap:22px;font-size:18px;font-weight:600;white-space:nowrap}
.bottom{display:grid;grid-template-columns:1.25fr 1fr;gap:0 28px;padding:0 28px 28px}
.rev{display:grid;place-items:center;min-height:250px;padding:32px;border-radius:4px;margin-top:8px}
.tabs{display:flex;flex-direction:column;gap:18px;margin-top:8px}
.tab{display:flex;align-items:center;gap:12px;padding:10px 16px;border-radius:10px 10px 0 0;background:#f6f7f7;border:1px solid var(--line);border-bottom:none;font-size:17px;width:max-content;max-width:100%}
.tab b{font-weight:400;color:#7a8583;margin-left:12px}
.tab.dark{background:#2a2f2e;color:#eef2f1;border-color:#2a2f2e}
.favs{display:flex;align-items:flex-end;gap:18px}
.favs small{color:var(--muted);font-size:16px}
.fav{display:inline-grid;place-items:center}
.fav-box{display:grid;place-items:center;width:100%;height:100%;border-radius:22%}
.fav64{width:64px;height:64px}.fav32{width:32px;height:32px}.fav16{width:16px;height:16px}
.fav32 .fav-box svg{width:20px;height:20px}.fav16 .fav-box svg{width:11px;height:11px}
.fav64 .fav-box svg{width:40px;height:40px}
.fav-seal svg{width:100%;height:auto}
.fav-seal{display:block;width:100%}
/* A */
.a-name,.c-line,.d-name,.e-name,.e-sub,.b-sub,.a-sub,.hdr-brand span{white-space:nowrap}
.lkA{display:flex;flex-direction:column;align-items:center}
.a-rule{display:flex;align-items:center;gap:14px;margin:22px 0 8px;width:100%;max-width:420px}
.a-rule i{flex:1;height:1px;background:currentColor;opacity:.55}
.a-rule b{color:var(--r);font-size:14px}
.a-sub{font:600 18px "Cormorant Garamond",Georgia,serif;letter-spacing:.5em;text-transform:uppercase;margin-left:.5em}
.a-name{font:italic 500 64px/1.05 "Cormorant Garamond",Georgia,serif}
.rev .a-name{font-size:48px}
.hb-rule{width:1px;height:30px}
.hb-a{font:italic 600 30px "Cormorant Garamond",Georgia,serif;color:#1b5d4a}
/* B */
.lkB{display:flex;align-items:center;gap:28px}
.b-left{display:flex;flex-direction:column;align-items:flex-end}
.b-sub{font:600 18px "Source Sans 3",sans-serif;letter-spacing:.42em;text-transform:uppercase;margin-top:6px;margin-right:-.42em}
.b-rule{width:2px;align-self:stretch}
.plate{white-space:nowrap;font:700 38px/1 "Libre Baskerville",Georgia,serif;letter-spacing:.18em;padding:24px 30px 22px 36px;border-radius:4px}
.rev .plate{font-size:30px;padding:20px 24px 18px 30px}
.plate-sm{font-size:18px;padding:9px 12px 8px 15px;letter-spacing:.16em}
/* C */
.lkC{display:flex;align-items:center;gap:34px}
.c-text{display:flex;flex-direction:column;gap:10px}
.c-line{font:400 36px/1.1 "Playfair Display",Georgia,serif}
.c-line em{font-weight:600}
.rev .c-line{font-size:28px}
.hb-c{font:400 22px "Playfair Display",Georgia,serif;color:#f4f9f8}
.hb-c em{color:#30e1ae;font-weight:600}
/* D */
.lkD{display:flex;align-items:center;gap:40px}
.d-text{display:flex;flex-direction:column;align-items:flex-start}
.d-rule{width:100%;height:2px;background:#e3c47e;margin:18px 0 14px}
.d-name{font:600 34px "Cinzel",Georgia,serif;letter-spacing:.32em}
.rev .d-name{font-size:26px}
.seal-t{font:600 25px "Cinzel",Georgia,serif;letter-spacing:4px;fill:#e3c47e}
.hb-d{font:600 20px "Cinzel",Georgia,serif;letter-spacing:.28em;color:#1b5d4a}
/* E */
.lkE{display:flex;align-items:center;gap:30px}
.e-rule{width:2px;align-self:stretch;border-radius:2px}
.e-text{display:flex;flex-direction:column;gap:6px}
.e-name{font:600 50px/1 "Bodoni Moda",Georgia,serif;letter-spacing:.24em}
.rev .e-name{font-size:38px}
.e-sub{font:600 18px "Source Sans 3",sans-serif;letter-spacing:.45em;text-transform:uppercase}
.e-rule-sm{height:30px;background:#30e1ae;box-shadow:0 0 10px 1px #30e1ae;align-self:center}
.hb-e{font:600 22px "Bodoni Moda",Georgia,serif;letter-spacing:.22em;color:#30e1ae}
.edge{box-shadow:inset 0 1px 0 #30e1ae,inset 0 18px 30px -24px #30e1ae}
footer{color:var(--muted);font-size:16px}
"""

FONTS = ("https://fonts.googleapis.com/css2?family=Bodoni+Moda:wght@500;600&family=Cinzel:wght@600"
         "&family=Cormorant+Garamond:ital,wght@0,600;1,500;1,600&family=Libre+Baskerville:wght@400;700"
         "&family=Playfair+Display:ital,wght@0,400;1,600&family=Source+Sans+3:wght@400;600;700&display=swap")


def build():
    cards, manifest_opts = [], []
    for oid, name, tag, fn, desc, font, tokens in OPTIONS:
        o = fn()
        tag_cls = "tag stretch" if tag == "Stretch" else ("tag profile" if tag.startswith("On your") else "tag")
        rec = " · my pick" if oid == REC else ""
        hero_bg, hero = o["hero"]
        rev_bg, rev = o["rev"]
        edge = " edge" if oid == "E" else ""
        cards.append(f"""
<section class="opt" id="opt-{oid}" data-variation="{oid}">
  <header class="opt-head"><span class="tile">{oid}</span><h2>{name}</h2><span class="{tag_cls}">{tag}{rec}</span>
    <p class="desc">{desc}</p><p class="font">"AI Scout" type: {font}. Sidekick's wordmark and arrows: its own files, recolored.</p></header>
  <div class="hero{edge}" style="background:{hero_bg}">{hero}</div>
  <div class="label">In the site header, real size</div>
  <div class="hdr-wrap">{o["hdr"]}</div>
  <div class="bottom">
    <div><div class="label" style="padding-left:0">Reversed</div><div class="rev" style="background:{rev_bg}">{rev}</div></div>
    <div><div class="label" style="padding-left:0">Browser tab icon</div><div class="tabs">{tab(o["fav"], o["dark_tab"])}</div></div>
  </div>
</section>""")
        manifest_opts.append({"id": oid, "name": name, "desc": desc, "tokens": {"visual": tokens}})

    manifest = {"project": "VC Scout", "subject": "Sidekick Partners AI Scout logo", "surface": "graphic",
                "claude_rec": REC,
                "compares": ["visual.font.display", "visual.ornament", "visual.lockup", "visual.accent",
                             "visual.base"],
                "options": manifest_opts}
    mjson = json.dumps(manifest, indent=1)
    json.loads(mjson)

    html = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Scout Logo Variations</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
<style>{CSS}</style>
<script type="application/json" id="variation-manifest">
{mjson}
</script>
</head><body><div class="wrap">
<h1>Sidekick Partners AI Scout · the logo</h1>
<p class="lede">Design step 2 of 5. Five ways to work "AI Scout" into Sidekick Partners' logo, in the 1980s Wall Street,
Ralph Lauren feel you asked for. Each is shown whole on its main background, in the site header at real size,
reversed, and as the browser tab icon.</p>
<p class="lede">A and B are classic and leave Sidekick's logo untouched. C and D are stretches. E is built from your
taste profile.</p>
<span class="rec">My pick: B, Brass Nameplate. It keeps Sidekick's logo exactly as it is and stays clear at header size.</span>
{"".join(cards)}
<footer>Generated by build.py · Sidekick's logo files from sidekickpartners.com (10-31-26) · sample only, not affiliated with Sidekick Partners.</footer>
</div></body></html>
"""
    OUT.write_text(html)
    print(f"wrote {OUT} ({len(html):,} bytes)")


if __name__ == "__main__":
    build()
