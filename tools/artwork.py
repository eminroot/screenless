# -*- coding: utf-8 -*-
"""Draws the README's two pieces of artwork.

A banner and an architecture diagram. Both are drawn here rather than exported
from a design tool for one reason: the diagram has to stay true, and a picture
that lives in a designer's file drifts from the code within a month. This runs
in a second, so redrawing it after a change costs nothing.

    python tools/artwork.py

Writes into docs/.
"""
import io
import os
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs"
# The real device captures, taken on an emulator with `store/capture-screenshots.py`.
# Preferred over the browser ones in docs/shots: a status bar and a real
# viewport are most of what makes a screenshot look like a product.
SHOTS = ROOT / "screenshots"

# The browser captures, for screens the device set does not cover yet.
WEB = OUT / "shots"

# The child app's night palette, which is the one the product is known by.
INK = (13, 17, 43)
INK_SOFT = (35, 42, 78)
PAPER = (255, 244, 227)
CORAL = (255, 107, 87)
AMBER = (255, 197, 61)
MINT = (126, 217, 163)
SKY = (125, 211, 252)
MIST = (148, 163, 200)
WHITE = (255, 255, 255)

# Light palette, for the technical drawing. A diagram wants paper.
DOC_BG = (255, 255, 255)
DOC_INK = (24, 24, 27)
DOC_SOFT = (113, 113, 122)
DOC_RULE = (212, 212, 216)
DOC_GREEN = (47, 125, 91)


def font(size, bold=False):
    """A real typeface, falling back to whatever the machine has."""
    candidates = (
        ["seguisb.ttf", "segoeuib.ttf", "arialbd.ttf", "DejaVuSans-Bold.ttf"]
        if bold
        else ["segoeui.ttf", "arial.ttf", "DejaVuSans.ttf"]
    )
    for name in candidates:
        for base in (r"C:\Windows\Fonts", "/usr/share/fonts/truetype/dejavu"):
            path = os.path.join(base, name)
            if os.path.exists(path):
                return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def text_width(draw, text, f):
    return draw.textbbox((0, 0), text, font=f)[2]


def rounded(draw, box, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def pill(draw, x, y, label, f, fg, bg, pad_x=14, pad_y=7):
    w = text_width(draw, label, f)
    box = [x, y, x + w + pad_x * 2, y + f.size + pad_y * 2]
    rounded(draw, box, radius=(box[3] - box[1]) // 2, fill=bg)
    draw.text((x + pad_x, y + pad_y - 1), label, font=f, fill=fg)
    return box[2] - box[0]


def paste_phone(canvas, image_path, box, radius=26, border=6):
    """One screenshot, in a rounded frame, scaled to fit a slot."""
    if not image_path.exists():
        return
    shot = Image.open(image_path).convert("RGB")
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0

    # Cover the slot, cropping the overflow from the bottom: the top of every
    # one of these screens is the part worth showing.
    scale = max(w / shot.width, h / shot.height)
    resized = shot.resize((int(shot.width * scale), int(shot.height * scale)), Image.LANCZOS)
    resized = resized.crop((0, 0, w, h))

    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], radius=radius, fill=255)

    frame = Image.new("RGB", (w + border * 2, h + border * 2), INK_SOFT)
    ImageDraw.Draw(frame).rounded_rectangle(
        [0, 0, frame.width - 1, frame.height - 1], radius=radius + border, fill=INK_SOFT
    )
    frame.paste(resized, (border, border), mask)
    canvas.paste(frame, (x0 - border, y0 - border))


# --------------------------------------------------------------- the banner


