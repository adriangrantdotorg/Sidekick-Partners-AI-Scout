"""The Backtest page, round 1 (user, 11-04-26, note `Throwaway/Wed, Nov 4th 2026, 04.44.14pm.md`): "the layout of
this page needs to be redesigned to more clearly communicate it ... backtesting is not just about finding deals that
Scout would have discovered from Sidekick's own portfolio, but any startup can be backtested ... Come up with 5
variations ... Better communicate the different sections. Also note that the 'on this page' area will need to be
updated as well."

Each option is the LIVE Backtest page (its header, ticker, title and footer; scripts left out) with the page's body
and its On This Page rail redrawn. Sidekick's deals are the live backtest rows (`backtest-rows.json`, read from the live
database during the 11-04-26 live run); the two startups backtested on request are made up and tagged Sample.

    python3 "Sidekick Partners/design/pages/build_backtest.py"
"""
import html
import json
import pathlib
import re
import urllib.request
from datetime import date
from statistics import median

import importlib.util

# bare(): nothing above the site header, labels in Title Case. Loaded under another name: design/logo has a build.py too
_spec = importlib.util.spec_from_file_location("pages_build", pathlib.Path(__file__).resolve().parent / "build.py")
build = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(build)

HERE = pathlib.Path(__file__).parent
SITE = "https://sidekick-partners-scout.vercel.app"
LEDE = "How early Scout would have sourced a startup."  # user's words, 11-04-26
ANY_COPY = ("Type any startup's name, in Sidekick's portfolio or not. Scout finds its funding announcement, asks you to "
            "confirm its website, then checks public records for an earlier signal.")
WAIT_COPY = ("A deal is backtested once a reputable report puts Sidekick in its round: that report's date is the date "
             "to beat. These are Sidekick's deals with no such report yet. Scout searches for one again every 30 days.")
MISS_COPY = "Backtested, with no public signal before the announcement."


# ---------- data ----------
def d(s):
    return date.fromisoformat(s[:10]) if s else None


def mmddyy(x):
    return x.strftime("%m-%d-%y") if x else ""


def esc(s):
    return html.escape(s or "")


def rows():
    raw = json.loads((HERE / "backtest-rows.json").read_text())
    out = []
    for r in raw:
        ev = r.get("evidence") or []
        proof = next((e for e in ev if e.get("kind") == "Proof"), None)
        sig = [e for e in ev if e.get("counts")]
        out.append(dict(company=r["company"], domain=r.get("domain") or "", verdict=r["verdict"], firm=bool(r["courtside"]),
                        announced=d(r.get("announce_date")), url=r.get("announce_url") or "", title=r.get("announce_title") or "",
                        flagged=d(r.get("flagged_on")), lead=r.get("lead_days"), through=r.get("signal") or "",
                        proof=(proof or {}).get("note") or "", proof_url=(proof or {}).get("url") or r.get("announce_url") or "",
                        signals=[dict(date=d(e["date"]), title=e["title"], url=e["url"], domain=e.get("domain") or "", note=e["note"]) for e in sig],
                        sample=False))
    # two startups backtested on request: made up (none was run on the live site yet)
    out += [
        dict(company="Larkspur Pet", domain="larkspur.example", verdict="win", firm=False, announced=date(2025, 6, 10), url="https://news.example.com/larkspur-seed", title="Larkspur Pet Raises $4M Seed",
             flagged=date(2024, 11, 2), lead=220, through="Hacker News", proof="", proof_url="", sample=True,
             signals=[dict(date=date(2024, 11, 2), title="Show HN: Larkspur, fresh pet food by subscription", url="https://news.ycombinator.com/item?id=0", domain="news.ycombinator.com", note="First mention on Hacker News")]),
        dict(company="Oakline Dental", domain="oakline.example", verdict="win", firm=False, announced=date(2025, 9, 18), url="https://news.example.com/oakline-series-a", title="Oakline Dental Closes $6M Series A",
             flagged=date(2025, 5, 30), lead=111, through="Form D", proof="", proof_url="", sample=True,
             signals=[dict(date=date(2025, 5, 30), title="Oakline Dental Partners filed a Form D", url="https://www.sec.gov/edgar/search/", domain="sec.gov", note="Form D filed by the company's legal entity")]),
    ]
    return out


