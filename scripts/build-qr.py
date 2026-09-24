#!/usr/bin/env python3
"""Build the QR codes that point at the site.

    pip install segno pillow numpy opencv-python-headless
    python3 scripts/build-qr.py

Writes into brand/ at the repository root — alongside the site rather than
inside public/, because these are printed, not served.

Two versions of the same code:

  qr-vectronia-one.svg / .png       the plain one, black on white
  qr-vectronia-one-marke.svg / .png the brand's colours with the mark set in

The plain one is what a printer wants and what scans off anything. The other
is for a card or a sign, where it is seen as much as it is used.

Every file is decoded again after it is written, at the sizes it will actually
be met at, and the script fails rather than shipping a code that does not read.
"""
from pathlib import Path

import cv2
import numpy as np
import segno
from PIL import Image

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "brand"
URL = "https://vectronia-one.de"

# The brand's own two colours. Measured at 13.6:1 against each other, well past
# the roughly 3:1 a scanner needs to tell a dark module from a light one, so
# the code keeps the site's voice without trading away any reliability.
INK = "#191c28"
PAPER = "#f3ece5"

# Error correction. 'h' recovers about 30% of a damaged code, which is what
# pays for the mark in the middle — and, on a card carried in a pocket or a
# sign standing in the rain at a meet, for the wear as well. It costs modules:
# the code goes from 25 to 33 a side, so each one is smaller at the same
# printed width. That is the trade, and it is worth it here.
ERROR = "h"

# How wide the mark sits across the code. The mark is opaque, so whatever it
# covers is damage the error correction has to carry. 0.22 of the width is
# about 5% of the area — a sixth of the budget — which leaves the rest for the
# real world.
MARK_WIDTH = 0.22


def write(name: str, dark: str, light: str, mark: bool) -> None:
    qr = segno.make(URL, error=ERROR)
    OUT.mkdir(exist_ok=True)

    # Vector first: a printed code should be set from curves, not from pixels,
    # so it stays crisp at any size a press or a plotter asks for.
    svg = OUT / f"{name}.svg"
    qr.save(svg, scale=10, border=4, dark=dark, light=light)
    _make_scalable(svg)

    # And a raster for everywhere a vector is not taken. 40 modules-worth of
    # pixels each: at 33 modules and a 4-module quiet zone that is a 1640px
    # image, enough to print the code at 40mm and still hold 300dpi.
    png = OUT / f"{name}.png"
    qr.save(png, scale=40, border=4, dark=dark, light=light)

    if mark:
        _set_mark(png, svg, dark, light)


def _make_scalable(svg: Path) -> None:
    """Give the file a viewBox and square edges.

    segno writes width and height but no viewBox, so the drawing has a fixed
    size and ignores the box it is placed in: asked for 240px it rendered at
    its own 370 and came out cropped, which no scanner then read. With a
    viewBox it scales to whatever it is given.

    `crispEdges` turns off antialiasing on the modules. A module is a square
    of one colour; softening its edge only moves the boundary a scanner is
    looking for.
    """
    text = svg.read_text()
    side = text[text.index('width="') + 7 : text.index('"', text.index('width="') + 7)]
    text = text.replace(
        f'width="{side}" height="{side}"',
        f'width="{side}" height="{side}" viewBox="0 0 {side} {side}" shape-rendering="crispEdges"',
        1,
    )
    svg.write_text(text)


