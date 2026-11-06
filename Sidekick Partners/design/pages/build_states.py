#!/usr/bin/env python3
"""Design step 4: the hard states, in the look of record (Boardroom on Emerald Exchange, V5).

Plan section 8, step 4: "the chosen look with an empty page, a deck being read, the Deck Screen result with its
'Not saved' notice, and a Unit Economics panel that is mostly 'unknown', so nothing is designed only for the best
case." Four bare pages, nothing added. Cartwise and Steadfast Health are made up; every made-up number says Sample.
Writes S1-first-run.html, S2-deck-reading.html, S3-deck-result.html, S4-mostly-unknown.html. Run: python3 build_states.py
"""
import importlib.util
from pathlib import Path

_spec = importlib.util.spec_from_file_location("pages_round3", Path(__file__).resolve().parent / "build_round3.py")
r3 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(r3)
b = r3.b
SAMPLE, ring, mono, IND = b.SAMPLE, b.ring, b.mono, b.IND

STATES_CSS = """
.prog{height:10px;border-radius:5px;background:var(--ringbg);overflow:hidden;margin:16px 0 8px}
.prog i{display:block;height:100%;background:var(--ring);border-radius:5px}
.progline{display:flex;justify-content:space-between;gap:16px;color:var(--muted)}
.sk{display:block;background:#e6dcc6;border-radius:4px}
.skrow{display:grid;grid-template-columns:40px 36px 1fr 1fr 80px 140px;gap:14px;align-items:center;padding:14px 12px;border-bottom:1px solid var(--line)}
.waitnote{margin:12px 0 0;color:var(--muted)}
.steps{list-style:none;margin:18px 0 0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:10px 28px}
.steps li{display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid var(--line)}
.steps li>span:last-child{display:flex;flex-direction:column;gap:2px}
.steps small{font-size:16px;color:var(--muted)}
.steps .dot{margin-top:2px}
.steps .dot{width:22px;height:22px;border-radius:50%;display:inline-grid;place-items:center;font-size:13px;font-weight:700;flex:none}
.steps .done .dot{background:var(--ring);color:#f6f1e4}
.steps .now .dot{border:2px solid var(--ring);animation:dotbreathe 6s ease-in-out infinite}
.steps .todo .dot{border:2px solid var(--line)}
.steps .todo{color:var(--muted)}
.steps .now b{color:var(--text)}
@keyframes dotbreathe{0%,100%{box-shadow:0 0 0 0 rgba(27,93,74,.0)}50%{box-shadow:0 0 0 6px rgba(27,93,74,.18)}}
@media (prefers-reduced-motion: reduce){.steps .now .dot{animation:none}}
.notsavedbar{display:flex;gap:16px;align-items:baseline;border-left:4px solid #c9a45c}
.notsavedbar b{white-space:nowrap;color:var(--warn);font-size:20px}
.bottomline{font-family:var(--hfont);font-size:30px;line-height:1.3;margin:0}
.screen dt{font-weight:700;margin-top:14px}
.screen dd{margin:4px 0 0;color:var(--text)}
.flags li{margin:8px 0}
.flags .st{margin-left:8px}
.thin{color:var(--muted);margin:0}
"""

look = dict(b.LOOKS["V5"])
look["name"] = "States"
b.LOOKS["S"] = look
b.EXTRA["S"] = b.EXTRA["V5"] + STATES_CSS

STATUS = {"ok": "Verified", "rep": "Reported", "thumb": "Rule of Thumb", "fyi": "FYI", "none": ""}


def ue_blocks(blocks):
    out = ""
    for title, lines in blocks:
        rows = ""
        for name, val, kind, note, ref, st in lines:
            stl = f'<span class="st {"ok" if st == "ok" else "thumb"}">{STATUS[st]}</span>' if STATUS[st] else ""
            rows += (f'<div class="uel"><span class="uen">{name}</span><span class="uev {kind}">{val}</span>'
                     f'<span class="uer">{ref} {stl}</span>{f"<span class=uenote>{note}</span>" if note else ""}</div>')
        out += f'<div class="ueb"><h4>{title}</h4>{rows}</div>'
    return f'<div class="ue">{out}</div>'


