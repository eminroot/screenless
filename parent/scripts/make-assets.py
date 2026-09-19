# -*- coding: utf-8 -*-
"""Draws the parent app's icons.

Deliberately not the child app's icon. ScreenLess is a mascot on a yellow
square; this is a bar chart falling away on warm paper, because the two sit
next to each other on a home screen and a parent reaching for the dashboard in
a hurry should never open the child's app by mistake.

The mark is four bars, each shorter than the last. It is the one thing the
whole product is trying to make happen, and it reads at 48 pixels.

    python scripts/make-assets.py
"""
from PIL import Image, ImageDraw

PAPER = (246, 244, 240)
INK = (22, 20, 15)
CORAL = (232, 84, 63)
SLATE = (75, 74, 122)

OUT = 'assets/images'


def draw_mark(size, background, scale=1.0, bars=(CORAL, SLATE, SLATE, SLATE)):
    """The falling bars, centred, on whatever ground is asked for."""
    # Drawn at four times the final size and resampled down: the bar edges are
    # the whole mark, and aliasing on them is the difference between a logo and
    # a smudge at launcher size.
    big = size * 4
    image = Image.new('RGBA', (big, big), background)
    draw = ImageDraw.Draw(image)

    span = big * 0.52 * scale
    left = (big - span) / 2
    baseline = (big + span * 0.92) / 2

    count = len(bars)
    gap = span * 0.085
    width = (span - gap * (count - 1)) / count

    for index, colour in enumerate(bars):
        # Tallest first, falling away to a third of the height.
        fraction = 1.0 - (index / (count - 1)) * 0.66
        height = span * 0.92 * fraction
        x0 = left + index * (width + gap)
        y0 = baseline - height
        draw.rounded_rectangle(
            [x0, y0, x0 + width, baseline],
            radius=width * 0.3,
            fill=colour,
        )

    return image.resize((size, size), Image.LANCZOS)


def save(image, name):
    path = '%s/%s' % (OUT, name)
    image.save(path)
    print('wrote', path, image.size)


def main():
    # The launcher icon. Paper ground so it sits apart from the child app's
    # yellow square at a glance.
    save(draw_mark(1024, PAPER), 'icon.png')

    # Android adaptive: the foreground is masked to a circle on most launchers,
    # so the mark is drawn smaller to survive the crop.
    save(draw_mark(1024, (0, 0, 0, 0), scale=0.66), 'android-icon-foreground.png')
    save(Image.new('RGBA', (1024, 1024), PAPER), 'android-icon-background.png')

    # Monochrome, for themed icons on Android 13 and up. One colour, and the
    # system recolours it.
    save(
        draw_mark(1024, (0, 0, 0, 0), scale=0.66, bars=(INK, INK, INK, INK)),
        'android-icon-monochrome.png',
    )

    # The splash mark, which sits on the paper the app itself uses.
    save(draw_mark(512, (0, 0, 0, 0), scale=0.9), 'splash-icon.png')

    save(draw_mark(48, PAPER), 'favicon.png')


if __name__ == '__main__':
    main()
