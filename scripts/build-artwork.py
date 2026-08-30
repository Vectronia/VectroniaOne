#!/usr/bin/env python3
"""Turn the source PSD artworks into web assets plus a typed manifest.

This is an authoring step, not a build step: the PSDs are large binaries that
stay outside the repository, while the WebP renditions and the manifest it
writes are committed. Re-run it whenever artworks are added or replaced.

    pip install pillow
    python3 scripts/build-artwork.py --src <folder-with-psds>

Identical files are collapsed to one artwork, so re-exported copies of the same
page ("Buch3.psd" and "Buch3 Kopie.psd") do not produce duplicate plates.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

try:
    from PIL import Image
except ModuleNotFoundError:  # pragma: no cover - dependency hint only
    sys.exit("Pillow is required: pip install pillow")

Image.MAX_IMAGE_PIXELS = None

WIDTHS = (960, 1440, 1920, 2560)
QUALITY = 82

REPO = Path(__file__).resolve().parent.parent
OUT_DIR = REPO / "public" / "artwork"
MANIFEST = REPO / "src" / "data" / "artworks.generated.json"

# Upload folders prefix every file with a random id; drop it so the slug stays
# readable and stable across re-uploads of the same artwork.
UPLOAD_PREFIX = re.compile(r"^[0-9a-f]{8}-")


def slugify(name: str) -> str:
    name = UPLOAD_PREFIX.sub("", name)
    name = name.rsplit(".", 1)[0]
    name = name.replace("__Kopie", "").replace("_Kopie", "")
    name = name.lower().replace(".", "-").replace("_", "-").replace(" ", "-")
    name = re.sub(r"[^a-z0-9-]", "", name)
    name = re.sub(r"-+", "-", name).strip("-")
    return name or "artwork"


def digest(path: Path) -> str:
    h = hashlib.md5()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--src", required=True, help="folder containing the .psd files")
    args = parser.parse_args()

    src_dir = Path(args.src).expanduser()
    if not src_dir.is_dir():
        sys.exit(f"not a folder: {src_dir}")

    sources = sorted(src_dir.glob("*.psd"))
    if not sources:
        sys.exit(f"no .psd files in {src_dir}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)

    seen: dict[str, str] = {}
    artworks: list[dict] = []

    for path in sources:
        fingerprint = digest(path)
        if fingerprint in seen:
            print(f"  skip {path.name} — identical to {seen[fingerprint]}")
            continue

        slug = slugify(path.name)
        if any(a["slug"] == slug for a in artworks):
            slug = f"{slug}-{fingerprint[:4]}"
        seen[fingerprint] = path.name

        image = Image.open(path).convert("RGB")
        for width in WIDTHS:
            if width > image.width:
                continue
            height = round(width * image.height / image.width)
            resized = image.resize((width, height), Image.LANCZOS)
            resized.save(OUT_DIR / f"{slug}-{width}.webp", "WEBP", quality=QUALITY, method=6)

        rendered = [w for w in WIDTHS if w <= image.width]
        if not rendered:  # very small source: ship it at native size
            rendered = [image.width]
            image.save(OUT_DIR / f"{slug}-{image.width}.webp", "WEBP", quality=QUALITY, method=6)

        artworks.append(
            {
                "slug": slug,
                "source": UPLOAD_PREFIX.sub("", path.name),
                "width": image.width,
                "height": image.height,
                "aspect": round(image.width / image.height, 4),
                "widths": rendered,
            }
        )
        print(f"  {slug:<14} {image.width}x{image.height}  ->  {len(rendered)} renditions")

    MANIFEST.write_text(json.dumps(artworks, indent=2, ensure_ascii=False) + "\n", "utf-8")
    print(f"\n{len(artworks)} artworks -> {MANIFEST.relative_to(REPO)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