def banner():
    W, H = 2400, 1000
    img = Image.new("RGB", (W, H), INK)
    d = ImageDraw.Draw(img)

    # A soft wash behind the left half, so the type sits on something.
    glow = Image.new("RGB", (W, H), INK)
    gd = ImageDraw.Draw(glow)
    gd.ellipse([-500, -420, 1500, 900], fill=INK_SOFT)
    img = Image.blend(img, glow, 0.55)
    d = ImageDraw.Draw(img)

    f_title = font(132, bold=True)
    f_tag = font(44)
    f_sub = font(34)
    f_chip = font(28, bold=True)

    x = 140
    d.text((x, 214), "SCREENLESS", font=f_title, fill=PAPER)
    # A rule in the accent, the width of the word above it.
    d.rounded_rectangle([x, 372, x + 300, 380], radius=4, fill=CORAL)

    d.text((x, 424), "Ekranı azaltan şey, ekranda geçen", font=f_tag, fill=WHITE)
    d.text((x, 480), "bir saat değil; onun yerine yapılan", font=f_tag, fill=WHITE)
    d.text((x, 536), "bir şeydir.", font=f_tag, fill=CORAL)

    d.text(
        (x, 628),
        "3-13 yaş · Türkçe · English · Azərbaycanca",
        font=f_sub,
        fill=MIST,
    )

    chips = [
        ("TEKNOFEST 2026", AMBER, INK),
        ("ÇOCUK UYGULAMASI", MINT, INK),
        ("EBEVEYN PANELİ", SKY, INK),
    ]
    cx = x
    for label, bg, fg in chips:
        cx += pill(d, cx, 706, label, f_chip, fg, bg) + 16

    # Three screens on the right, the middle one standing taller.
    slots = [
        (SHOTS / "child-6-9" / "1-camp.png", (1420, 250, 1690, 830)),
        (SHOTS / "parent-app" / "2-child-dashboard.png", (1720, 180, 2010, 800)),
        (SHOTS / "child-3-5" / "1-home.png", (2040, 250, 2310, 830)),
    ]
    for path, box in slots:
        paste_phone(img, path, box)

    img.save(OUT / "banner.png")
    print("wrote", OUT / "banner.png", img.size)


# ------------------------------------------------------------ the architecture


def architecture():
    """The three parts and the one road between them.

    Laid out on a grid rather than by eye: the first version put an arrow
    label straight through the box beside it, which is the failure mode of
    every diagram drawn by nudging coordinates until it looks right.
    """
    W, H = 2000, 1180
    img = Image.new("RGB", (W, H), DOC_BG)
    d = ImageDraw.Draw(img)

    f_h = font(40, bold=True)
    f_sub = font(24)
    f_box = font(28, bold=True)
    f_small = font(21)
    f_tiny = font(19)

    d.text((90, 66), "SCREENLESS", font=f_h, fill=DOC_INK)
    d.text((90, 118), "Teknik çizim · üç parça ve aralarındaki tek yol", font=f_sub, fill=DOC_SOFT)
    d.line([90, 172, W - 90, 172], fill=DOC_RULE, width=2)

    def box(x0, y0, x1, y1, title, lines, accent=None, fill=DOC_BG):
        rounded(d, [x0, y0, x1, y1], 14, fill=fill, outline=accent or DOC_INK, width=3)
        d.text((x0 + 26, y0 + 22), title, font=f_box, fill=accent or DOC_INK)
        for i, line in enumerate(lines):
            d.text((x0 + 26, y0 + 68 + i * 30), line, font=f_small, fill=DOC_SOFT)

    def head(x, y, way):
        """A solid arrow head. `way` is 'down' or 'up'."""
        dy = -18 if way == "down" else 18
        d.polygon([(x, y), (x - 9, y + dy), (x + 9, y + dy)], fill=DOC_INK)

    # Two phones across the top, the hub centred underneath.
    LEFT, RIGHT = 90, W - 90
    box(LEFT, 220, LEFT + 560, 450, "ÇOCUK · ScreenLess", [
        "Expo SDK 54 · React Native",
        "Görevler, arkadaş, ekran sayacı",
        "Veri cihazda kalır",
    ], CORAL)

    box(RIGHT - 560, 220, RIGHT, 450, "EBEVEYN · ScreenLess Parent", [
        "Ayrı uygulama, ayrı telefon",
        "Grafikler, limit, mesaj, görev",
        "E-posta ile giriş",
    ], (75, 74, 122))

    box(700, 760, 1300, 980, "HUB · eminbaxishli.online", [
        "Node · bağımlılık yok · SQLite",
        "systemd + Caddy · HTTPS",
        "Sadece sayılar ve kimlikler",
    ], DOC_GREEN)

    # The two roads. Each is a vertical drop into a horizontal run, so a
    # label can sit on the vertical part without crossing anything.
    d.line([LEFT + 280, 450, LEFT + 280, 640], fill=DOC_INK, width=3)
    d.line([LEFT + 280, 640, 820, 640], fill=DOC_INK, width=3)
    d.line([820, 640, 820, 760], fill=DOC_INK, width=3)
    head(820, 760, "down")
    d.text((LEFT + 300, 500), "yukarı: dakika, görev,", font=f_tiny, fill=DOC_SOFT)
    d.text((LEFT + 300, 526), "yıldız, adım", font=f_tiny, fill=DOC_SOFT)

    d.line([RIGHT - 280, 450, RIGHT - 280, 690], fill=DOC_INK, width=3)
    d.line([RIGHT - 280, 690, 1180, 690], fill=DOC_INK, width=3)
    d.line([1180, 690, 1180, 760], fill=DOC_INK, width=3)
    head(1180, 760, "down")
    d.text((RIGHT - 500, 500), "aşağı: limit, mesaj,", font=f_tiny, fill=DOC_SOFT)
    d.text((RIGHT - 500, 526), "görev anahtarı", font=f_tiny, fill=DOC_SOFT)

    # The case most families are actually in, given its own panel so it does
    # not read as a footnote to the networked one.
    rounded(d, [LEFT, 760, LEFT + 560, 980], 14, fill=(250, 250, 249), outline=DOC_RULE, width=2)
    d.text((LEFT + 26, 786), "TEK TELEFON", font=f_box, fill=DOC_INK)
    for i, line in enumerate([
        "Aile tek cihaz paylaşıyorsa ebeveyn",
        "uygulaması hiç gerekmez. Veli, kodla",
        "açtığı veli bölümünden aynı görevi ve",
        "notu bırakır; sunucu devrede değildir.",
    ]):
        d.text((LEFT + 26, 838 + i * 30), line, font=f_tiny, fill=DOC_SOFT)

    # The claim the whole thing rests on, full width, last thing read.
    rounded(d, [LEFT, 1030, RIGHT, 1120], 12, fill=(240, 253, 244), outline=DOC_GREEN, width=2)
    d.text((LEFT + 26, 1048), "İsim, görev metni, fotoğraf, mesaj ve çocuğun yazdığı hiçbir şey sunucuya gitmez.",
           font=f_small, fill=DOC_GREEN)
    d.text((LEFT + 26, 1080), "Sunucuda bunları alacak bir alan yok. scripts/test-sync.ts bunu iddia olarak değil, kanıt olarak tutuyor.",
           font=f_tiny, fill=DOC_SOFT)

    img.save(OUT / "architecture.png")
    print("wrote", OUT / "architecture.png", img.size)