def first_run():
    sk_rows = "".join(f'<div class="skrow"><span class="sk" style="height:14px;width:18px"></span>'
                      f'<span class="sk" style="height:36px;width:36px"></span><span class="sk" style="height:16px;width:{w}%"></span>'
                      f'<span class="sk" style="height:16px;width:70%"></span><span class="sk" style="height:16px"></span>'
                      f'<span class="sk" style="height:16px"></span></div>' for w in (62, 48, 70, 55, 40))
    body = f"""
<section class="start"><div style="flex:1"><h2>Scout's First Run</h2>
<p>Scout is reading 12 months of public funding news, SEC filings and trade press to find startups that fit Sidekick's
thesis. Picks appear on this page as Scout finds them. After this first run, Scout updates every morning.</p>
<div class="prog"><i style="width:38%"></i></div>
<div class="progline"><span>4,180 of 11,000 stories read {SAMPLE}</span><span>23 startups inside the thesis so far {SAMPLE}</span></div></div></section>

<section class="must"><div class="mustart" style="--m:#2a4a40"><span class="sk" style="width:96px;height:96px;background:rgba(255,255,255,.12)"></span></div>
<div class="mustbody"><p class="kicker">Must See · The Highest-Fit Startup Recently in the News</p>
<span class="sk" style="height:44px;width:60%;margin:6px 0 14px"></span><span class="sk" style="height:18px;width:80%;margin-bottom:10px"></span>
<span class="sk" style="height:18px;width:45%"></span>
<p class="waitnote">Appears once Scout has ranked its first startups.</p></div>
<div class="mustfit"><span class="sk" style="width:120px;height:120px;border-radius:50%"></span><span>Thesis Fit</span></div></section>

<section class="block nocopy"><h2>Shortlist <small>Top 10 Startups by Thesis Fit · Updated Daily</small></h2>{sk_rows}
<p class="waitnote">The Shortlist fills in as the first run finishes.</p></section>"""
    return b.page("S", "Today", body, title="Today (first run)")


def deck_reading():
    # What each check does for the reader (user, 10-31-26: "Better communicate what is actually happening here and why
    # it is of value to the reader. Instead of things like "founder," maybe it's "founder startup fit." Also remember my
    # casing preference.")
    steps = [("done", "Read the Deck", "All 18 pages, text and charts"),
             ("done", "Stage and Raise", "Is this a round Sidekick invests in, at a check size it writes?"),
             ("now", "Unit Economics", "Margins, payback and retention against 2025-26 benchmarks · reading page 9 of 18"),
             ("todo", "Path to Profit", "Can it reach break-even on the money it's raising?"),
             ("todo", "Founder–Startup Fit", "Why this team is the one to win this market"),
             ("todo", "Exit Path", "Who would buy it, and what buyers like them have paid"),
             ("todo", "What's Missing", "The numbers a partner will ask for that the deck leaves out"),
             ("todo", "Moat", "What stops a funded rival from copying it within a year"),
             ("todo", "Open Questions", "Its vaguest claim, and the question the founder least wants asked"),
             ("todo", "Bottom Line", "One sentence: take the meeting, or pass")]
    lis = "".join(f'<li class="{st}"><span class="dot">{"✓" if st == "done" else ""}</span><span><b class="lbl">{n}</b>'
                  f'<small>{d}</small></span></li>' for st, n, d in steps)
    body = f"""
<p class="crumb">Deck Screen</p>
<section class="block nocopy"><h2>Reading Cartwise's Deck</h2>
<p class="thin">Scout reads the deck the way a partner would, checking each point Sidekick underwrites, so you walk into the
meeting with a first pass already done.</p>
<p class="thin">Cartwise_Seed_Deck.pdf · 18 pages · dropped 10-31-26 at 6:02 PM {SAMPLE}</p>
<div class="prog"><i style="width:45%"></i></div>
<div class="progline"><span>A first pass takes about 2 minutes</span><span>About a minute left</span></div>
<ul class="steps">{lis}</ul></section>
<section class="already notsavedbar"><b>Not Saved</b><span>You're viewing a prototype, so this result disappears when you leave
the page. Saving comes in Phase II, once user joins the team.</span></section>"""
    return b.page("S", "", body, title="Deck Screen (reading)")


