"""Draws the extension icon at each size the manifest lists, plus the Chrome Web Store icon.
Run: python3 scripts/make-icons.py"""

from pathlib import Path

from PIL import Image, ImageDraw

SIZES = [16, 32, 48, 128]
SCALE = 8  # Draw large, then downsample for smooth edges.
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "icons"
STORE = ROOT / "store"
TOP, BOTTOM = (242, 88, 64), (208, 48, 32)


def draw(size: int) -> Image.Image:
    s = size * SCALE
    # Vertical gradient, masked to a rounded square.
    gradient = Image.new("RGB", (1, s))
    for y in range(s):
        t = y / (s - 1)
        gradient.putpixel((0, y), tuple(round(a + (b - a) * t) for a, b in zip(TOP, BOTTOM)))
    gradient = gradient.resize((s, s))
    mask = Image.new("L", (s, s), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, s - 1, s - 1], radius=s * 0.22, fill=255)
    icon = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    icon.paste(gradient, mask=mask)

    # Two overlapping play triangles: fast forward.
    d = ImageDraw.Draw(icon)
    h = s * 0.42  # triangle height
    w = h * 0.78  # triangle width
    cy = s / 2
    left = s / 2 - w * 0.95
    for x in (left, left + w * 0.9):
        d.polygon([(x, cy - h / 2), (x + w, cy), (x, cy + h / 2)], fill="white")

    return icon.resize((size, size), Image.LANCZOS)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for size in SIZES:
        draw(size).save(OUT / f"icon-{size}.png")
        print(f"wrote icons/icon-{size}.png")

    # The store wants 96x96 artwork centered in a transparent 128x128 square.
    STORE.mkdir(exist_ok=True)
    store_icon = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    store_icon.paste(draw(96), (16, 16))
    store_icon.save(STORE / "icon-128.png")
    print("wrote store/icon-128.png")
