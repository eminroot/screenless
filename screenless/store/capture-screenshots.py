#!/usr/bin/env python3
"""
Captures Play Store screenshots from the real app on an emulator.

Real screens, not mockups: Play requires screenshots of the actual app, and a
mockup that drifts from the product is both a policy risk and misleading.

The app has no debug backdoor and a release APK cannot be reached with
`adb run-as`, so this drives the UI the way a person would, tapping through
onboarding by looking up elements in the accessibility tree by their text.

    python store/capture-screenshots.py

Writes raw device captures into store/assets/raw/. Run finish-screenshots.py
afterwards to convert them to the formats Play accepts.
"""

import os
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path

ADB = str(Path(os.environ["ANDROID_HOME"]) / "platform-tools" / "adb.exe")
PKG = "com.eminbakhishli.screenless"
OUT = Path(__file__).resolve().parent / "assets" / "raw"

# Git Bash rewrites /sdcard into a Windows path unless this is set.
ENV = {**os.environ, "MSYS_NO_PATHCONV": "1"}


def adb(*args, check=True):
    r = subprocess.run([ADB, *args], capture_output=True, text=True, env=ENV)
    if check and r.returncode != 0:
        raise RuntimeError(f"adb {' '.join(args)}\n{r.stderr or r.stdout}")
    return r.stdout


def shell(cmd: str) -> str:
    return adb("shell", cmd)


def dump():
    """
    Current screen as an accessibility tree, or None.

    Usually None in this app. `uiautomator dump` waits for the UI to go idle and
    the buddy animates without stopping, so it times out on most screens. It also
    leaves the *previous* dump on disk when it fails, which reads as "the tap did
    nothing" when the tap actually worked. Hence: delete first, tolerate failure,
    and drive the flow by coordinate instead.
    """
    for _ in range(2):
        shell("rm -f /sdcard/ui.xml")
        subprocess.run([ADB, "shell", "uiautomator dump /sdcard/ui.xml"],
                       capture_output=True, text=True, env=ENV, timeout=40)
        xml = adb("shell", "cat /sdcard/ui.xml", check=False)
        start = xml.find("<hierarchy")
        if start != -1:
            try:
                return ET.fromstring(xml[start:])
            except ET.ParseError:
                pass
    return None


def tap(x: int, y: int, label: str = "", settle: float = 1.6):
    """A held press. RN's Pressability can miss an instantaneous synthetic tap."""
    adb("shell", "input", "swipe", str(x), str(y), str(x), str(y), "90")
    time.sleep(settle)
    if label:
        print(f"    tapped {label} at ({x},{y})")


def clean_status_bar():
    """
    Demo mode: a fixed clock, full battery, no notification clutter.

    Store screenshots showing a low battery and a stack of debug icons look
    unfinished, and the emulator's "3G" indicator is simply a lie about the app.
    """
    shell("settings put global sysui_demo_allowed 1")
    for cmd in (
        "am broadcast -a com.android.systemui.demo -e command enter",
        "am broadcast -a com.android.systemui.demo -e command clock -e hhmm 0930",
        "am broadcast -a com.android.systemui.demo -e command battery -e level 100 -e plugged false",
        "am broadcast -a com.android.systemui.demo -e command network -e wifi show -e level 4",
        "am broadcast -a com.android.systemui.demo -e command network -e mobile hide",
        "am broadcast -a com.android.systemui.demo -e command notifications -e visible false",
    ):
        shell(cmd)
    time.sleep(1)


def centre(node) -> tuple[int, int]:
    x0, y0, x1, y1 = map(int, re.findall(r"-?\d+", node.get("bounds")))
    return (x0 + x1) // 2, (y0 + y1) // 2