def deck_result():
    ue = ue_blocks([
        ("Price and Revenue", [("Price", f"$450 a month, average {SAMPLE}", "", "From the deck", "No reference: pricing varies", "none"),
                               ("ARR Growth", f"3.1x in 12 months {SAMPLE}", "", "From the deck",
                                "Median 75% under $1M ARR, 40% at $1-5M", "ok"),
                               ("Gross Margin", f"71% {SAMPLE}", "", "From the deck", "AI-heavy tools about 60% · median 77%", "ok")]),
        ("Cost to Win a Customer", [("CAC Payback", "Not in the deck", "unk", "", "Median 11 months · great 6 or less", "ok")]),
        ("What a Customer Is Worth", [("Net Revenue Retention", "Not in the deck", "unk", "",
                                       "Median 98% per seat, 108% on usage · great 120%+", "ok")]),
        ("Months to Pay Back", [("Burn Multiple", "Not in the deck", "unk", "", "1.5-2.0x acceptable at Series A · under 1.0x exceptional", "ok")]),
    ])
    body = f"""
<p class="crumb">Deck Screen › Cartwise</p>
<section class="already notsavedbar"><b>Not Saved</b><span>You're viewing a prototype, so this result disappears when you leave
the page. Saving comes in Phase II, once user joins the team.</span></section>

<section class="deal"><div class="dealart" style="--m:{b.MONO["Cartwise"]}">{mono("Cartwise", True)}</div>
<div class="dealbody"><h1>Cartwise</h1><p class="lede">AI upsell offers for Shopify brands.</p>
<p class="meta"><span class="chip">Industry 3 · {IND[3]}</span><span class="chip">Seed</span><span class="chip">From a Dropped Deck</span></p>
<div class="acts"><a class="btn cta" href="#">Copy Memo Notes</a><a class="btn ghost" href="#">Drop Another Deck</a></div></div>
<div class="dealfit">{ring(78, 120)}<span>Thesis Fit</span><p class="raised">Raising<br><b>$2.5M</b> {SAMPLE}</p></div></section>

<section class="block"><h2>Bottom Line</h2><p class="bottomline">A fast-growing upsell app whose headline number is unproven.
Take the meeting only if they share holdout-test data.</p></section>

<div class="two">
<section class="block"><h2>The Screen</h2><dl class="screen">
<dt>Stage and Raise</dt><dd>Seed, raising $2.5M {SAMPLE}; inside Sidekick's check range.</dd>
<dt>Unit Economics</dt><dd>$1.2M ARR from 140 merchants {SAMPLE}; margin and growth below. Retention and payback aren't in the deck.</dd>
<dt>Path to Profit</dt><dd>Claims break-even at $3M ARR {SAMPLE}; no cost plan behind it.</dd>
<dt>Founder–Startup Fit</dt><dd>Two founders, both ex-Shopify partner agencies {SAMPLE}.</dd>
<dt>Exit Path</dt><dd>Commerce platforms buy tools like this: Instacart bought Caper for about $350M (10-19-21).</dd>
<dt>What's Missing</dt><dd>Churn, payback, and how the 18% lift was measured.</dd></dl></section>

<section class="block"><h2>Moat and Open Questions</h2><dl class="screen">
<dt>Moat</dt><dd>Thin today: a funded rival could copy the offer engine within a year; the data from 140 stores is the start of one.</dd>
<dt>The Vaguest Claim</dt><dd>"Lifts average order value 18%." Measured how? The deck shows no holdout test.</dd>
<dt>The Question They'd Least Like Asked</dt><dd>How many of your 140 merchants are Shopify Plus brands, and what's monthly churn for the rest?</dd></dl></section>
</div>

<section class="block"><h2>Unit Economics <small>From the Deck · Industry 3 References From 2025-26</small></h2>{ue}</section>

<section class="block"><h2>Red Flags for E-Commerce Software</h2><ul class="flags">
<li>How much revenue comes from Shopify Plus brands <span class="st thumb">Not in the Deck</span></li>
<li>Return on spend claimed without a holdout test <span class="st thumb">Found in the Deck</span></li>
<li>Shopify's 15% fee left out of cost of revenue <span class="st ok">Included</span></li></ul></section>"""
    return b.page("S", "", body, title="Deck Screen · Cartwise")


