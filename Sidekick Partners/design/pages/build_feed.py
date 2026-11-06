"""Co-Investors as a news feed, round 1 (user, 11-03-26: "The purpose of this section is to showcase recent deals done
by firms they've invested in. This needs to look more like a news feed, sorted with the most recent at the top ... show
me four variations"). Each option is the LIVE Co-Investors page (its header, filters and look, scripts left out) with
the fund cards and the recent-deals table replaced by one feed, newest first: the deals the daily co-investor watch
found in the news (feed-items.json, from the live database) and the checked rounds the co-investors shared with Sidekick
(feed-deals.json, from Sidekick Partners/funds.ts).

    python3 "Sidekick Partners/design/pages/build_feed.py"
"""
import html
import json
import pathlib
import re
import urllib.request
from datetime import date

HERE = pathlib.Path(__file__).parent
SITE = "https://sidekick-partners-scout.vercel.app"
AREAS = {"consumer-brands": "Premium Consumer Brands", "consumer-health": "Consumer Health", "ecommerce-software": "E-Commerce Software",
         "vertical-saas": "Vertical SaaS + Embedded Payments", "roll-ups": "Tech-Enabled Roll-Ups + AI Services"}
TODAY = date(2026, 11, 3)


def money(n, cur="$"):
    if not n:
        return ""
    n = float(n)
    return f"{cur}{n/1e6:.1f}M".replace(".0M", "M") if n >= 1e6 else f"{cur}{n/1e3:.0f}K"


def items():
    out = []
    for i in json.loads((HERE / "feed-items.json").read_text()):
        rnd = {"seed": "Seed", "unknown": "", "series-a": "Series A", "pre-seed": "Pre-Seed"}.get((i["round"] or "").lower(), (i["round"] or "").title())
        out.append(dict(date=i["date"], funds=[i["fund"]], company=i["company"], round=" ".join(x for x in [money(i["amount"], i.get("currency") or "$"), rnd] if x) or "A round",
                        headline=i["title"], url=i["url"], outlet=i["source"], area=AREAS.get(i["thesis_area"] or ""), lead=i["role"] == "lead",
                        unnamed=bool(i["possible"]), shared=False))
    for d in json.loads((HERE / "feed-deals.json").read_text()):
        outlet = re.sub(r"^www\.", "", urllib.parse.urlparse(d["url"]).netloc) if d["url"] else ""
        out.append(dict(date=d["date"], funds=d["funds"], company=d["company"], round=d["round"], headline=None, url=d["url"], outlet=outlet,
                        area=None, lead=False, unnamed=False, shared=True))
    return sorted(out, key=lambda x: x["date"], reverse=True)


def mmddyy(s):
    y, m, d = s.split("-")
    return f"{m}-{d}-{y[2:]}"


def ago(s):
    days = (TODAY - date.fromisoformat(s)).days
    return "Today" if days == 0 else "Yesterday" if days == 1 else f"{days} days ago" if days < 14 else mmddyy(s)


def funds_line(fs, n=3):
    fs = [html.escape(f) for f in fs]
    if len(fs) <= n:
        return " and ".join([", ".join(fs[:-1]), fs[-1]]) if len(fs) > 1 else fs[0]
    return f"{', '.join(fs[:n])} and {len(fs) - n} more"


def sentence(x):
    if x["headline"]:
        return html.escape(x["headline"])
    return f"{html.escape(x['company'])} raised a {html.escape(x['round'])}, with {funds_line(x['funds'])}"


def chips(x):
    c = []
    if x["shared"]:
        c.append('<span class="fx-chip side">With Sidekick</span>')
    if x["lead"]:
        c.append('<span class="fx-chip">Led the Round</span>')
    if x["area"]:
        c.append(f'<span class="fx-chip area">{html.escape(x["area"])}</span>')
    return "".join(c)


def src(x):
    return f'<a class="fx-src" href="{html.escape(x["url"])}" target="_blank" rel="noopener">{html.escape(x["outlet"] or "Source")}</a>' if x["url"] else ""


def unnamed(x):
    return f'<p class="fx-check">The headline doesn\'t name {html.escape(x["funds"][0])}: open the story to check it\'s their round.</p>' if x["unnamed"] else ""