def _set_mark(png: Path, svg: Path, dark: str, light: str) -> None:
    """Lay the brand mark over the middle of both renditions."""
    code = Image.open(png).convert("RGBA")
    art = Image.open(REPO / "public/brand/vectronia-mark-1440.webp").convert("RGBA")
    alpha = np.asarray(art)[..., 3]
    ys, xs = np.nonzero(alpha > 8)
    art = art.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))

    width = round(code.width * MARK_WIDTH)
    scale = min(width / art.width, width / art.height)
    art = art.resize((max(1, round(art.width * scale)), max(1, round(art.height * scale))), Image.LANCZOS)

    # The mark is recoloured to the code's own ink and set on a patch of its
    # paper. Left transparent it would sit on whatever modules happen to be
    # underneath, and a scanner would read the mixture as noise rather than as
    # a clean hole the error correction can fill in.
    tinted = Image.new("RGBA", art.size, dark)
    tinted.putalpha(art.split()[3])

    pad = round(width * 0.14)
    patch = Image.new("RGBA", (art.width + 2 * pad, art.height + 2 * pad), light)
    patch.alpha_composite(tinted, (pad, pad))

    code.alpha_composite(patch, ((code.width - patch.width) // 2, (code.height - patch.height) // 2))
    code.convert("RGB").save(png)

    # The SVG gets the same treatment, as an embedded copy of the mark's own
    # path so the file stays a vector throughout.
    #
    # The box is computed from the path's own extent rather than taken from
    # icon.svg, whose viewBox carries the margin a browser tab needs. Reused
    # here that margin was a second, invisible frame inside the patch, and the
    # mark came out smaller and off to one side of where the raster put it.
    # Half the outline is added back so the stroke has somewhere to go.
    mark_svg = (REPO / "src/app/icon.svg").read_text()
    inner = mark_svg[mark_svg.index("<path") : mark_svg.rindex("</svg>")]
    pen = float(inner[inner.index('stroke-width="') + 14 : inner.index('"', inner.index('stroke-width="') + 14)])
    art = Image.open(REPO / "public/brand/vectronia-mark-1440.webp")
    vx = vy = -pen / 2
    vw, vh = art.width + pen, art.height + pen

    text = svg.read_text()
    first = text.index('width="') + 7
    side = float(text[first : text.index('"', first)].rstrip("pt"))
    w = side * MARK_WIDTH
    p = w * 0.14
    box = w + 2 * p
    overlay = (
        f'<rect x="{(side - box) / 2:.2f}" y="{(side - box) / 2:.2f}" width="{box:.2f}" '
        f'height="{box:.2f}" fill="{light}"/>'
        f'<svg x="{(side - w) / 2:.2f}" y="{(side - w) / 2:.2f}" width="{w:.2f}" height="{w:.2f}" '
        f'viewBox="{vx} {vy} {vw} {vh}" shape-rendering="geometricPrecision">'
        f'<g fill="{dark}" stroke="{dark}">{inner}</g></svg>'
    )
    svg.write_text(text.replace("</svg>", overlay + "</svg>"))


def check(png: Path) -> None:
    """Decode the finished file at the sizes it will be met at."""
    detector = cv2.QRCodeDetector()
    original = Image.open(png).convert("RGB")
    for side in (1640, 800, 400, 200, 120):
        probe = original.resize((side, side), Image.LANCZOS)
        found, *_ = detector.detectAndDecode(cv2.cvtColor(np.array(probe), cv2.COLOR_RGB2BGR))
        state = "gelesen" if found == URL else f"FEHLER ({found!r})"
        print(f"    {side:>5}px  {state}")
        if found != URL and side >= 200:
            raise SystemExit(f"{png.name} ist bei {side}px nicht lesbar")


def main() -> None:
    qr = segno.make(URL, error=ERROR)
    print(f"{URL}  ->  Version {qr.version}, {qr.symbol_size(scale=1, border=0)[0]} Module, Korrektur {ERROR.upper()}")

    for name, dark, light, mark in (
        ("qr-vectronia-one", "#000000", "#ffffff", False),
        ("qr-vectronia-one-marke", INK, PAPER, True),
    ):
        write(name, dark, light, mark)
        png = OUT / f"{name}.png"
        print(f"\n  {name}")
        print(f"    {png.stat().st_size / 1024:>5.0f} KB PNG, {(OUT / f'{name}.svg').stat().st_size / 1024:.0f} KB SVG")
        check(png)


if __name__ == "__main__":
    main()
