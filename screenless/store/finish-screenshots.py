#!/usr/bin/env python3
"""
Converts raw device captures into the exact formats Play accepts.

Two rules catch people out and both are silent rejections:
  - screenshots must be JPEG or 24-bit PNG with **no alpha channel**, and
    `adb screencap` always produces RGBA
  - every side must be between 320 and 3840 px

    python store/finish-screenshots.py

Reads store/assets/raw/, writes store/assets/play/.
"""

from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
RAW = HERE / "assets" / "raw"
PLAY = HERE / "assets" / "play"

MIN_SIDE, MAX_SIDE = 320, 3840

# Upload order matters: the first two are what most people ever see.
PHONE = [
    ("04-today-mission", "A real mission, matched to the child's interests"),
    ("09-goal", "The child sees the promise a parent made"),
    ("08-rewards", "Where the parent sets that promise"),
    ("05-mission", "The mission runner"),
    ("06-journey", "Progress and the map"),
    ("03-buddy", "Twelve buddies to choose from"),
    ("07-parent", "The parent area"),
    ("01-welcome", "What the app is for"),
]

TABLETS = {
    "tablet10": ["tab10-01-today", "tab10-02-journey", "tab10-03-buddy"],
    "tablet7": ["tab7-01-today", "tab7-02-journey", "tab7-03-buddy"],
}


def convert(src: Path, dest: Path) -> tuple:
    im = Image.open(src)
    # Flatten onto white rather than just dropping alpha, so any translucent
    # pixel keeps the colour it was actually shown as.
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        flat = Image.new("RGB", im.size, (255, 255, 255))
        flat.paste(im, mask=im.split()[-1])
        im = flat
    else:
        im = im.convert("RGB")

    w, h = im.size
    problems = []
    if min(w, h) < MIN_SIDE:
        problems.append(f"short side {min(w, h)} < {MIN_SIDE}")
    if max(w, h) > MAX_SIDE:
        problems.append(f"long side {max(w, h)} > {MAX_SIDE}")

    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "PNG", optimize=True)
    return im.size, im.mode, dest.stat().st_size / 1024, problems


if __name__ == "__main__":
    print(f"{'file':38} {'size':12} {'mode':5} {'kB':>8}  notes")
    print("-" * 78)

    for index, (name, caption) in enumerate(PHONE, start=1):
        src = RAW / f"{name}.png"
        if not src.exists():
            print(f"  MISSING {name}.png")
            continue
        dest = PLAY / "phone" / f"{index:02d}-{name.split('-', 1)[1]}.png"
        size, mode, kb, problems = convert(src, dest)
        note = "; ".join(problems) if problems else caption
        print(f"phone/{dest.name:31} {str(size):12} {mode:5} {kb:8.1f}  {note}")

    for folder, names in TABLETS.items():
        for index, name in enumerate(names, start=1):
            src = RAW / f"{name}.png"
            if not src.exists():
                print(f"  MISSING {name}.png")
                continue
            dest = PLAY / folder / f"{index:02d}-{name.split('-', 2)[2]}.png"
            size, mode, kb, problems = convert(src, dest)
            note = "; ".join(problems) if problems else "ok"
            print(f"{folder}/{dest.name:{37-len(folder)}} {str(size):12} {mode:5} {kb:8.1f}  {note}")

    print()
    print("Every file above is 24-bit RGB with no alpha, which is what Play requires.")
