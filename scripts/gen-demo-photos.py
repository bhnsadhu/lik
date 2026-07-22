#!/usr/bin/env python3
"""Artwork for the App Review demo profiles.

The demo accounts exist so a reviewer can complete match and chat alone.
They previously carried flat two-stop gradients, which on a swipe card are
indistinguishable from an image that failed to load - exactly the kind of
thing a Guideline 5.6 review reads as unfinished. These are deliberate
illustrated portraits in the app's own palette: clearly stylised, clearly
on purpose, never mistakable for a broken asset.

    python3 scripts/gen-demo-photos.py [outdir]

Writes six frames plus a square avatar per demo profile as WebP into
public/demo/ by default, so the artwork ships with the app itself. It
deliberately does NOT live in Supabase storage: those files are owned by the
demo auth users, and deleting those accounts orphans every URL the profiles
point at - which is exactly how the demo feed broke once already.

Frames are 720x960 (the 3:4 the swipe card crops to) and avatars 320x320.
The card darkens its lower half behind the name block, so every composition
keeps its subject in the upper two thirds.
"""
import math
import os
import random
import sys
from PIL import Image, ImageDraw, ImageFilter

W, H = 900, 1200

INK = (16, 13, 28)
INK_2 = (24, 20, 42)
PAPER = (250, 246, 234)

# One accent per profile. The first four are the night-city palette proper;
# the rest stay in the same family (saturated, mid-to-high value, readable on
# ink) so a scrolled feed looks varied without leaving the brand.
PEOPLE = {
    "jordan": (78, 217, 232),   # sky
    "sam": (242, 233, 0),       # volt
    "riley": (255, 61, 166),    # neon
    "casey": (255, 90, 72),     # coral
    "priya": (255, 176, 32),    # amber
    "maya": (168, 225, 12),     # lime
    "andre": (47, 212, 168),    # teal
    "tomas": (165, 123, 255),   # violet
    "ava": (255, 111, 145),     # rose
    "nadia": (127, 200, 255),   # ice
    "devin": (232, 197, 71),    # gold
    "marcus": (255, 122, 61),   # flame
}


