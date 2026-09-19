#!/usr/bin/env python3
"""
Builds the Play Console graphic assets from the app's own artwork.

Generated rather than hand drawn so they can be regenerated after an art or copy
change, and so every one of them provably matches Play's specs: the icon needs an
alpha channel, the feature graphic must have none, and screenshots must be plain
24-bit RGB. Getting that wrong is a silent upload rejection.

    python store/make-assets.py

Writes into store/assets/.
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "assets" / "images"
OUT = ROOT / "store" / "assets"
FONTS = ROOT / "node_modules" / "@expo-google-fonts" / "nunito"

# The app's tokens, so the assets cannot drift from the product.
CREAM = (255, 244, 227)
PAPER = (255, 251, 242)
INK = (42, 33, 24)
INK_SOFT = (90, 75, 59)
SUN = (255, 197, 61)
CORAL = (255, 107, 87)
MINT = (47, 191, 143)
GRAPE = (140, 107, 255)


def font(weight: str, size: int) -> ImageFont.FreeTypeFont:
    path = FONTS / weight / f"Nunito_{weight}.ttf"
    return ImageFont.truetype(str(path), size)


def rounded(draw, box, radius, fill, outline=INK, width=0):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline if width else None, width=width)


def sticker(draw, box, radius, fill, offset=10, border=8):
    """A card with the hard offset shadow the whole app is built on."""
    x0, y0, x1, y1 = box
    draw.rounded_rectangle((x0 + offset, y0 + offset, x1 + offset, y1 + offset), radius=radius, fill=INK)
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=INK, width=border)


# --------------------------------------------------------------- app icon

def build_icon():
    """512x512, 32-bit PNG with alpha. Play rejects anything else."""
    src = Image.open(ART / "icon.png").convert("RGB")
    icon = src.resize((512, 512), Image.LANCZOS).convert("RGBA")
    out = OUT / "app-icon-512.png"
    icon.save(out, "PNG")
    return out, icon.size, icon.mode


# -------------------------------------------------------- feature graphic

def build_feature_graphic():
    """
    1024x500, JPEG or 24-bit PNG, no alpha channel.

    Play crops this differently in different placements and overlays the app
    title on some of them, so the composition keeps the middle band clear and
    never puts anything load bearing near an edge.
    """
    W, H = 1024, 500
    img = Image.new("RGB", (W, H), SUN)
    d = ImageDraw.Draw(img)

    # A soft paper panel so the text has somewhere quiet to sit.
    d.rounded_rectangle((-40, 60, 700, 440), radius=40, fill=CREAM)

    # Scattered confetti, well away from the text.
    for cx, cy, r, col in [
        (860, 90, 16, CORAL), (930, 150, 11, MINT), (800, 170, 9, GRAPE),
        (960, 330, 14, CORAL), (880, 410, 10, MINT), (760, 60, 8, PAPER),
        (985, 240, 9, PAPER),
    ]:
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=col, outline=INK, width=3)

    # The fox, from the app's own adaptive icon foreground.
    fox = Image.open(ART / "android-icon-foreground.png").convert("RGBA")
    fox = fox.resize((430, 430), Image.LANCZOS)
    img.paste(fox, (610, 45), fox)

    d.text((56, 118), "ScreenLess", font=font("900Black", 92), fill=INK)
    d.text((60, 232), "Ekran yerine yapacak bir şey", font=font("700Bold", 38), fill=INK_SOFT)

    # One pill, stating the actual proposition rather than a feature list.
    pill = (60, 300, 470, 372)
    d.rounded_rectangle((pill[0] + 7, pill[1] + 7, pill[2] + 7, pill[3] + 7), radius=36, fill=INK)
    d.rounded_rectangle(pill, radius=36, fill=CORAL, outline=INK, width=6)
    d.text((92, 318), "Her gün yeni bir görev", font=font("800ExtraBold", 32), fill=PAPER)

    out = OUT / "feature-graphic-1024x500.png"
    img.save(out, "PNG")
    return out, img.size, img.mode


# ------------------------------------------------------------------ main

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for build in (build_icon, build_feature_graphic):
        path, size, mode = build()
        kb = path.stat().st_size / 1024
        print(f"{path.name:34} {str(size):12} {mode:5} {kb:7.1f} kB")
