#!/usr/bin/env python3
"""Turn the brand mark into the browser and home-screen icons.

    python3 scripts/build-icons.py

Writes src/app/favicon.ico, icon.png and apple-icon.png, which Next.js picks
up by filename — no markup needed.

The mark sits on the brand navy rather than on transparency. Tested at real
size: on a light browser chrome the rose gold on its own all but disappears at
16px, because the metal is nearly as light as the tab behind it. Bringing its
own ground fixes that on light and dark alike.

Small sizes are cut tighter than large ones. At 16px every pixel of the arc
counts, and a margin that looks composed at 512 leaves a smudge; a 4% margin
carries 29% of the tile against 21% at 14%, which is the difference between a
readable silhouette and a blur.
"""
from pathlib import Path

import numpy as np
from PIL import Image

REPO = Path(__file__).resolve().parent.parent
APP = REPO / "src" / "app"
NAVY = (25, 28, 40, 255)


def trimmed_mark() -> Image.Image:
    mark = Image.open(REPO / "public/brand/vectronia-mark-1440.webp").convert("RGBA")
    alpha = np.asarray(mark)[..., 3]
    ys, xs = np.nonzero(alpha > 8)
    return mark.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))


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


def main() -> None:
    mark = trimmed_mark()

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
    tile(mark, 512, 0.12).convert("RGB").save(APP / "icon.png")

    for path in ("favicon.ico", "apple-icon.png", "icon.png"):
        f = APP / path
        print(f"  {path:<16} {f.stat().st_size:>6} Bytes")


if __name__ == "__main__":
    main()
