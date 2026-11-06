#!/usr/bin/env python3
"""The site's favicon, from the logo of record (After Hours E1): Sidekick's arrows in mint on night. No glow: it
doesn't show at 16-32 px, and macOS's SVG renderer (CoreSVG) drops the filter, so the PNGs and the SVG would differ.

user, 10-31-26: "ensure when we do deploy to vercel in the future that we for sure have a favicon". Writes, beside
this file in favicon/: icon.svg (the tab icon, any size), icon.png (512 x 512, rounded corners) and apple-icon.png
(180 x 180, a full square: iOS rounds it itself and fills transparency with black). At build step 13 these become the
Engine's `app/icon.svg`, `app/icon.png` and `app/apple-icon.png` for Sidekick. Run: python3 build_favicon.py
"""
import subprocess
from pathlib import Path

from build import INNER, MINT, NIGHT, OUTER

HERE = Path(__file__).resolve().parent
OUT = HERE / "favicon"


def icon(size, rounded=True):
    mark = size * 0.6
    pad = (size - mark) / 2
    s = mark / 781
    corner = f' rx="{size * 0.22:.1f}"' if rounded else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}">'
            f'<rect width="{size}" height="{size}"{corner} fill="{NIGHT}"/>'
            f'<g transform="translate({pad:.2f} {pad:.2f}) scale({s:.5f}) translate(-23 -42)">'
            f'<polygon points="{OUTER}" fill="{MINT}"/><polygon points="{INNER}" fill="{MINT}"/></g></svg>')


def png(svg, name, size):
    """Exact pixels and transparent corners: svg2png.swift draws the SVG with AppKit, no window, no browser."""
    src = OUT / f"_{name}.svg"
    src.write_text(svg)
    try:
        subprocess.run(["swift", str(HERE / "svg2png.swift"), str(src), str(OUT / name), str(size)], check=True)
    finally:
        src.unlink()


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    (OUT / "icon.svg").write_text(icon(64))
    png(icon(512), "icon.png", 512)
    png(icon(180, rounded=False), "apple-icon.png", 180)
    print("wrote favicon/icon.svg, favicon/icon.png, favicon/apple-icon.png")
