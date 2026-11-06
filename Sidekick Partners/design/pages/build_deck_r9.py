#!/usr/bin/env python3
"""The Deck Screen's read, round 9: round 7's D (Status Table, user's pick) revised from his note of 11-02-26:
"no where in the app should be things like '! A Claim' or '! No Holdout Test' this formatting is not standard",
"whats the difference between 'partly' and 'a claim'", "thin should be on a separate line", "'no holdout test' is
unclear, rephrase", and his rule: "If I'm asking a question about it, it's because it's not clear to the end user".

So every status is a word with a mark (never "!"), and the four words are defined on the page, above the table. The
Unit Economics heading and the Red Flags below are the live site's, already changed. Writes R9-deck.html. Run with the
test site up on :4702: python3 build_deck_r9.py
"""
import json
import re

from build_deck_screen import CSS as R7_CSS, moat_meter, sec
from build_new_badge import FONTS, HERE, live_css, title_case_ok
from build_round5 import chrome, clean, fetch, grab

# the four states of a check, each defined where it is used
STATES = {
    "shown": ("Shown", "The deck backs it with facts."),
    "partial": ("Partly Shown", "Some of the facts are there, not all."),
    "claimed": ("Claimed, Not Shown", "The deck says it but shows nothing behind it."),
    "absent": ("Not in the Deck", "The deck doesn't cover it."),
}
ROWS = [  # check, state, key figure, in brief (Cartwise, from the sample's own words)
    ("Stage and Raise", "shown", "$2.5M", "Seed; inside Sidekick's $1M to $10M check range"),
    ("The Numbers", "partial", "$1.2M ARR", "Up 3.1x, 71% gross margin; retention and payback not given"),
    ("Path to Profit", "claimed", "$3M", "Break-even at $3M ARR, with no cost plan behind it"),
    ("Founder–Startup Fit", "shown", "2 Founders", "Both from Shopify partner agencies"),
    ("Exit Path", "shown", "~$350M", "Instacart bought Caper (10-19-21)"),
    ("What's Missing", "absent", "3 Gaps", "Churn, payback, and how the 18% lift was measured"),
]

CSS = R7_CSS + """
.st{justify-self:start;display:inline-flex;align-items:center;gap:8px;padding:5px 11px;border-radius:4px;font:700 15px/1.1 var(--font-body);white-space:nowrap}
.st i{flex:none;width:14px;height:14px;border-radius:50%;box-sizing:border-box}
.st.shown{background:#dfeee6;color:#1b5d4a}.st.shown i{background:#1b5d4a}
.st.partial{background:#f6e6c5;color:#7a4b06}.st.partial i{border:2px solid #c98a1b;background:linear-gradient(90deg,#c98a1b 50%,transparent 50%)}
.st.claimed{background:#f6e6c5;color:#7a4b06}.st.claimed i{border:2px solid #c98a1b}
.st.absent{background:#f3ddd5;color:#8c3a24}.st.absent i{border:2px dashed #b4533a}
.key{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px 20px;margin:0 0 18px;padding:14px 16px;background:#efe7d3;border:1px solid #d9cdb0;border-radius:4px}
.key div{display:grid;gap:6px;align-content:start}
.key .st{justify-self:start}
.key span.d{font:500 15px/1.35 var(--font-body);color:#2f3833}
.r9-moat{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:26px}
.r9-moat > div{display:grid;gap:10px;align-content:start}
.r9-moat h3{margin:0;font:700 16px/1.2 var(--font-body);color:#4f564f}
.r9-thin{font:600 32px/1 var(--font-head);color:#7a4b06}
.r9-say{font:500 17px/1.4 var(--font-body);color:#2f3833}
"""


def st(state):
    word, _ = STATES[state]
    return f'<span class="st {state}"><i></i>{word}</span>'


def screen():
    key = '<div class="key">' + "".join(f'<div>{st(k)}<span class="d">{d}</span></div>' for k, (_, d) in STATES.items()) + "</div>"
    trs = "".join(f'<tr><td class="chk">{c}</td><td>{st(s)}</td><td class="fig">{f}</td><td>{b}</td></tr>' for c, s, f, b in ROWS)
    return key + f'<div class="dsD"><table><thead><tr><th>Check</th><th>Status</th><th>Key Figure</th><th>In Brief</th></tr></thead><tbody>{trs}</tbody></table></div>'


def moat():
    return ('<div class="r9-moat">'
            f'<div><h3>Moat Strength</h3>{moat_meter()}<span class="r9-thin">Thin</span>'
            '<span class="r9-say">A funded rival could copy the offer engine within a year; the data from 140 stores is the start of one.</span></div>'
            '<div><h3>The Vaguest Claim</h3><div class="ds-quote">"Lifts average order value 18%."</div>'
            f'{st("claimed")}<span class="r9-say">Not proven: the deck shows no test against a group of shoppers who never saw the offers.</span></div>'
            '<div><h3>The Question They\'d Least Like Asked</h3><span class="r9-say" style="color:#1d2622">How many of your 140 merchants are Shopify Plus brands, and what\'s monthly churn for the rest?</span></div>'
            '</div>')


def main():
    live_css()
    for lab in [w for w, _ in STATES.values()] + ["Moat Strength", "Check", "Status", "Key Figure", "In Brief"]:
        assert title_case_ok(lab), lab
    html = clean(fetch("/deck?sample"))
    top, ticker, foot = chrome(html)
    main_ = grab(html, '<main id="main">', "main")[len('<main id="main">'):-len("</main>")]
    two = grab(main_[main_.index('<div class="x-two">'):], '<div class="x-two">', "div")
    copy = re.search(r'<button type="button" class="x-mdcopy".*?</button>', two, re.S).group(0)
    body = sec("The Screen", "The Screen", screen(), copy, "x-sec ds-one") + sec("Moat and Open Questions", "Moat and Open Questions", moat(), copy, "x-sec ds-one")
    page = f"""<!doctype html>
<html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Deck Screen · Sidekick Partners AI Scout</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}"><link rel="stylesheet" href="assets/live-scout.css"><style>{CSS}</style></head>
<body data-variation="D"><div class="app">{top}{ticker}<main id="main">{main_.replace(two, body)}</main>{foot}</div></body></html>"""
    text = re.sub(r"<script.*?</script>|<style.*?</style>|<[^>]+>", " ", page, flags=re.S)
    assert not re.search(r"(^|\s)!\s+[A-Z]", text), "a label opens with '!'"
    (HERE / "R9-deck.html").write_text(page)
    print("wrote", HERE / "R9-deck.html")


if __name__ == "__main__":
    main()
