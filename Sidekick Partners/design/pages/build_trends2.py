"""The Trends page, round 2 (user, 11-04-26): he picked round 1's B, Two Columns, and marked its two text links
"Find Startups" and "Timeline": "It is unclear, given the user interface, what these items are. Show me three
variations that better communicate what these items are and distinguish them from the other elements in the card."
Also in this round: the outlet icons draw (round 1 escaped their addresses twice) and the shorter description ("Make
this more concise and easier to understand").

Each option is round 1's B with only the two links redrawn. In each, Timeline opens the trend's stories in place.

    python3 "Sidekick Partners/design/pages/build_trends2.py"
"""
import importlib.util
import json
import pathlib
import re
import urllib.request

HERE = pathlib.Path(__file__).parent
_spec = importlib.util.spec_from_file_location("trends1", HERE / "build_trends.py")
r1 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(r1)
build, esc, SITE, LEDE = r1.build, r1.esc, r1.SITE, r1.LEDE

ICON = {
    "search": '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    "list": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/></svg>',
    "arrow": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
}


def stories(t):
    """The trend's stories, each with its outlet's icon and name: what Timeline shows."""
    li = "".join(f'<li><img src="{esc(s["ico"])}" alt="" width="18" height="18"><span><a href="{esc(s["href"])}" target="_blank" rel="noopener noreferrer" '
                 f'title="Opens the story in a new window">{esc(s["title"])}</a><small>{esc(r1.outlet(s))}</small></span></li>' for s in t["srcs"])
    return f'<ol class="tl-stories">{li}</ol>'


def two_col(t, links_html, right_extra=""):
    n = re.search(r"\+(\d+)", t["vel"])
    return (f'<article class="tb" id="{t["id"]}"><div class="tb-l"><span class="tag">{esc(t["tag"])}</span><h3>{esc(t["name"])}</h3>'
            f'<p class="tb-lead">{t["lead"]}</p>{links_html}</div>'
            f'<div class="tb-r"><p class="tb-n"><b>+{n.group(1) if n else "0"}</b> Mentions</p><p class="tb-sub">{esc(t["count"])}</p>'
            f'{t["spark"]}<div class="tb-favs" title="The outlets that ran these stories">{r1.favs(t)}</div>{right_extra}{r1.track(t)}</div></article>')


# ---------- A · Labeled Buttons: two outlined buttons with an icon and the full words ----------
def a(ts):
    def one(t):
        # the stories open in a row of their own under the buttons, so no button moves (user, 11-04-26: "Clicking the
        # 'See the three stories' button causes the button to jump lines. That should not be the case.")
        links = (f'<input type="checkbox" class="tl-tog" id="st-{t["id"]}" hidden>'
                 f'<div class="la-row"><a class="la-btn" href="{t["pipeline"]}" title="Opens the Pipeline, filtered to startups in this trend">{ICON["search"]}Find Startups in This Trend</a>'
                 f'<label class="la-btn" for="st-{t["id"]}" title="Shows the stories behind this trend">{ICON["list"]}See the {t["nsrc"]} Stories</label></div>{stories(t)}')
        return two_col(t, links)
    css = """
.la-row { display:flex; flex-wrap:wrap; gap:12px; margin-top:20px; padding-top:18px; border-top:1px solid var(--border); }
.la-btn { display:inline-flex; align-items:center; gap:9px; min-height:44px; padding:0 16px; border:1px solid var(--border); border-radius:8px; background:transparent; color:var(--heading); font:600 17px/1 var(--font-body); text-decoration:none; cursor:pointer; list-style:none; }
.la-btn::-webkit-details-marker { display:none; }
.la-btn:hover { border-color:var(--red-ink); }
.la-btn svg { width:18px; height:18px; fill:none; stroke:currentColor; stroke-width:2; stroke-linecap:round; }
.tl-tog:checked + .la-row label { border-color:var(--red-ink); }
"""
    return css, "".join(one(t) for t in ts)