BASE = """
.fx { margin:0 40px 28px; padding:28px 32px; }
.fx h2 { font:600 30px/1.1 var(--font-head); font-variant:small-caps; letter-spacing:.02em; margin:0 0 4px; color:var(--heading); }
.fx .fx-sub { font:400 16px/1.4 var(--font-body); color:var(--text-3); margin:0 0 18px; }
.fx-chip { display:inline-block; font:600 13px/1 var(--font-body); padding:5px 8px; border-radius:4px; background:var(--surface); color:var(--text-2); border:1px solid var(--border); margin-right:6px; }
.fx-chip.side { background:var(--forest); color:#f6f1e4; border-color:transparent; }
.fx-chip.area { background:#e9dfc6; color:#5a4214; border-color:transparent; }
.fx-src { color:#7a5a1c; text-decoration:underline dotted 1px; text-underline-offset:3px; font:600 15px/1.3 var(--font-body); }
.fx-check { font:400 14px/1.4 var(--font-body); color:var(--text-3); margin:6px 0 0; }
.fx b.co { color:var(--heading); }
"""


# ---------- A · Wire: one line per deal, like a news wire ----------
def a(xs):
    rows = "".join(f'''<li class="wr"><time>{mmddyy(x["date"])}</time><div class="wb"><p class="wh">{sentence(x)}</p>
<p class="wm"><b class="co">{html.escape(x["company"])}</b> · {html.escape(x["round"])} · {funds_line(x["funds"], 2)} {chips(x)}</p>{unnamed(x)}</div><div class="ws">{src(x)}</div></li>''' for x in xs)
    css = """.wire { list-style:none; margin:0; padding:0; }
.wr { display:grid; grid-template-columns:96px 1fr auto; gap:18px; padding:14px 0; border-top:1px solid var(--border); align-items:baseline; }
.wr time { font:600 15px/1 var(--font-body); color:var(--text-3); }
.wh { margin:0 0 4px; font:600 18px/1.35 var(--font-body); color:var(--heading); }
.wm { margin:0; font:400 15px/1.5 var(--font-body); color:var(--text-2); }"""
    return css, f'<ul class="wire">{rows}</ul>'


# ---------- B · Story Cards: a card per deal, the fund on top like a post's author ----------
def b(xs):
    def card(x):
        f = x["funds"][0]
        return f'''<article class="sc"><header><span class="av">{html.escape(f[0])}</span><span class="who"><b>{funds_line(x["funds"], 2)}</b><small>{ago(x["date"])}</small></span></header>
<h3>{sentence(x)}</h3><p class="sm">{html.escape(x["company"])} · {html.escape(x["round"])}</p>{unnamed(x)}<footer>{chips(x)}<span class="sp"></span>{src(x)}</footer></article>'''
    css = """.stories { display:grid; gap:16px; max-width:820px; }
.sc { background:var(--surface); border:1px solid var(--border); border-radius:6px; padding:18px 20px; }
.sc header { display:flex; align-items:center; gap:12px; margin-bottom:10px; }
.sc .av { width:40px; height:40px; border-radius:50%; display:grid; place-items:center; background:var(--forest); color:#f6f1e4; font:700 18px/1 var(--font-body); }
.sc .who { display:grid; } .sc .who b { font:700 16px/1.3 var(--font-body); color:var(--heading); } .sc .who small { font:400 14px/1.3 var(--font-body); color:var(--text-3); }
.sc h3 { margin:0 0 6px; font:600 22px/1.3 var(--font-head); color:var(--heading); }
.sc .sm { margin:0; font:600 15px/1.4 var(--font-body); color:var(--text-2); }
.sc footer { display:flex; align-items:center; gap:6px; margin-top:12px; } .sc .sp { flex:1; }"""
    return css, f'<div class="stories">{"".join(card(x) for x in xs)}</div>'


# ---------- C · Timeline: deals under their month, on a line ----------
def c(xs):
    groups, order = {}, []
    for x in xs:
        d = date.fromisoformat(x["date"])
        k = "This Week" if (TODAY - d).days < 7 else d.strftime("%B %Y")
        if k not in groups:
            groups[k] = []
            order.append(k)
        groups[k].append(x)
    body = "".join(f'''<section class="tg"><h3>{k}</h3>{"".join(f"""<div class="te"><i></i><div><p class="tt"><time>{mmddyy(x["date"])}</time> {sentence(x)}</p><p class="tm">{html.escape(x["round"])} · {funds_line(x["funds"], 3)} {chips(x)} {src(x)}</p>{unnamed(x)}</div></div>""" for x in groups[k])}</section>''' for k in order)
    css = """.tl { border-left:2px solid var(--brass); margin-left:8px; padding-left:26px; }
.tg h3 { font:600 22px/1 var(--font-head); font-variant:small-caps; letter-spacing:.03em; color:var(--heading); margin:18px 0 10px -26px; padding-left:26px; }
.tg:first-child h3 { margin-top:0; }
.te { position:relative; padding:8px 0 12px; }
.te i { position:absolute; left:-34px; top:15px; width:12px; height:12px; border-radius:50%; background:var(--forest); box-shadow:0 0 0 3px var(--card); }
.tt { margin:0 0 4px; font:600 18px/1.35 var(--font-body); color:var(--heading); } .tt time { font-weight:600; color:var(--text-3); margin-right:6px; }
.tm { margin:0; font:400 15px/1.6 var(--font-body); color:var(--text-2); }"""
    return css, f'<div class="tl">{body}</div>'


