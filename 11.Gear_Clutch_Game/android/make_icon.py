"""Draws the launcher icon (gear knob on an H-pattern) into res/mipmap-*/."""
import os
from PIL import Image, ImageDraw

SIZES = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
here = os.path.dirname(os.path.abspath(__file__))

def draw(n):
    s = 4 * n  # draw large, then downscale for smooth edges
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, s - 1, s - 1], radius=s * 0.22, fill=(23, 24, 27, 255))
    d.rounded_rectangle([s * .06, s * .06, s * .94, s * .94], radius=s * .17,
                        outline=(255, 122, 26, 255), width=max(2, s // 48))
    slot = (6, 6, 7, 255)
    w = s * 0.07
    for x in (0.3, 0.5, 0.7):
        d.rounded_rectangle([s * x - w / 2, s * .2, s * x + w / 2, s * .8], radius=w / 2, fill=slot)
    d.rounded_rectangle([s * .3, s * .5 - w / 2, s * .7, s * .5 + w / 2], radius=w / 2, fill=slot)
    # knob in 1st gear
    cx, cy, r = s * .3, s * .26, s * .15
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 122, 26, 255), outline=(255, 190, 140, 255),
              width=max(2, s // 60))
    d.ellipse([cx - r * .45, cy - r * .55, cx - r * .05, cy - r * .2], fill=(255, 200, 160, 160))
    return im.resize((n, n), Image.LANCZOS)

for name, n in SIZES.items():
    folder = os.path.join(here, "res", f"mipmap-{name}")
    os.makedirs(folder, exist_ok=True)
    draw(n).save(os.path.join(folder, "ic_launcher.png"))
print("icons ok")