def report(r):
    """A tile has no room for the round's quote: a link to the report that dates the round instead."""
    return f'<p class="tf-rep"><a href="{esc(r["proof_url"])}" target="_blank" rel="noopener">The Report That Dates the Round</a></p>' if r["proof_url"] else ""


def via(kind):
    return {"Form D": "its Form D", "Hacker News": "a Hacker News post", "News": "a news story", "App Store": "its App Store listing"}.get(kind, kind)


def link(url, words):
    return f'<a href="{esc(url)}" target="_blank" rel="noopener">{esc(words)}</a>' if url else esc(words)


def flagged_line(r):
    first = next((s for s in r["signals"] if s["date"] == r["flagged"]), r["signals"][0] if r["signals"] else None)
    return (f'Scout would have flagged this on {mmddyy(r["flagged"])} through {link(first["url"] if first else "", via(r["through"]))}. '
            f'That&apos;s {r["lead"]} days before {link(r["url"], "its public announcement")}.')


def through(s):
    return "the news" if s == "News" else "the App Store" if s == "App Store" else s


def fav(r):
    return f'<img class="bt-logo" src="https://www.google.com/s2/favicons?sz=64&amp;domain={esc(r["domain"])}" alt="" width="34" height="34">' if r["domain"] \
        else f'<span class="bt-logo bt-mono">{esc(r["company"][0])}</span>'


def name(r):
    n = f'<a href="https://{esc(r["domain"])}" target="_blank" rel="noopener">{esc(r["company"])}</a>' if r["domain"] else esc(r["company"])
    return n + (' <span class="bt-sample">Sample</span>' if r["sample"] else "")


def ann(r):
    a = f'<a href="{esc(r["url"])}" target="_blank" rel="noopener">{esc(r["title"])}</a>' if r["url"] else esc(r["title"])
    return f"Announced {mmddyy(r['announced'])} · {a}"


def proof(r, cls="bt-quote"):
    return f'<p class="{cls}">“{esc(r["proof"])}”</p>' if r["proof"] else ""


def sigs(r, cls="bt-sigs"):
    li = "".join(f'<li><time>{mmddyy(s["date"])}</time><span>' + (f'<a href="{esc(s["url"])}" target="_blank" rel="noopener">{esc(s["title"])}</a>' if s["url"] else esc(s["title"]))
                 + f'<small>{esc(s["domain"])} · {esc(s["note"])}</small></span></li>' for s in r["signals"])
    return f'<ul class="{cls}">{li}</ul>'


def groups(xs):
    firm = [r for r in xs if r["firm"]]
    wins = sorted([r for r in firm if r["verdict"] == "win"], key=lambda r: -(r["lead"] or 0))
    misses = sorted([r for r in firm if r["verdict"] == "none"], key=lambda r: r["company"])
    waiting = sorted([r for r in firm if r["verdict"] == "unproven"], key=lambda r: r["company"])
    others = [r for r in xs if not r["firm"] and r["verdict"] == "win"]
    return wins, misses, waiting, others


def misses_block(misses):
    if not misses:
        return ""
    li = "".join(f'<li>{esc(r["company"])} <small>announced {mmddyy(r["announced"])}</small></li>' for r in misses)
    return f'<div class="bt-miss"><h3>No Earlier Signal ({len(misses)})</h3><p>{MISS_COPY}</p><ul>{li}</ul></div>'


def waiting_block(waiting, open_=False):
    names = ", ".join(esc(r["company"]) for r in waiting)
    return (f'<section class="bt-sec bt-wait" id="waiting"><details{" open" if open_ else ""}><summary><h2>Waiting for a Report</h2>'
            f'<span class="bt-count">{len(waiting)} Deals</span></summary><p>{WAIT_COPY}</p><p class="bt-names">{names}</p></details></section>')