# ---------- B · Explore Row: a small "Explore" label, each item with its icon, name and what it opens ----------
def b(ts):
    def one(t):
        links = (f'<div class="lb"><p class="lb-k">Explore This Trend</p><div class="lb-items">'
                 f'<a class="lb-it" href="{t["pipeline"]}" title="Opens the Pipeline, filtered to startups in this trend">{ICON["search"]}<span><b>Startups in This Trend</b><small>The Pipeline, filtered to this play</small></span></a>'
                 f'<label class="lb-it" for="st-{t["id"]}" title="Shows the stories behind this trend">{ICON["list"]}<span><b>Timeline</b><small>The {t["nsrc"]} stories behind it</small></span></label>'
                 f'</div>{stories(t)}</div>')
        links = f'<input type="checkbox" class="tl-tog" id="st-{t["id"]}" hidden>' + links
        return two_col(t, links)
    css = """
.lb { margin-top:20px; padding:16px 18px; border-radius:8px; background:color-mix(in srgb, var(--text) 5%, transparent); }
.lb-k { margin:0 0 10px; font:600 14px/1 var(--font-body); letter-spacing:.08em; color:var(--text-3); }
.lb-items { display:flex; flex-wrap:wrap; gap:10px 34px; }
.lb-it { display:flex; align-items:flex-start; gap:10px; color:var(--heading); text-decoration:none; cursor:pointer; list-style:none; }
.lb-it::-webkit-details-marker { display:none; }
.lb-it svg { flex:none; width:20px; height:20px; margin-top:2px; fill:none; stroke:var(--red-ink); stroke-width:2; stroke-linecap:round; }
.lb-it b { display:block; font:600 18px/1.25 var(--font-body); color:var(--red-ink); }
.lb-it small { display:block; font:400 16px/1.35 var(--font-body); color:var(--text-3); }
.lb-it:hover b { text-decoration:underline dotted 1px; text-underline-offset:3px; }
.lb .tl-tog:checked ~ .lb-items label b, .tl-tog:checked + .lb label b { text-decoration:underline dotted 1px; text-underline-offset:3px; }
"""
    return css, "".join(one(t) for t in ts)


# ---------- C · Stories Shown (stretch): no Timeline to open, the stories sit on the card; Find Startups joins Track ----------
def c(ts):
    def one(t):
        links = f'<div class="lc"><p class="lc-k">The {t["nsrc"]} Stories Behind It</p>{stories(t)}</div>'
        right = f'<a class="lc-btn" href="{t["pipeline"]}" title="Opens the Pipeline, filtered to startups in this trend">Startups in This Trend{ICON["arrow"]}</a>'
        return two_col(t, links, right)
    css = """
.lc { margin-top:18px; }
.lc-k { margin:0 0 6px; font:600 14px/1 var(--font-body); letter-spacing:.08em; color:var(--text-3); }
.lc .tl-stories { margin-top:4px; }
.lc-btn { display:inline-flex; align-items:center; gap:8px; justify-self:start; min-height:44px; padding:0 14px; border:1px solid var(--red-ink); border-radius:8px; color:var(--red-ink); font:600 16px/1 var(--font-body); text-decoration:none; }
.lc-btn svg { width:17px; height:17px; fill:none; stroke:currentColor; stroke-width:2; stroke-linecap:round; }
"""
    return css, "".join(one(t) for t in ts)