def mix(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def vgrad(top, bottom, bias=1.0):
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    for y in range(H):
        d.line([(0, y), (W, y)], fill=mix(top, bottom, (y / H) ** bias))
    return img


def backdrop(accent):
    return vgrad(mix(INK_2, accent, 0.16), INK, 0.8)


def soft_light(img, accent, cx, cy, radius, strength):
    """A believable lamp rather than a flat wash."""
    layer = Image.new("L", (W, H), 0)
    ImageDraw.Draw(layer).ellipse(
        [cx - radius, cy - radius, cx + radius, cy + radius], fill=255
    )
    layer = layer.filter(ImageFilter.GaussianBlur(radius * 0.62))
    tint = Image.new("RGB", (W, H), mix(INK, accent, strength))
    return Image.composite(
        Image.blend(img, tint, 0.75), img, layer.point(lambda v: int(v * 0.85))
    )


def rings(img, accent, cx, cy, count=4, base=210, step=112, width=13, start=0.14):
    d = ImageDraw.Draw(img)
    for i in range(count):
        r = base + i * step
        d.ellipse(
            [cx - r, cy - r, cx + r, cy + r],
            outline=mix(INK, accent, max(0.05, start - i * 0.028)),
            width=width,
        )
    return img


def grain(img, amount=13):
    """Fine noise so large flat areas never read as a rendering failure."""
    rnd = random.Random(11)
    n = Image.new("L", (W // 2, H // 2))
    n.putdata([rnd.randint(0, 255) for _ in range(n.width * n.height)])
    n = n.resize((W, H), Image.BILINEAR)
    lift = Image.blend(img, Image.new("RGB", (W, H), PAPER), amount / 255)
    return Image.composite(lift, img, n.point(lambda v: 255 if v > 198 else 0))


def vignette(img):
    mask = Image.new("L", (W, H), 0)
    ImageDraw.Draw(mask).ellipse([-W * 0.32, -H * 0.2, W * 1.32, H * 1.2], fill=255)
    return Image.composite(img, Image.new("RGB", (W, H), INK), mask.filter(ImageFilter.GaussianBlur(200)))


def orbit(accent):
    """Concentric rings around a lit core."""
    img = rings(backdrop(accent), accent, W // 2, int(H * 0.36), count=5, base=140, step=118, width=14, start=0.30)
    img = soft_light(img, accent, W // 2, int(H * 0.36), 300, 0.34)
    d = ImageDraw.Draw(img)
    r = 74
    d.ellipse([W // 2 - r, int(H * 0.36) - r, W // 2 + r, int(H * 0.36) + r], fill=mix(INK, accent, 0.85))
    return img


def bands(accent):
    """Raking diagonal light across a disc."""
    img = backdrop(accent)
    d = ImageDraw.Draw(img)
    r = int(W * 0.42)
    d.ellipse([W * 0.5 - r, H * 0.34 - r, W * 0.5 + r, H * 0.34 + r], fill=mix(INK, accent, 0.34))
    for i in range(10):
        x = -240 + i * 148
        w = 38 + (i % 3) * 30
        d.polygon(
            [(x, H), (x + 360, 0), (x + 360 + w, 0), (x + w, H)],
            fill=mix(INK, accent, 0.07 + (i % 4) * 0.035),
        )
    img = img.filter(ImageFilter.GaussianBlur(0.9))
    return soft_light(img, accent, int(W * 0.34), int(H * 0.3), 320, 0.26)


def aurora(accent):
    """Soft drifting colour with one crisp arc over it."""
    img = backdrop(accent)
    blobs = Image.new("RGB", (W, H), INK)
    bd = ImageDraw.Draw(blobs)
    spots = [(0.28, 0.22, 300), (0.74, 0.34, 340), (0.44, 0.52, 260)]
    for i, (fx, fy, r) in enumerate(spots):
        cx, cy = int(W * fx), int(H * fy)
        bd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=mix(INK, accent, 0.5 - i * 0.12))
    blobs = blobs.filter(ImageFilter.GaussianBlur(150))
    img = Image.blend(img, blobs, 0.62)
    d = ImageDraw.Draw(img)
    d.arc([W * 0.1, H * 0.08, W * 0.9, H * 0.62], start=195, end=345, fill=mix(INK, accent, 0.8), width=15)
    return soft_light(img, accent, int(W * 0.5), int(H * 0.3), 300, 0.2)


def matrix(accent):
    """A field of dots falling away into the dark."""
    img = backdrop(accent)
    d = ImageDraw.Draw(img)
    cols, rows = 7, 10
    for r in range(rows):
        for c in range(cols):
            x = 90 + c * 120
            y = 110 + r * 112
            rad = max(4, int(30 - r * 2.1))
            d.ellipse(
                [x - rad, y - rad, x + rad, y + rad],
                fill=mix(INK, accent, max(0.05, 0.5 - r * 0.045)),
            )
    return soft_light(img, accent, int(W * 0.5), int(H * 0.22), 330, 0.22)


def horizon(accent):
    """Stacked bands, widest at the top, like a long exposure."""
    img = backdrop(accent)
    d = ImageDraw.Draw(img)
    y = 90
    for i in range(11):
        h = max(6, 62 - i * 5)
        d.rounded_rectangle(
            [70, y, W - 70, y + h], radius=h // 2, fill=mix(INK, accent, max(0.05, 0.46 - i * 0.04))
        )
        y += h + 26
    return soft_light(img, accent, int(W * 0.5), int(H * 0.24), 340, 0.2)


def bloom(accent):
    """Radial burst from a bright core."""
    img = backdrop(accent)
    d = ImageDraw.Draw(img)
    cx, cy = W // 2, int(H * 0.34)
    for i in range(22):
        a = (i / 22) * math.tau
        inner, outer = 110, 430 + (i % 3) * 70
        d.line(
            [cx + math.cos(a) * inner, cy + math.sin(a) * inner,
             cx + math.cos(a) * outer, cy + math.sin(a) * outer],
            fill=mix(INK, accent, 0.1 + (i % 4) * 0.05),
            width=17,
        )
    img = img.filter(ImageFilter.GaussianBlur(1.6))
    img = soft_light(img, accent, cx, cy, 300, 0.32)
    d = ImageDraw.Draw(img)
    d.ellipse([cx - 62, cy - 62, cx + 62, cy + 62], fill=mix(INK, accent, 0.88))
    return img


# six frames per profile: the app requires six photos of every real user, so
# the review fixtures hold themselves to the same rule
VARIANTS = (orbit, bands, aurora, matrix, horizon, bloom)


CARD = (720, 960)
AVATAR = (320, 320)


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "..", "public", "demo"
    )
    os.makedirs(out, exist_ok=True)
    for name, accent in PEOPLE.items():
        for i, make in enumerate(VARIANTS, start=1):
            img = vignette(grain(make(accent)))
            path = os.path.join(out, f"{name}-{i}.webp")
            img.resize(CARD, Image.LANCZOS).save(path, "WEBP", quality=82, method=6)
            print("wrote", path)
            # square identity crop around the first frame's focal point, for
            # the avatar shown in liks, chat headers and the match takeover
            if i == 1:
                box = 640
                cx, cy = W // 2, int(H * 0.36)
                img.crop((cx - box // 2, cy - box // 2, cx + box // 2, cy + box // 2)) \
                   .resize(AVATAR, Image.LANCZOS) \
                   .save(os.path.join(out, f"{name}-avatar.webp"), "WEBP", quality=88, method=6)


if __name__ == "__main__":
    main()
