#!/usr/bin/env python3
"""Turn the brand PSDs into the transparent WebP renditions the site uses.

Like `build-artwork.py` this is an authoring step: the PSDs stay outside the
repository, the renditions are committed. Re-run it when the logo changes.

    pip install pillow psd-tools
    python3 scripts/build-brand.py --mark LogoRose_2.psd --wordmark TypoRose.psd

Both files must carry the artwork alone on a transparent ground — the mark
without the wordmark, the wordmark without the mark. Each is trimmed to its
painted bounds before scaling, so the renditions have no invisible padding and
the hero's positioning proportions stay valid across a re-export.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

try:
    import numpy as np
    from PIL import Image
    from psd_tools import PSDImage
except ModuleNotFoundError:  # pragma: no cover - dependency hint only
    sys.exit("Pillow, numpy and psd-tools are required: pip install pillow numpy psd-tools")

Image.MAX_IMAGE_PIXELS = None

OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "brand"
QUALITY = 90
# The mark is shown from a 36px drawer tab up to full viewport height in the
# hero; the wordmark spans about two thirds of the viewport width.
WIDTHS = {"vectronia-mark": (320, 640, 960, 1440), "vectronia-one": (640, 1280, 1920, 2560)}

# Alpha at or below this counts as background: PSD edges carry a few stray
# values that would otherwise leave a pixel of padding after the trim.
ALPHA_FLOOR = 8


def trimmed(path: Path) -> Image.Image:
    image = PSDImage.open(path).composite().convert("RGBA")
    alpha = np.asarray(image)[..., 3]
    ys, xs = np.nonzero(alpha > ALPHA_FLOOR)
    if not len(ys):
        sys.exit(f"{path.name} is fully transparent — is the background layer still visible?")
    return image.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))


def render(path: Path, name: str) -> None:
    image = trimmed(path)
    for width in WIDTHS[name]:
        height = round(width * image.height / image.width)
        resized = image.resize((width, height), Image.LANCZOS)
        # `exact` keeps the colour of fully transparent pixels instead of
        # letting the encoder invent one, which otherwise haloes the edges.
        resized.save(OUT_DIR / f"{name}-{width}.webp", "WEBP", quality=QUALITY, method=6, exact=True)
    print(f"  {name:<16} {image.width}x{image.height} (trimmed, aspect {image.width / image.height:.4f})"
          f"  ->  {len(WIDTHS[name])} renditions")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mark", required=True, help="PSD holding the mark alone")
    parser.add_argument("--wordmark", required=True, help="PSD holding the wordmark alone")
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    render(Path(args.mark).expanduser(), "vectronia-mark")
    render(Path(args.wordmark).expanduser(), "vectronia-one")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