BASE = r1.BASE + """
.tb { display:grid; grid-template-columns:minmax(0,1fr) 240px; gap:36px; padding:32px 4px; border-top:1px solid var(--border); }
.tb:first-child { border-top:0; }
.tb h3 { margin:12px 0 0; font:600 30px/1.15 var(--font-head); color:var(--heading); }
.tb-lead { margin:12px 0 0; font:400 19px/1.55 var(--font-body); color:var(--text-2); max-width:60ch; }
.tb-r { display:grid; gap:10px; align-content:start; padding-left:28px; border-left:1px solid var(--border); }
.tb-n { margin:0; font:600 17px/1 var(--font-body); color:var(--text-3); }
.tb-n b { display:block; font:600 46px/1.1 var(--font-head); color:var(--mint, #6fe3b4); margin-bottom:10px; }
.tb-sub { margin:0; font:500 16px/1.4 var(--font-body); color:var(--text-3); }
.tb-r .spark { width:100%; height:auto; }
.tb-favs { display:flex; gap:10px; }
.tb-r .btn { justify-self:start; }
.tl-stories { list-style:none; margin:14px 0 0; padding:0; display:grid; gap:10px; }
/* A and B: the stories show only while their button is on; option C shows them always */
.tl-tog ~ .tl-stories, .tl-tog ~ * .tl-stories { display:none; }
.tl-tog:checked ~ .tl-stories, .tl-tog:checked ~ * .tl-stories { display:grid; }
.tl-stories li { display:grid; grid-template-columns:18px minmax(0,1fr); gap:10px; align-items:start; }
.tl-stories img { width:18px; height:18px; margin-top:3px; border-radius:4px; }
.tl-stories a { color:var(--text); font:500 17px/1.4 var(--font-body); text-decoration:underline dotted 1px; text-underline-offset:3px; }
.tl-stories small { display:block; font:400 15px/1.3 var(--font-body); color:var(--text-3); }
@media (max-width:820px) { .tb { grid-template-columns:minmax(0,1fr); } .tb-r { padding-left:0; border-left:0; } }
"""

OPTIONS = [
    ("A", "Labeled Buttons", "Two outlined buttons under a thin rule, each with an icon and its full words: Find Startups in This Trend, See the 3 Stories.", a, "On-Profile"),
    ("B", "Explore Row", "A shaded row headed Explore This Trend; each item has an icon, a name and a line on what it opens.", b, "On-Profile"),
    ("C", "Stories Shown", "No Timeline to open: the stories sit on the card under their own heading, and Startups in This Trend joins Track on the right.", c, "Stretch"),
]


def main():
    shell = urllib.request.urlopen(SITE + "/trends", timeout=30).read().decode()
    shell = re.sub(r"<script\b[^>]*>.*?</script>", "", shell, flags=re.S)
    shell = re.sub(r'<link[^>]+rel="(?:preload|modulepreload)"[^>]*>', "", shell)
    shell = re.sub(r'(href|src)="/(?!/)', rf'\1="{SITE}/', shell)
    shell = re.sub(r'(<p class="ph-lede">).*?(</p>)', lambda m: m.group(1) + LEDE + m.group(2), shell, count=1, flags=re.S)
    shell = re.sub(r'(<html\b[^>]*?)data-theme="[^"]*"', r'\1data-theme="dark"', shell, count=1)
    ts = r1.trends(shell)
    for t in ts:  # the fixed Find Startups address (11-04-26): the trend's play, not the word "play"
        t["pipeline"] = f'{SITE}/pipeline?play={t["id"][5:]}' if t["id"].startswith("play-") else t["pipeline"]
    manifest = {"project": "VC Scout", "subject": "Sidekick Trends: what Find Startups and Timeline are", "surface": "layout", "claude_rec": "B",
                "compares": ["ux.structure", "ux.detail"],
                "options": [{"id": i, "name": n, "desc": ds, "stretch": tag == "Stretch",
                             "tokens": {"visual": {"layout": "two-column", "energy": "calm"},
                                        "ux": {"structure": {"A": "labeled-buttons", "B": "explore-row-with-hints", "C": "stories-inline"}[i],
                                               "detail": "inline" if i == "C" else "on-demand", "density": "roomy"}}}
                            for i, n, ds, _, tag in OPTIONS]}
    for i, n, ds, fn, tag in OPTIONS:
        css, body = fn(ts)
        page = r1.page(shell, i, css, body, manifest if i == "A" else None).replace(f"<style>{r1.BASE}", f"<style>{BASE}", 1)
        f = HERE / f"TL-{i}-trends.html"
        f.write_text(build.bare(page, f.name))
        print(f)


if __name__ == "__main__":
    main()