def any_block(shell, top=False):
    m = re.search(r'<section class="any" id="any".*?</section>', shell, re.S)
    assert m, "the live page's Backtest Any Startup section was not found"
    s = re.sub(r"(<h2>Backtest Any Startup</h2>)<p>.*?</p>", rf"\1<p>{esc(ANY_COPY)}</p>", m.group(0), count=1, flags=re.S)
    return s.replace('class="any"', f'class="any bt-any{" bt-any-top" if top else ""}"', 1)


def rail(items, score):
    toc = "".join(f'<a href="#{i}"{" class=\"on\"" if not k else ""}>{esc(t)}</a>' for k, (i, t) in enumerate(items))
    sc = "".join(f"<div><b>{esc(v)}</b><span>{esc(t)}</span></div>" for v, t in score)
    return (f'<aside class="rail"><div class="stick"><div><p class="kicker">On This Page</p><nav class="toc" aria-label="On this page">{toc}</nav></div>'
            f'<div><p class="kicker">Scorecard</p><div class="score">{sc}</div></div></div></aside>')


def score(wins, misses, waiting, misses_shown=True):
    tried = len(wins) + len(misses)
    leads = [r["lead"] for r in wins]
    # C, the pick, shows only wins (user, 11-04-26: remove No Earlier Signal; Courtside 10-14-26: no "Found first"
    # or "none" counts on the Scorecard): just the leads
    if not misses_shown:
        return [(f"{round(median(leads))} d", "Median Days Early"), (f"{max(leads)} d", "Longest Lead")] if leads else []
    out = [(f"{len(wins)} of {tried}", "Found First")]
    if leads:
        out += [(f"{round(median(leads))} d", "Median Days Early"), (f"{max(leads)} d", "Longest Lead")]
    return out + [(str(len(waiting)), "Waiting for a Report")]


def sec(id_, title, sub, body, cls=""):
    return f'<section class="bt-sec {cls}" id="{id_}"><h2>{esc(title)}</h2>' + (f'<p class="bt-sub">{esc(sub)}</p>' if sub else "") + body + "</section>"


TOC = [("firm-deals", "Sidekick's Deals"), ("others", "Startups You Backtested"), ("any", "Backtest Any Startup"), ("waiting", "Waiting for a Report")]


# ---------- A · Race Lines: each deal a line from Scout's flag to the announcement, on one time axis ----------
def axis(xs):
    ds = [r["flagged"] for r in xs if r["flagged"]] + [r["announced"] for r in xs if r["announced"]]
    lo, hi = date(min(ds).year, 1, 1), date(max(ds).year + 1, 1, 1)
    span = (hi - lo).days

    def pct(x):
        return 100 * (x - lo).days / span
    ticks = "".join(f'<span style="left:{pct(date(y, 1, 1)):.2f}%">{y}</span>' for y in range(lo.year, hi.year + 1))
    return pct, ticks


def race(r, pct, ticks):
    a, b = pct(r["flagged"]), pct(r["announced"])
    return (f'<div class="ra-track"><div class="ra-ticks">{ticks}</div><i class="ra-line" style="left:{a:.2f}%;width:{b - a:.2f}%"></i>'
            f'<b class="ra-dot ra-flag" style="left:{a:.2f}%" title="Scout flags it {mmddyy(r["flagged"])}"></b>'
            f'<b class="ra-dot ra-ann" style="left:{b:.2f}%" title="Announced {mmddyy(r["announced"])}"></b></div>'
            f'<div class="ra-keys"><span><i class="k-flag"></i>Scout Flags It · {mmddyy(r["flagged"])} through {esc(through(r["through"]))}</span>'
            f'<span><i class="k-ann"></i>Announced · {mmddyy(r["announced"])}</span></div>')