def find(substr: str, exact=False):
    """First node whose text or content-desc contains `substr`, when a dump works."""
    tree = dump()
    if tree is None:
        return None
    needle = substr.casefold()
    for node in tree.iter("node"):
        for attr in ("text", "content-desc"):
            value = (node.get(attr) or "").strip()
            if not value:
                continue
            hit = value.casefold() == needle if exact else needle in value.casefold()
            if hit:
                return node
    return None


def tap_text(substr: str, exact=False, timeout=25, label=None) -> bool:
    """Waits for an element then taps it. Returns False rather than raising."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        node = find(substr, exact)
        if node is not None:
            x, y = centre(node)
            adb("shell", "input", "tap", str(x), str(y))
            time.sleep(1.3)
            print(f"    tapped {label or substr!r}")
            return True
        time.sleep(1.2)
    print(f"    !! not found: {substr!r}")
    return False


def scroll_to_bottom(times: int = 6):
    """Onboarding puts its primary button under the content, so get there first."""
    for _ in range(times):
        adb("shell", "input", "swipe", "540", "1800", "540", "700", "260")
        time.sleep(0.5)
    time.sleep(1.2)


def scroll_to_top(times: int = 8):
    for _ in range(times):
        adb("shell", "input", "swipe", "540", "700", "540", "1800", "260")
        time.sleep(0.4)
    time.sleep(1.2)


def type_text(value: str):
    adb("shell", "input", "text", value.replace(" ", "%s"))
    time.sleep(0.8)


def shot(name: str):
    OUT.mkdir(parents=True, exist_ok=True)
    time.sleep(1.6)
    shell("screencap /sdcard/shot.png")
    adb("pull", "/sdcard/shot.png", str(OUT / f"{name}.png"))
    print(f"  captured {name}.png")


def restart_clean():
    """Fresh install state, so onboarding runs from the top."""
    shell(f"pm clear {PKG}")
    time.sleep(2)
    shell(f"monkey -p {PKG} -c android.intent.category.LAUNCHER 1")
    time.sleep(9)


def onboard():
    """Walks setup the way a parent would, in Turkish."""
    print("onboarding")
    tap_text("Türkçe")
    tap_text("Devam", label="language -> welcome")
    shot("01-welcome")

    tap_text("Kurulumu yapalım", label="welcome -> consent")

    # Consent: tick every checkbox on the screen, then continue.
    for node in dump().iter("node"):
        if node.get("class") == "android.widget.CheckBox" or "onay" in (node.get("text") or "").lower():
            x, y = centre(node)
            adb("shell", "input", "tap", str(x), str(y))
            time.sleep(0.6)
    tap_text("Kabul", label="consent") or tap_text("Devam", label="consent")

    # Child: nickname and age band.
    for node in dump().iter("node"):
        if node.get("class") == "android.widget.EditText":
            x, y = centre(node)
            adb("shell", "input", "tap", str(x), str(y))
            time.sleep(0.8)
            type_text("Ada")
            shell("input keyevent 111")  # escape, closes the keyboard
            break
    tap_text("6 ile 8", label="age band")
    tap_text("Devam", label="child -> username")

    # Username: the screenshots are taken offline, so no request reaches the board.
    tap_text("Hayır, bu telefonda kalsın", label="keep it on this phone")
    tap_text("Devam", label="username -> interests")

    for interest in ("Futbol", "Çizim", "Hayvanlar"):
        tap_text(interest, label=interest)
    shot("02-interests")
    tap_text("Devam", label="interests -> buddy")

    tap_text("Devam", label="buddy -> pin")
    shot("03-buddy")

    # Parent code, entered twice.
    for _ in range(2):
        for digit in "1234":
            tap_text(digit, exact=True, label=f"pin {digit}")
        time.sleep(1.5)

    tap_text("Başla", label="ready -> app") or tap_text("Hadi", label="ready -> app")
    time.sleep(3)


if __name__ == "__main__":
    print("device:", adb("devices").strip().splitlines()[-1])
    clean_status_bar()
    if "--fresh" in sys.argv:
        restart_clean()
        onboard()
    shot("current")