def mostly_unknown():
    c = next(x for x in b.CO if x[0] == "Steadfast Health")
    ue = ue_blocks([
        ("Price and Revenue", [("Price Per Month", f"$79 a month {SAMPLE}", "est", "Estimate: its pricing page",
                                "Hims $83 a month (a public company, not a startup bar)", "ok"),
                               ("Gross Margin", "Unknown", "unk", "", "Hims 74%; employer channel: Hinge Health 80%", "ok")]),
        ("Cost to Win a Customer", [("Marketing As % of Revenue", "Unknown", "unk", "", "Hims about 39%", "ok"),
                                    ("Employer Channel", f"2 employer partners announced {SAMPLE}", "est", "Signal: partnership news",
                                     "Employer CAC about $11K vs. about $170 to consumers (2023)", "fyi")]),
        ("What a Customer Is Worth", [("Net Dollar Retention", "Unknown", "unk", "", "Hinge Health 117%", "ok")]),
        ("Months to Pay Back", [("Churn and Payback", "Unknown", "unk", "", "No independent Seed or A benchmark", "none")]),
    ])
    score = [("Thesis Fit", 25, 30), ("Stage and Check", 20, 20), ("Unit Economics", 0, 20), ("Signal Strength", 11, 15),
             ("Team", 8, 10), ("Geography", 5, 5)]
    bars = "".join(f'<div class="bar"><span>{n}</span><i><b style="width:{g / m * 100:.0f}%"></b></i><em>{g} of {m}</em></div>'
                   for n, g, m in score)
    body = f"""
<p class="crumb"><a href="#">Pipeline</a> › {c[0]}</p>
<section class="deal"><div class="dealart" style="--m:{b.MONO[c[0]]}">{mono(c[0], True)}</div>
<div class="dealbody"><h1>{c[0]}</h1><p class="lede">{c[4]}.</p>
<p class="meta"><span class="chip">Industry 2 · {IND[2]}</span><span class="chip">Seed</span><span class="chip">Boston</span></p>
<div class="acts"><a class="btn cta" href="#">Visit Website</a><a class="btn ghost" href="#">Track</a><a class="btn ghost" href="#">Draft Memo</a></div></div>
<div class="dealfit">{ring(c[2], 120)}<span>Thesis Fit</span><p class="raised">Funds Raised<br><b>{b.money(c[3])}</b> {SAMPLE}</p></div></section>

<div class="two">
<section class="block"><h2>Why It Fits</h2>
<p class="why">Menopause care sold through employers' benefits. Public data is thin: Scout knows its price and its partners,
little else.</p><div class="bars">{bars}</div>
<p class="note">Unit Economics: 1 line estimated, 5 unknown, so it scores 0 of 20. An unknown line costs nothing.</p></section>
<section class="block drop"><h2>Deck Screen</h2><div class="dropzone"><b>Drop {c[0]}'s Pitch Deck</b>
{b.DROP_COPY}</div></section>
</div>

<section class="block"><h2>Unit Economics <small>Industry 2 · {IND[2]} · Thin Public Data</small></h2>{ue}</section>

<section class="block"><h2>Likely Acquirers <small>Strategic Buyers and What They Paid</small></h2>
<p class="thin">No checked deals yet for employer-paid women's health, so Scout names no buyers rather than guess. Exit pace for
the industry: 164 digital health acquisitions through Q3 2026, against 172 by the same point of 2025 (Rock Health).</p></section>"""
    return b.page("S", "Pipeline", body, title=f"{c[0]} (mostly unknown)")


PAGES = {"S1-first-run.html": first_run, "S2-deck-reading.html": deck_reading,
         "S3-deck-result.html": deck_result, "S4-mostly-unknown.html": mostly_unknown}

if __name__ == "__main__":
    for name, fn in PAGES.items():
        (b.HERE / name).write_text(b.bare(fn(), name))
    print("wrote", " ".join(PAGES))