def a(xs, shell):
    wins, misses, waiting, others = groups(xs)
    pct, ticks = axis(wins + others)

    def card(r):
        return (f'<article class="ra">{fav(r)}<div class="ra-body"><div class="ra-head"><h3>{name(r)}</h3><p class="ra-lead"><b>{r["lead"]}</b> Days Early</p></div>'
                f'<p class="bt-ann">{ann(r)}</p>{race(r, pct, ticks)}{proof(r)}{sigs(r)}</div></article>')
    body = (sec("firm-deals", "Sidekick's Deals", "Each line runs from the day Scout would have flagged the startup to the day its round was announced.",
                "".join(card(r) for r in wins) + misses_block(misses))
            + sec("others", "Startups You Backtested", "Startups outside the portfolio that someone ran below.", "".join(card(r) for r in others))
            + any_block(shell) + waiting_block(waiting))
    css = """
.ra { display:grid; grid-template-columns:34px minmax(0,1fr); gap:14px; padding:20px 0; border-top:1px solid var(--border); }
.ra-head { display:flex; align-items:baseline; justify-content:space-between; gap:16px; }
.ra-head h3 { margin:0; font:600 26px/1.15 var(--font-head); color:var(--heading); }
.ra-lead { margin:0; font:600 16px/1 var(--font-body); color:var(--text-2); white-space:nowrap; }
.ra-lead b { font:600 30px/1 var(--font-head); color:var(--forest); margin-right:4px; }
.ra-track { position:relative; height:44px; margin:14px 0 4px; }
.ra-ticks span { position:absolute; bottom:0; transform:translateX(-50%); font:500 13px/1 var(--font-mono); color:var(--text-3); }
.ra-ticks span::before { content:""; position:absolute; left:50%; bottom:18px; width:1px; height:22px; background:var(--border); }
.ra-line { position:absolute; top:12px; height:6px; border-radius:3px; background:linear-gradient(90deg, var(--forest), #c9a45c); }
.ra-dot { position:absolute; top:7px; width:16px; height:16px; margin-left:-8px; border-radius:50%; }
.ra-flag { background:var(--forest); box-shadow:0 0 0 3px var(--surface), 0 0 12px rgba(48,225,174,.7); }
.ra-ann { background:#c9a45c; box-shadow:0 0 0 3px var(--surface); }
.ra-keys { display:flex; flex-wrap:wrap; gap:6px 22px; font:500 15px/1.4 var(--font-body); color:var(--text-2); margin-bottom:6px; }
.ra-keys i { display:inline-block; width:10px; height:10px; border-radius:50%; margin-right:7px; vertical-align:1px; }
.k-flag { background:var(--forest); } .k-ann { background:#c9a45c; }
"""
    return css, body, rail(TOC, score(wins, misses, waiting))


# ---------- B · Ledger: one table per group, every deal on a row, the signal under it ----------
def b(xs, shell):
    wins, misses, waiting, others = groups(xs)
    head = "<tr><th>Company</th><th>Scout Flags It</th><th>Announced</th><th>Days Early</th><th>Through</th></tr>"

    def row(r):
        top = (f'<tr class="lg-row"><td><span class="lg-co">{fav(r)}{name(r)}</span></td><td>{mmddyy(r["flagged"])}</td><td>{mmddyy(r["announced"])}</td>'
               f'<td class="lg-days"><b>{r["lead"]}</b></td><td>{esc(r["through"])}</td></tr>')
        sub = proof(r, "bt-quote lg-q") + sigs(r)
        return top + f'<tr class="lg-sub"><td colspan="5">{sub}</td></tr>'

    def miss(r):
        return (f'<tr class="lg-row lg-miss"><td><span class="lg-co">{fav(r)}{name(r)}</span></td><td>None Found</td><td>{mmddyy(r["announced"])}</td>'
                f'<td class="lg-days">—</td><td>—</td></tr>')
    firm = f'<table class="lg">{head}{"".join(row(r) for r in wins)}{"".join(miss(r) for r in misses)}</table>'
    body = (sec("firm-deals", "Sidekick's Deals", f"{len(wins)} found first, {len(misses)} with no earlier signal. Days Early counts from Scout's flag to the announcement.", firm)
            + sec("others", "Startups You Backtested", "Startups outside the portfolio that someone ran below.", f'<table class="lg">{head}{"".join(row(r) for r in others)}</table>')
            + any_block(shell) + waiting_block(waiting))
    css = """
.lg { width:100%; border-collapse:collapse; font:500 17px/1.4 var(--font-body); color:var(--text); }
.lg th { text-align:left; font:600 14px/1.2 var(--font-body); letter-spacing:.04em; color:var(--text-3); padding:10px 12px; border-bottom:2px solid #c9a45c; }
.lg td { padding:12px; vertical-align:middle; }
.lg-row td { border-top:1px solid var(--border); }
.lg-co { display:inline-flex; align-items:center; gap:10px; font:600 19px/1.2 var(--font-body); color:var(--heading); }
.lg-co .bt-logo { width:26px; height:26px; }
.lg-days b { font:600 26px/1 var(--font-head); color:var(--forest); }
.lg-sub td { padding:0 12px 14px 48px; }
.lg-q { margin:0 0 6px; }
.lg-miss td { color:var(--text-3); }
"""
    return css, body, rail(TOC, score(wins, misses, waiting))