# ------------------------------------------------------- a strip of screens


def strip(name, shots, height=900):
    """Several screenshots in a row, framed, on the night ground."""
    gap = 28
    widths = []
    images = []
    for path in shots:
        if not path.exists():
            continue
        shot = Image.open(path).convert("RGB")
        scale = height / shot.height
        images.append(shot.resize((int(shot.width * scale), height), Image.LANCZOS))
        widths.append(int(shot.width * scale))

    if not images:
        return

    border = 5
    W = sum(widths) + gap * (len(images) - 1) + 80 + border * 2 * len(images)
    H = height + 80 + border * 2
    canvas = Image.new("RGB", (W, H), INK)

    x = 40
    for shot in images:
        mask = Image.new("L", shot.size, 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, shot.width - 1, shot.height - 1], radius=22, fill=255)
        frame = Image.new("RGB", (shot.width + border * 2, shot.height + border * 2), INK_SOFT)
        ImageDraw.Draw(frame).rounded_rectangle(
            [0, 0, frame.width - 1, frame.height - 1], radius=27, fill=INK_SOFT
        )
        frame.paste(shot, (border, border), mask)
        canvas.paste(frame, (x, 40 - border))
        x += shot.width + gap + border * 2

    canvas.save(OUT / f"{name}.png")
    print("wrote", OUT / f"{name}.png", canvas.size)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    banner()
    architecture()
    # One strip per age band, because the three tiers looking like different
    # apps is the point and a mixed strip hides it.
    strip("strip-little", [SHOTS / "child-3-5" / f for f in
                           ["1-home.png", "2-for-you.png", "3-journey.png", "6-buddy.png"]])
    strip("strip-junior", [SHOTS / "child-6-9" / f for f in
                           ["1-camp.png", "2-yours.png", "3-trail.png", "4-kit.png"]])
    strip("strip-teen", [SHOTS / "child-10-13" / f for f in
                         ["1-today.png", "2-for-you.png", "3-progress.png", "5-steps.png"]])
    strip("strip-parent", [SHOTS / "parent-app" / f for f in
                           ["1-children.png", "2-child-dashboard.png",
                            "3-child-dashboard-lower.png", "6-limits.png"]])

    # The one strip that cannot come from the device captures: those were taken
    # before a parent could send anything, and this is the feature the round of
    # work was about. Browser captures, in Turkish, from `tools/shots.mjs`.
    strip("strip-messages", [
        WEB / "child-home.png",
        WEB / "child-parent.png",
        WEB / "parent-send.png",
    ])


if __name__ == "__main__":
    main()
