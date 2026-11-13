"""The Trends page, round 1 (user, 11-04-26, note `Throwaway/Vercel feedback.md`): "each trend on this page is too
dense, and cramped. Show me four variations that are less dense".

Each option is the LIVE Trends page in the Dark look he reviewed it in (its header, ticker, title, filters and footer;
scripts left out) with only the trend list redrawn, from the four live trends. Today each trend stacks five rows: the
headline, a chip line, a sentence that names the outlets, a row of "News" chips naming them again, and a bar of five
controls (Track, Find Startups in This Trend, Timeline, the Real-time lock, votes).

    python3 "Sidekick Partners/design/pages/build_trends.py"
"""
import html
import importlib.util
import json
import pathlib
import re
import urllib.request

_spec = importlib.util.spec_from_file_location("pages_build", pathlib.Path(__file__).resolve().parent / "build.py")
build = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(build)

HERE = pathlib.Path(__file__).parent
SITE = "https://sidekick..org"
LEDE = "Ideas that two or more independent sources raised this week, each in one of Sidekick's industries."


def esc(s):
    return html.escape(s or "", quote=True)


def text(h):
    return html.unescape(re.sub(r"<[^>]+>", "", h)).strip()


# ---------- the live trends ----------
def trends(page):
    out = []
    for m in re.finditer(r'<article id="([^"]+)" class="rowcard tcard"[^>]*data-area="([^"]*)">(.*?)</article>', page, flags=re.S):
        aid, area, a = m.groups()
        title = text(re.search(r"<h3>(.*?)</h3>", a, flags=re.S).group(1))
        name, _, count = title.partition(": ")
        meta = re.search(r'<div class="meta" style="margin:6px 0 8px">(.*?)</div>', a, flags=re.S).group(1)
        tag = text(re.search(r'<span class="tag">(.*?)</span>', meta, flags=re.S).group(1))
        vel = text(re.search(r'<span class="vel">(.*?)</span>', meta, flags=re.S).group(1))
        nsrc = text(re.search(r"<span>(\d+)<!-- --> sources</span>", meta).group(1))
        when = re.search(r'data-live="ago"', meta) and re.search(r'title="([^"]+)" data-live', meta).group(1)
        sentence = re.search(r"<p>(.*?)</p>", a, flags=re.S).group(1)
        # the outlets are named again by the chips: the sentence keeps its first clause (the play and the portfolio company)
        lead = re.sub(r",\s*in [^<]*\.$", ".", sentence.strip())
        srcs = [dict(href=html.unescape(h), title=re.sub(r": opens in a new window$", "", html.unescape(t)), ico=html.unescape(i)) for h, t, i in re.findall(r'<a class="src2" href="([^"]+)"[^>]*title="([^"]+)"[^>]*><img src="([^"]+)"', a)]
        spark = re.search(r"</div>(<svg\b.*?</svg>)</div><div class=\"tbar\">", a, flags=re.S)
        track_ico = re.search(r'<button class="btn track"[^>]*>(<svg\b.*?</svg>)', a, flags=re.S).group(1)
        out.append(dict(id=aid, area=area, name=name, count=count, tag=tag, vel=vel.replace("▲", "").strip(), nsrc=nsrc, when=when,
                        lead=lead, srcs=srcs, spark=spark.group(1) if spark else "", track_ico=track_ico, pipeline="/pipeline?q=play"))
    assert out, "no trends found on the live page"
    return out


def outlet(s):
    host = re.sub(r"^https?://(www\.)?", "", s["href"]).split("/")[0]
    return host


def favs(t, labels=False):
    items = []
    for s in t["srcs"]:
        lab = f"<span>{esc(outlet(s))}</span>" if labels else ""
        items.append(f'<a class="tv-fav" href="{esc(s["href"])}" target="_blank" rel="noopener noreferrer" title="{esc(s["title"])}: opens in a new window">'
                     f'<img src="{esc(s["ico"])}" alt="" width="18" height="18">{lab}</a>')
    return "".join(items)


def track(t, cls="btn track"):
    return f'<button class="{cls}" title="Track this trend: a daily check and a timeline">{t["track_ico"]}Track</button>'