# ---------- C · Try It First: the tool on top, Sidekick's deals below as the proof it works ----------
def c(xs, shell):
    wins, misses, waiting, others = groups(xs)

    def tile(r):
        return (f'<article class="tf">{fav(r)}<div><h3>{name(r)}</h3><p class="tf-big"><b>{r["lead"]}</b> Days Early</p>'
                f'<p class="tf-how">{flagged_line(r)}</p></div></article>')
    toc = [("any", "Backtest Any Startup"), ("firm-deals", "Proven on Sidekick's Deals"), ("others", "Startups You Backtested"), ("waiting", "Waiting for a Report")]
    body = (any_block(shell, top=True)
            + sec("firm-deals", "Proven on Sidekick's Deals", "The same check, run on every Sidekick deal a reputable report dates.",
                  f'<div class="tf-grid">{"".join(tile(r) for r in wins)}</div>')
            + sec("others", "Startups You Backtested", "", f'<div class="tf-grid">{"".join(tile(r) for r in others)}</div>')
            + waiting_block(waiting))
    css = """
.bt-any-top { margin:0 0 8px; padding:26px 28px; border:1px solid #c9a45c; border-radius:6px; background:#efe7d3; }
.bt-any-top h2 { font-size:34px !important; }
.tf-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:14px; }
.tf { display:grid; grid-template-columns:34px minmax(0,1fr); gap:12px; padding:18px; border:1px solid var(--border); border-radius:6px; background:var(--surface); }
.tf h3 { margin:0; font:600 24px/1.15 var(--font-head); color:var(--heading); }
.tf-big { margin:6px 0 2px; font:600 16px/1 var(--font-body); color:var(--text-2); }
.tf-big b { font:600 40px/1 var(--font-head); color:var(--forest); margin-right:6px; }
.tf-how { margin:8px 0 0; font:500 17px/1.5 var(--font-body); color:var(--text-2); }
.tf-how a { color:#7a5a1c; text-decoration:underline dotted 1px; text-underline-offset:3px; }
.tf h3 a { color:#7a5a1c; text-decoration:none; } .tf h3 a:hover { text-decoration:underline dotted 1px; text-underline-offset:3px; }
.tf-rep { margin:8px 0 0; font:600 15px/1.3 var(--font-body); }
.tf-rep a { color:#7a5a1c; text-decoration:underline dotted 1px; text-underline-offset:3px; }
"""
    return css, body, rail(toc, score(wins, misses, waiting, misses_shown=False))