# ---------- D · Tombstones: the deal announcement card bankers hand out (an object) ----------
def d(xs):
    def stone(x):
        return f'''<article class="ts"><p class="tk">{ago(x["date"]) if not x["shared"] else mmddyy(x["date"])}</p><h3>{html.escape(x["company"])}</h3><p class="ta">{html.escape(x["round"])}</p>
<div class="tr"></div><p class="tw">with</p><p class="tf">{funds_line(x["funds"], 4)}</p><p class="tc">{chips(x)}</p>{unnamed(x)}<p class="tsrc">{src(x)}</p></article>'''
    css = """.stones { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:16px; }
.ts { background:var(--surface); border:1px solid var(--brass); outline:1px solid var(--brass); outline-offset:-6px; border-radius:2px; padding:22px 20px; text-align:center; }
.ts .tk { margin:0 0 10px; font:600 13px/1 var(--font-body); letter-spacing:.08em; color:var(--text-3); }
.ts h3 { margin:0; font:600 28px/1.1 var(--font-head); color:var(--heading); }
.ts .ta { margin:8px 0 0; font:600 20px/1.2 var(--font-head); color:#7a5a1c; }
.ts .tr { width:60px; height:1px; background:var(--brass); margin:14px auto; }
.ts .tw { margin:0; font:italic 400 15px/1 var(--font-head); color:var(--text-3); } .ts .tf { margin:6px 0 10px; font:600 15px/1.4 var(--font-body); color:var(--text-2); }
.ts .tc { margin:0 0 8px; } .ts .tsrc { margin:0; }"""
    return css, f'<div class="stones">{"".join(stone(x) for x in xs)}</div>'


OPTIONS = [
    ("A", "Wire", "One line per deal, newest first: the date, the headline, then the company, round and funds.", a, "On-Profile"),
    ("B", "Story Cards", "A card per deal like a post in a feed: the fund on top as the author, the headline, the round, the source.", b, "On-Profile"),
    ("C", "Timeline", "Deals on a line under their month (This Week first), each a sentence with its round and funds.", c, "On-Profile"),
    ("D", "Tombstones", "The deal announcement card bankers hand out: company and round big, the funds under it, newest first.", d, "Stretch"),
]


def page(shell, vid, css, feed, manifest=None):
    sec = f'<section class="x-sec fx"><h2>Recent Deals</h2><p class="fx-sub">What the co-investors just backed, newest first: deals found in the news, and the rounds they shared with Sidekick.</p>{feed}</section>'
    out = re.sub(r'(<div class="rule"></div><div class="lanes".*?</div>).*(</div>(?:<!--\$--><!--/\$-->)?</main>)', lambda m: m.group(1) + sec + m.group(2), shell, count=1, flags=re.S)
    assert out != shell, "the page's lanes row was not found"
    add = f"<style>{BASE}{css}</style>" + (f'<script type="application/json" id="variation-manifest">{json.dumps(manifest)}</script>' if manifest else "")
    out = out.replace("</head>", add + "</head>", 1)
    return re.sub(r"<body\b", f'<body data-variation="{vid}"', out, count=1)


def main():
    shell = urllib.request.urlopen(SITE + "/co-investors", timeout=30).read().decode()
    shell = re.sub(r"<script\b[^>]*>.*?</script>", "", shell, flags=re.S)
    shell = re.sub(r'<link[^>]+rel="(?:preload|modulepreload)"[^>]*>', "", shell)
    shell = re.sub(r'(href|src)="/(?!/)', rf'\1="{SITE}/', shell)
    shell = re.sub(r'(<html\b[^>]*?)data-theme="[^"]*"', r'\1data-theme="light"', shell)
    xs = items()
    manifest = {"project": "VC Scout", "subject": "Sidekick Co-Investors news feed", "surface": "layout", "claude_rec": "B",
                "compares": ["visual.layout"],
                "options": [{"id": i, "name": n, "desc": ds, "tokens": {"visual": {"layout": n.lower(), "energy": "calm"}}} for i, n, ds, _, _ in OPTIONS]}
    for i, n, ds, fn, tag in OPTIONS:
        css, feed = fn(xs)
        f = HERE / f"C{i}-coinvestors.html"
        f.write_text(page(shell, i, css, feed, manifest if i == "A" else None))
        print(f)


if __name__ == "__main__":
    import urllib.parse  # noqa: F401
    main()
