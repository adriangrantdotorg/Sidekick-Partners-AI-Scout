"""The logo of record's one sizing rule (After Hours E1, user 10-31-26: "e1"): every picture that draws Sidekick's
logo with AI SCOUT beside it takes its numbers from here, never its own math (11-03-26: the share image redid the math,
left out Bodoni's 0.77, and drew AI SCOUT 23% short and off Sidekick's line).

Measured 10-31-26: Sidekick's logo PNG is 463 units tall; its letters ("S", the "k" ascenders) are 300 units tall and
reach its bottom edge, so AI SCOUT sits on the row's baseline. Bodoni Moda 600's capitals are 0.77 of its font size.
The site's header (brand/theme.css: the logo 30px, AI SCOUT 25.2px) follows the same rule; Engine's test
tests/firms/sidekick-partners/lockup.test.ts fails if it drifts.
"""
LOGO_H = 463  # the logo PNG's height, in units
LETTERS_H = 300  # Sidekick's letters ("S", the "k" ascenders)
CAP = 0.77  # Bodoni Moda 600's capitals, as a share of its font size
LETTER_SPACING_EM = 0.05
RULE_GAP = 0.28  # the space each side of the rule, in logo heights


def font_size(h):
    """AI SCOUT's font size for a logo h px tall: its capitals as tall as Sidekick's letters."""
    return LETTERS_H * h / LOGO_H / CAP


def html(h, logo_src, accent="#30e1ae", glow=True):
    """The lockup as HTML: Sidekick's logo, the rule, AI SCOUT, all on Sidekick's baseline."""
    shadow = f"box-shadow:0 0 10px {accent}99;" if glow else ""
    return (f'<div class="lock" style="display:flex;align-items:baseline;gap:{h * RULE_GAP:.0f}px">'
            f'<img src="{logo_src}" style="height:{h}px;display:block" alt="">'
            f'<i style="width:{max(2, h * .05):.0f}px;height:{h}px;background:{accent};{shadow}display:block"></i>'
            f'<b style="font:600 {font_size(h):.1f}px/1 \'Bodoni Moda\';color:{accent};letter-spacing:{LETTER_SPACING_EM}em;'
            f'white-space:nowrap">AI SCOUT</b></div>')