# ---------- D · Case Files: each deal a two-column case, the lead on the left, the dated trail on the right ----------
def dd(xs, shell):
    wins, misses, waiting, others = groups(xs)

    def case(r):
        trail = "".join(f'<li class="cf-s"><time>{mmddyy(s["date"])}</time><span>' + (f'<a href="{esc(s["url"])}" target="_blank" rel="noopener">{esc(s["title"])}</a>' if s["url"] else esc(s["title"]))
                        + f'<small>{esc(s["note"])}</small></span></li>' for s in r["signals"])
        trail += f'<li class="cf-a"><time>{mmddyy(r["announced"])}</time><span>{ann(r).replace("Announced " + mmddyy(r["announced"]) + " · ", "")}<small>The announcement</small></span></li>'
        return (f'<article class="cf"><div class="cf-l">{fav(r)}<h3>{name(r)}</h3><p class="cf-big">{r["lead"]}</p><p class="cf-unit">Days Early</p>'
                f'<p class="cf-thr">through {esc(through(r["through"]))}</p></div><div class="cf-r">{proof(r)}<ol class="cf-trail">{trail}</ol></div></article>')
    body = (sec("firm-deals", "Sidekick's Deals", "Each case reads top to bottom: the signals Scout would have caught, then the announcement.",
                "".join(case(r) for r in wins) + misses_block(misses))
            + sec("others", "Startups You Backtested", "", "".join(case(r) for r in others))
            + any_block(shell) + waiting_block(waiting))
    css = """
.cf { display:grid; grid-template-columns:220px minmax(0,1fr); gap:26px; padding:22px 0; border-top:1px solid var(--border); }
.cf-l { border-right:1px solid #c9a45c; padding-right:22px; }
.cf-l h3 { margin:10px 0 0; font:600 24px/1.15 var(--font-head); color:var(--heading); }
.cf-big { margin:12px 0 0; font:600 60px/.9 var(--font-head); color:var(--forest); }
.cf-unit { margin:4px 0 0; font:600 15px/1 var(--font-body); letter-spacing:.08em; color:var(--text-2); }
.cf-thr { margin:8px 0 0; font:500 15px/1.3 var(--font-body); color:var(--text-3); }
.cf-trail { list-style:none; margin:10px 0 0; padding:0 0 0 22px; border-left:2px solid var(--border); }
.cf-trail li { position:relative; display:grid; grid-template-columns:86px minmax(0,1fr); gap:12px; padding:8px 0; font:500 17px/1.4 var(--font-body); }
.cf-trail li::before { content:""; position:absolute; left:-29px; top:14px; width:12px; height:12px; border-radius:50%; background:var(--forest); box-shadow:0 0 0 3px var(--surface); }
.cf-trail li.cf-a::before { background:#c9a45c; }
.cf-trail time { font:500 14px/1.7 var(--font-mono); color:var(--text-3); }
.cf-trail small { display:block; font-size:14px; color:var(--text-3); }
"""
    return css, body, rail(TOC, score(wins, misses, waiting))


# ---------- E · Headline (stretch): the best result as a front-page headline, the rest as a short list ----------
def e(xs, shell):
    wins, misses, waiting, others = groups(xs)
    top, rest = (wins[0], wins[1:]) if wins else (None, [])
    hero = ""
    if top:
        hero = (f'<div class="hl-hero"><p class="hl-kick">Scout&apos;s Best Call</p><p class="hl-h">Scout would have found {esc(top["company"])} '
                f'<em>{top["lead"]} days</em> before its round was announced.</p><p class="hl-meta">{fav(top)} Flagged {mmddyy(top["flagged"])} through '
                f'{esc(through(top["through"]))} · {ann(top)}</p>{proof(top)}{sigs(top)}</div>')

    def line(r):
        return (f'<li><span class="hl-d"><b>{r["lead"]}</b> d</span><span class="hl-n">{fav(r)}{name(r)}</span>'
                f'<span class="hl-w">through {esc(through(r["through"]))} · announced {mmddyy(r["announced"])}</span></li>')
    more = f'<ul class="hl-list">{"".join(line(r) for r in rest)}</ul>' if rest else ""
    body = (sec("firm-deals", "Sidekick's Deals", "", hero + more + misses_block(misses))
            + sec("others", "Startups You Backtested", "", f'<ul class="hl-list">{"".join(line(r) for r in others)}</ul>')
            + any_block(shell) + waiting_block(waiting))
    css = """
.hl-hero { padding:26px 0 18px; border-bottom:2px solid #c9a45c; }
.hl-kick { margin:0 0 8px; font:600 15px/1 var(--font-body); letter-spacing:.14em; color:#7a5a1c; }
.hl-h { margin:0; font:600 44px/1.12 var(--font-head); color:var(--heading); max-width:24ch; }
.hl-h em { font-style:normal; color:var(--forest); }
.hl-meta { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin:16px 0 0; font:500 16px/1.4 var(--font-body); color:var(--text-2); }
.hl-meta .bt-logo { width:26px; height:26px; }
.hl-list { list-style:none; margin:6px 0 0; padding:0; width:100%; max-width:none; }
.hl-list li { display:grid; grid-template-columns:90px minmax(0,1fr) auto; gap:14px; align-items:center; padding:12px 0; border-top:1px solid var(--border); }
.hl-d { font:600 15px/1 var(--font-body); color:var(--text-2); } .hl-d b { font:600 30px/1 var(--font-head); color:var(--forest); }
.hl-n { display:inline-flex; align-items:center; gap:10px; font:600 19px/1.2 var(--font-body); color:var(--heading); }
.hl-n .bt-logo { width:26px; height:26px; }
.hl-w { font:500 15px/1.3 var(--font-body); color:var(--text-3); }
"""
    return css, body, rail(TOC, score(wins, misses, waiting))


