"""Draws the extension icon at each size the manifest lists. Run: python3 scripts/make-icons.py"""

from pathlib import Path

from PIL import Image, ImageDraw

SIZES = [16, 32, 48, 128]
SCALE = 8  # Draw large, then downsample for smooth edges.
OUT = Path(__file__).resolve().parent.parent / "src" / "icons"
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
