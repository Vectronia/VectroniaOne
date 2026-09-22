#!/usr/bin/env python3
"""Turn the brand mark into the browser and home-screen icons.

    pip install pillow numpy potracer
    python3 scripts/build-icons.py

Writes src/app/icon.svg, favicon.ico and apple-icon.png, which Next.js picks up
by filename — no markup needed.

The tab icon is a flat silhouette with no tile behind it, traced from the
mark's own alpha and cut to its dense part — see ICON_WIDTH. It carries its colour from the browser theme: near-black on a
light chrome, the page's warm off-white on a dark one. That is what lets it
drop the tile — the chrome supplies the ground, so the mark does not have to.
A single-colour raster cannot do that, which is why this one is a vector.

Tracing polarity is not what you would guess: potrace here treats False as
foreground, and padding the bitmap with True keeps it from outlining the canvas
edge. Checked by rendering the result and comparing it against the original
silhouette — 0.93 IoU at 3.7 KB. Finer settings reach 0.934 for three times the
path, which buys nothing: the remainder is the original's anti-aliased edge,
not the curve fit.

favicon.ico and apple-icon.png keep the navy tile. They are the fallback for
browsers without SVG icon support and the home-screen icon, and neither can
rely on a ground being there — iOS in particular composites away transparency.
Their small sizes are cut tighter than the large ones: at 16px a 4% margin
carries 29% of the tile against 21% at 14%, the difference between a readable
silhouette and a blur.
"""
from pathlib import Path

import numpy as np
import potrace
from PIL import Image

REPO = Path(__file__).resolve().parent.parent
APP = REPO / "src" / "app"
NAVY = (25, 28, 40, 255)


# How much of the mark's width the icon keeps.
#
# The arc tapers away to the right, and the last third of the width carries
# only 5-6% ink against 19-49% across the rest. Fitted whole into a square that
# thin end becomes a stray line trailing out of a 16px tile — legible as a
# scratch, not as part of the mark. Cutting there lifts coverage from 21% to
# 31% and lets the arc end on a real edge.
ICON_WIDTH = 0.62


def trimmed_mark(width: float = 1.0) -> Image.Image:
    """The mark's painted bounds, optionally keeping only its left part."""
    mark = Image.open(REPO / "public/brand/vectronia-mark-1440.webp").convert("RGBA")
    alpha = np.asarray(mark)[..., 3]
    ys, xs = np.nonzero(alpha > 8)
    mark = mark.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))

    if width < 1.0:
        mark = mark.crop((0, 0, round(mark.width * width), mark.height))
        # Re-trim: the cut usually leaves a band of empty rows behind.
        alpha = np.asarray(mark)[..., 3]
        ys, xs = np.nonzero(alpha > 8)
        mark = mark.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
    return mark


def tile(mark: Image.Image, size: int, pad: float) -> Image.Image:
    inner = round(size * (1 - 2 * pad))
    scale = min(inner / mark.width, inner / mark.height)
    small = mark.resize(
        (max(1, round(mark.width * scale)), max(1, round(mark.height * scale))),
        Image.LANCZOS,
    )
    canvas = Image.new("RGBA", (size, size), NAVY)
    canvas.alpha_composite(small, ((size - small.width) // 2, (size - small.height) // 2))
    return canvas


def silhouette_path(mark: Image.Image) -> tuple[str, int, int]:
    """Trace the mark's alpha into one SVG path."""
    solid = np.asarray(mark)[..., 3] <= 128
    padded = np.ones((solid.shape[0] + 4, solid.shape[1] + 4), dtype=bool)
    padded[2:-2, 2:-2] = solid
    traced = potrace.Bitmap(padded).trace(turdsize=8, alphamax=1.0, opttolerance=0.2)

    def point(p) -> str:
        return f"{p.x - 2:.1f} {p.y - 2:.1f}"

    parts = []
    for curve in traced:
        d = [f"M{point(curve.start_point)}"]
        for seg in curve:
            d.append(
                f"L{point(seg.c)}L{point(seg.end_point)}"
                if seg.is_corner
                else f"C{point(seg.c1)} {point(seg.c2)} {point(seg.end_point)}"
            )
        d.append("Z")
        parts.append("".join(d))
    return "".join(parts), mark.width, mark.height


def main() -> None:
    mark = trimmed_mark(ICON_WIDTH)

    d, w, h = silhouette_path(mark)
    (APP / "icon.svg").write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}">'
        "<style>"
        "path{fill:#111114}"
        "@media(prefers-color-scheme:dark){path{fill:#f3ece5}}"
        "</style>"
        f'<path d="{d}"/></svg>\n',
        "utf-8",
    )

    # One .ico carrying all three sizes, so the browser picks a rendition tuned
    # for the size it needs instead of squeezing one down itself.
    sizes = [(16, 0.04), (32, 0.04), (48, 0.06)]
    tiles = [tile(mark, s, p) for s, p in sizes]
    tiles[-1].save(
        APP / "favicon.ico", format="ICO",
        sizes=[(s, s) for s, _ in sizes], append_images=tiles[:-1],
    )

    # Room to breathe where there is room: iOS rounds the corners of the home
    # screen icon, and Android may mask it further.
    tile(mark, 180, 0.14).convert("RGB").save(APP / "apple-icon.png")

    for path in ("icon.svg", "favicon.ico", "apple-icon.png"):
        f = APP / path
        print(f"  {path:<16} {f.stat().st_size:>6} Bytes")


if __name__ == "__main__":
    main()