BASE = """
.bt-sec { margin:0 0 30px; scroll-margin-top:90px; }
.bt-sec > h2, .bt-wait summary h2 { margin:0 0 4px; font:600 30px/1.1 var(--font-head); font-variant:small-caps; letter-spacing:.02em; color:var(--heading); }
.bt-sub { margin:0 0 10px; font:400 17px/1.45 var(--font-body); color:var(--text-2); max-width:68ch; }
.bt-logo { width:34px; height:34px; border-radius:8px; background:#fff; object-fit:contain; }
.bt-mono { display:inline-grid; place-items:center; background:var(--forest) !important; color:#f6f1e4; font:700 17px/1 var(--font-body); }
.bt-sample { display:inline-block; vertical-align:3px; margin-left:6px; padding:3px 7px; border-radius:4px; background:#e9dfc6; color:#5a4214; font:600 12px/1 var(--font-body); letter-spacing:.04em; }
.bt-ann { margin:4px 0 0; font:500 15px/1.5 var(--font-mono); color:var(--text-3); }
.bt-ann a, .bt-sigs a, .cf-trail a, .hl-meta a { color:#7a5a1c; text-decoration:underline dotted 1px; text-underline-offset:3px; }
.bt-quote { margin:8px 0 0; font:italic 400 17px/1.55 var(--font-body); color:var(--text-2); max-width:72ch; }
.bt-sigs { list-style:none; margin:10px 0 0; padding:0; }
.bt-sigs li { display:grid; grid-template-columns:18px 86px minmax(0,1fr); gap:10px; padding:5px 0; font:500 17px/1.4 var(--font-body); }
.bt-sigs li::before { content:"✓"; color:var(--forest); font-weight:700; }
.bt-sigs time { font:500 14px/1.7 var(--font-mono); color:var(--text-3); }
.bt-sigs small { display:block; font-size:14px; color:var(--text-3); }
.bt-miss { margin:18px 0 0; padding:16px 18px; border:1px dashed var(--border); border-radius:6px; }
.bt-miss h3 { margin:0 0 4px; font:600 20px/1.2 var(--font-head); font-variant:small-caps; color:var(--heading); }
.bt-miss p { margin:0 0 8px; font:400 16px/1.4 var(--font-body); color:var(--text-2); }
.bt-miss ul { margin:0; padding:0; list-style:none; display:flex; flex-wrap:wrap; gap:8px 22px; font:600 17px/1.3 var(--font-body); color:var(--text); }
.bt-miss small { font-weight:400; color:var(--text-3); margin-left:4px; }
.bt-wait details { border-top:1px solid var(--border); padding-top:16px; }
.bt-wait summary { list-style:none; cursor:pointer; display:flex; align-items:baseline; gap:14px; }
.bt-wait summary::-webkit-details-marker { display:none; }
.bt-wait summary::after { content:"Show"; margin-left:auto; font:600 15px/1 var(--font-body); color:#7a5a1c; }
.bt-wait details[open] summary::after { content:"Hide"; }
.bt-count { font:600 15px/1 var(--font-body); color:var(--text-3); }
.bt-wait p { margin:10px 0 0; font:400 17px/1.5 var(--font-body); color:var(--text-2); max-width:72ch; }
.bt-wait .bt-names { color:var(--text); }
.bt-any { scroll-margin-top:90px; }
"""