def links(t):
    return (f'<a class="tv-link" href="{t["pipeline"]}" title="Filter the Pipeline to startups in this trend">Find Startups</a>'
            f'<button class="tv-link" type="button" title="Show the timeline: {t["nsrc"]} sources, oldest to newest">Timeline</button>')


def stamp(t):
    """"10h ago" from the live page's own time stamp, read in New York time as the site shows it."""
    from datetime import datetime
    from zoneinfo import ZoneInfo
    ny = ZoneInfo("America/New_York")
    try:
        at = datetime.strptime(t["when"], "%m-%d-%y %I:%M %p").replace(tzinfo=ny)
        h = int((datetime.now(ny) - at).total_seconds() // 3600)
        ago = f"{h}h ago" if h < 24 else f"{h // 24}d ago"
    except (TypeError, ValueError):
        ago = ""
    return f'<time title="{esc(t["when"] or "")}">{ago}</time>'


def delta(t):
    return f'<span class="tv-up">▲ {esc(t["vel"])}</span>'


# ---------- A · Quiet Rows: the headline, one quiet line, one sentence, one button ----------
def a(ts):
    def one(t):
        return (f'<article class="qa" id="{t["id"]}"><div class="qa-l"><h3>{esc(t["name"])}</h3>'
                f'<p class="qa-meta"><span class="tag">{esc(t["tag"])}</span>{delta(t)}<span>{esc(t["count"])}</span>{stamp(t)}</p>'
                f'<p class="qa-lead">{t["lead"]}</p>'
                f'<div class="qa-acts">{track(t)}{links(t)}<span class="qa-favs">{favs(t)}</span></div></div>'
                f'<div class="qa-spark">{t["spark"]}</div></article>')
    css = """
.qa { display:grid; grid-template-columns:minmax(0,1fr) 180px; gap:28px; align-items:center; padding:30px 4px; border-top:1px solid var(--border); }
.qa:first-child { border-top:0; }
.qa h3 { margin:0; font:600 30px/1.15 var(--font-head); color:var(--heading); }
.qa-meta { display:flex; flex-wrap:wrap; align-items:center; gap:8px 16px; margin:10px 0 0; font:500 17px/1.3 var(--font-body); color:var(--text-3); }
.qa-lead { margin:12px 0 0; font:400 19px/1.55 var(--font-body); color:var(--text-2); max-width:62ch; }
.qa-acts { display:flex; flex-wrap:wrap; align-items:center; gap:10px 22px; margin-top:18px; }
.qa-favs { display:inline-flex; gap:10px; margin-left:auto; }
.qa-spark svg { width:100%; height:auto; }
@media (max-width:820px) { .qa { grid-template-columns:minmax(0,1fr); } .qa-spark { display:none; } }
"""
    return css, "".join(one(t) for t in ts)


# ---------- B · Two Columns: the story on the left, the numbers and Track on the right ----------
def b(ts):
    def one(t):
        n = re.search(r"\+(\d+)", t["vel"])
        return (f'<article class="tb" id="{t["id"]}"><div class="tb-l"><span class="tag">{esc(t["tag"])}</span><h3>{esc(t["name"])}</h3>'
                f'<p class="tb-lead">{t["lead"]}</p><div class="tb-links">{links(t)}</div></div>'
                f'<div class="tb-r"><p class="tb-n"><b>+{n.group(1) if n else "0"}</b> Mentions</p><p class="tb-sub">{esc(t["count"])}</p>'
                f'{t["spark"]}<div class="tb-favs">{favs(t)}</div>{track(t)}</div></article>')
    css = """
.tb { display:grid; grid-template-columns:minmax(0,1fr) 240px; gap:36px; padding:32px 4px; border-top:1px solid var(--border); }
.tb:first-child { border-top:0; }
.tb h3 { margin:12px 0 0; font:600 30px/1.15 var(--font-head); color:var(--heading); }
.tb-lead { margin:12px 0 0; font:400 19px/1.55 var(--font-body); color:var(--text-2); max-width:60ch; }
.tb-links { display:flex; gap:22px; margin-top:16px; }
.tb-r { display:grid; gap:10px; align-content:start; padding-left:28px; border-left:1px solid var(--border); }
.tb-n { margin:0; font:600 17px/1 var(--font-body); color:var(--text-3); }
.tb-n b { display:block; font:600 46px/1.1 var(--font-head); color:var(--mint, #6fe3b4); margin-bottom:10px; }
.tb-sub { margin:0; font:500 16px/1.4 var(--font-body); color:var(--text-3); }
.tb-r .spark { width:100%; height:auto; }
.tb-favs { display:flex; gap:10px; }
.tb-r .btn { justify-self:start; }
@media (max-width:820px) { .tb { grid-template-columns:minmax(0,1fr); } .tb-r { padding-left:0; border-left:0; } }
"""
    return css, "".join(one(t) for t in ts)


# ---------- C · Card Grid: two trends to a row, each card with room to breathe ----------
def c(ts):
    def one(t):
        return (f'<article class="tc" id="{t["id"]}"><div class="tc-top"><span class="tag">{esc(t["tag"])}</span>{delta(t)}</div>'
                f'<h3>{esc(t["name"])}</h3><div class="tc-spark">{t["spark"]}</div><p class="tc-lead">{t["lead"]}</p>'
                f'<div class="tc-foot"><span class="tc-favs">{favs(t)}<small>{esc(t["nsrc"])} Sources · {stamp(t)}</small></span>{track(t)}</div>'
                f'<div class="tc-links">{links(t)}</div></article>')
    css = """
.tcg { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:18px; }
.tc { display:grid; gap:12px; align-content:start; padding:26px; border:1px solid var(--border); border-radius:6px; }
.tc-top { display:flex; flex-wrap:wrap; align-items:center; gap:8px 14px; font:500 16px/1.3 var(--font-body); }
.tc h3 { margin:2px 0 0; font:600 28px/1.15 var(--font-head); color:var(--heading); }
.tc-spark svg { width:220px; height:auto; }
.tc-lead { margin:0; font:400 18px/1.55 var(--font-body); color:var(--text-2); }
.tc-foot { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:6px; padding-top:14px; border-top:1px solid var(--border); }
.tc-favs { display:inline-flex; align-items:center; gap:10px; }
.tc-favs small { font:500 15px/1.3 var(--font-body); color:var(--text-3); }
.tc-links { display:flex; gap:22px; }
@media (max-width:820px) { .tcg { grid-template-columns:minmax(0,1fr); } }
"""
    return css, '<div class="tcg">' + "".join(one(t) for t in ts) + "</div>"


# ---------- D · Headline List (stretch): one line each; the details open under the line you pick ----------
def dd(ts):
    def one(t, k):
        return (f'<details class="td" id="{t["id"]}"{" open" if k == 0 else ""}><summary><span class="td-name">{esc(t["name"])}</span>'
                f'<span class="tag">{esc(t["tag"])}</span>{delta(t)}<span class="td-spark">{t["spark"]}</span></summary>'
                f'<div class="td-body"><p class="td-lead">{t["lead"]}</p><p class="td-src">{favs(t, labels=True)}</p>'
                f'<div class="td-acts">{track(t)}{links(t)}</div></div></details>')
    css = """
.td { border-top:1px solid var(--border); }
.td:first-child { border-top:0; }
.td summary { list-style:none; cursor:pointer; display:grid; grid-template-columns:minmax(0,1fr) auto auto 140px; gap:18px; align-items:center; padding:22px 4px; }
.td summary::-webkit-details-marker { display:none; }
.td-name { font:600 26px/1.2 var(--font-head); color:var(--heading); }
.td-spark svg { width:140px; height:auto; display:block; }
.td-body { padding:0 4px 26px; display:grid; gap:14px; }
.td-lead { margin:0; font:400 19px/1.55 var(--font-body); color:var(--text-2); max-width:64ch; }
.td-src { display:flex; flex-wrap:wrap; gap:10px 18px; margin:0; }
.td-src .tv-fav { gap:8px; font:500 16px/1 var(--font-body); color:var(--text-2); text-decoration:none; }
.td-acts { display:flex; flex-wrap:wrap; align-items:center; gap:10px 22px; }
@media (max-width:820px) { .td summary { grid-template-columns:minmax(0,1fr); gap:8px; } .td-spark { display:none; } }
"""
    return css, "".join(one(t, k) for k, t in enumerate(ts))


BASE = """
#trend-list { padding:8px 28px; }
.tv-fav { display:inline-flex; align-items:center; }
.tv-fav img { width:18px; height:18px; border-radius:4px; }
.tv-up { color:var(--mint, #6fe3b4); font:600 16px/1 var(--font-body); }
.tv-link { padding:0; border:0; background:none; cursor:pointer; color:var(--red-ink); font:600 17px/1.3 var(--font-body); text-decoration:none; }
.tv-link:hover { text-decoration:underline dotted 1px; text-underline-offset:3px; }
#trend-list .tag { white-space:nowrap; }
"""

OPTIONS = [
    ("A", "Quiet Rows", "The headline, one quiet line of facts, one sentence, then Track with two text links; the outlets as small icons.", a, "On-Profile"),
    ("B", "Two Columns", "The story on the left; on the right the mention count, the sparkline, the outlets and Track.", b, "On-Profile"),
    ("C", "Card Grid", "Two trends to a row, each a roomy card: the sparkline wide, one sentence, the outlets and Track at the foot.", c, "On-Profile"),
    ("D", "Headline List", "One line per trend (name, industry, change, sparkline); the sentence, outlets and actions open under the line you pick.", dd, "Stretch"),
]


def page(shell, vid, css, body, manifest=None):
    i = shell.index('<div class="list" id="trend-list">')
    j = shell.index("</main>", i)
    # the trend list runs to the end of its page's wrapper: replace the list only, keep what follows it inside <main>
    end = shell.rindex("</div></div>", i, j)
    new = shell[:i] + f'<div class="list" id="trend-list">{body}</div></div>' + shell[end + len("</div></div>"):]
    add = f"<style>{BASE}{css}</style>" + (f'<script type="application/json" id="variation-manifest">{json.dumps(manifest)}</script>' if manifest else "")
    new = new.replace("</head>", add + "</head>", 1)
    return re.sub(r"<body\b", f'<body data-variation="{vid}"', new, count=1)


def main():
    shell = urllib.request.urlopen(SITE + "/trends", timeout=30).read().decode()
    shell = re.sub(r"<script\b[^>]*>.*?</script>", "", shell, flags=re.S)
    shell = re.sub(r'<link[^>]+rel="(?:preload|modulepreload)"[^>]*>', "", shell)
    shell = re.sub(r'(href|src)="/(?!/)', rf'\1="{SITE}/', shell)
    # the shorter description (user, 11-04-26, round 2: "Make this more concise and easier to understand"), also on the site
    shell = re.sub(r'(<p class="ph-lede">).*?(</p>)', lambda m: m.group(1) + LEDE + m.group(2), shell, count=1, flags=re.S)
    # the Dark look, the one he reviewed the live page in (11-04-26 screenshot)
    shell = re.sub(r"<html\b", '<html data-theme="dark"', shell, count=1) if "data-theme" not in shell[:400] else re.sub(r'(<html\b[^>]*?)data-theme="[^"]*"', r'\1data-theme="dark"', shell, count=1)
    ts = trends(shell)
    manifest = {"project": "VC Scout", "subject": "Sidekick Trends: a less dense trend", "surface": "layout", "claude_rec": "A",
                "compares": ["visual.layout", "ux.density", "ux.structure"],
                "options": [{"id": i, "name": n, "desc": ds, "stretch": tag == "Stretch",
                             "tokens": {"visual": {"layout": n.lower(), "energy": "calm"},
                                        "ux": {"density": "roomy", "structure": {"A": "rows", "B": "two-column", "C": "card-grid", "D": "expand-on-click"}[i],
                                               "detail": "on-demand" if i == "D" else "inline"}}}
                            for i, n, ds, _, tag in OPTIONS]}
    for i, n, ds, fn, tag in OPTIONS:
        css, body = fn(ts)
        f = HERE / f"TR-{i}-trends.html"
        f.write_text(build.bare(page(shell, i, css, body, manifest if i == "A" else None), f.name))
        print(f)


if __name__ == "__main__":
    main()
