#!/usr/bin/env python3
"""The logo of record (After Hours E1) and the tab icons, written into the firm's brand/ folder for the site (Plan step 11).

brand/logo.svg is Sidekick's wordmark and arrows exactly as build.py draws them on the dark header (pale mint words,
glowing mint arrows), with the PNG they are cut from embedded, so the file stands alone. "AI SCOUT" and the rule beside
it are drawn by the site in Bodoni Moda (an SVG shown as a picture can't load a web font). The tab icons are the
favicon of record (build_favicon.py). Run: python3 build_brand.py
"""
import base64
import shutil
from pathlib import Path

from build import logo

HERE = Path(__file__).resolve().parent
BRAND = HERE.parent.parent / "brand"
png = base64.b64encode((HERE / "assets" / "sk-white.png").read_bytes()).decode()
svg = logo("#f4f9f8", 463, mark="#30e1ae", glow=True)
svg = svg.replace('href="assets/sk-white.png"', f'href="data:image/png;base64,{png}"')
svg = svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ', 1)
(BRAND / "logo.svg").write_text(svg)
for name in ("icon.png", "apple-icon.png"):
    shutil.copyfile(HERE / "favicon" / name, BRAND / name)
print("wrote", BRAND / "logo.svg", "and the tab icons")