OPTIONS = [
    ("A", "Race Lines", "Each deal a line on one time axis, from Scout's flag to the announcement, with its lead in days.", a, "On-Profile"),
    ("B", "Ledger", "One table per group: every deal on a row with its dates and days early, the signal and the proof under it.", b, "On-Profile"),
    ("C", "Try It First", "Backtest Any Startup comes first, then Sidekick's deals as tiles proving it works.", c, "On-Profile"),
    ("D", "Case Files", "Each deal a two-column case: the lead in big numerals, then its dated trail down to the announcement.", dd, "On-Profile"),
    ("E", "Headline", "The best result as a front-page headline sentence, the other deals as a short list under it.", e, "Stretch"),
]


def page(shell, vid, css, body, rail_html, manifest=None):
    out = re.sub(r'(<p class="lede2">).*?(</p>)', lambda m: m.group(1) + esc(LEDE) + m.group(2), shell, count=1, flags=re.S)
    doc = f'<div class="doc"><div class="main">{body}</div>{rail_html}</div>'
    new = re.sub(r'<div class="doc">.*?</aside></div>', lambda m: doc, out, count=1, flags=re.S)
    assert new != out, "the page's body was not found"
    add = f"<style>{BASE}{css}</style>" + (f'<script type="application/json" id="variation-manifest">{json.dumps(manifest)}</script>' if manifest else "")
    new = new.replace("</head>", add + "</head>", 1)
    return re.sub(r"<body\b", f'<body data-variation="{vid}"', new, count=1)


def main():
    shell = urllib.request.urlopen(SITE + "/backtest", timeout=30).read().decode()
    shell = re.sub(r"<script\b[^>]*>.*?</script>", "", shell, flags=re.S)
    shell = re.sub(r'<link[^>]+rel="(?:preload|modulepreload)"[^>]*>', "", shell)
    shell = re.sub(r'(href|src)="/(?!/)', rf'\1="{SITE}/', shell)
    shell = re.sub(r'(<html\b[^>]*?)data-theme="[^"]*"', r'\1data-theme="light"', shell)
    xs = rows()
    manifest = {"project": "VC Scout", "subject": "Sidekick Backtest page layout", "surface": "layout", "claude_rec": "B",
                "compares": ["visual.layout", "ux.structure"],
                "options": [{"id": i, "name": n, "desc": ds, "stretch": tag == "Stretch",
                             "tokens": {"visual": {"layout": n.lower(), "energy": "bold" if i == "E" else "calm"},
                                        "ux": {"structure": {"A": "timeline", "B": "table", "C": "tool-first", "D": "case-file", "E": "headline"}[i],
                                               "comparison": "before-after", "density": "compact" if i == "B" else "roomy"}}}
                            for i, n, ds, _, tag in OPTIONS]}
    css, body, rail_html = c(xs, shell)
    fin = page(shell, "C", css, body, rail_html)
    (HERE / "BT-final-backtest.html").write_text(fin)
    print(HERE / "BT-final-backtest.html")
    for i, n, ds, fn, tag in OPTIONS:
        css, body, rail_html = fn(xs, shell)
        f = HERE / f"BT-{i}-backtest.html"
        f.write_text(build.bare(page(shell, i, css, body, rail_html, manifest if i == "A" else None), f.name))
        print(f)


if __name__ == "__main__":
    main()
