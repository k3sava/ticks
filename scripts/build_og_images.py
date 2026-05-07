#!/usr/bin/env python3
"""
Generate Open Graph images for Ticks. Pixel-perfect, year-loud, paper-toned.

  python3 scripts/build_og_images.py            # homepage og.png only
  python3 scripts/build_og_images.py --top 50   # homepage + 50 most-connected
  python3 scripts/build_og_images.py --all      # homepage + every tick (≈200MB)

Output:
  /og.png                       (homepage)
  /og/{tick-id}.png             (per-tick, when --top or --all)

Uses Liberation Serif and Liberation Mono (preinstalled on Debian/Ubuntu) as
stand-ins for Newsreader and JetBrains Mono. The composition is identical
to what the live site uses: italic year-loud heading, name in roman serif,
constraint in italic small caps, bottom eyebrow with the domain ribbon.
"""

from __future__ import annotations

import argparse
import json
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data.json"

W, H = 1200, 630
PAPER = (250, 250, 249)
INK = (28, 25, 23)
INK_2 = (68, 64, 60)
MUTED = (120, 113, 108)
LINE = (231, 229, 228)
ACCENT = (194, 65, 12)

# Best available locally; visually close to Newsreader / JetBrains Mono.
SERIF_REG = "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf"
SERIF_BLD = "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf"
SERIF_ITA = "/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf"
MONO_REG = "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf"


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size=size)


def measure(d: ImageDraw.ImageDraw, text: str, f: ImageFont.FreeTypeFont) -> tuple[int, int]:
    # textbbox returns (l, t, r, b); we want width and height.
    l, t, r, b = d.textbbox((0, 0), text, font=f)
    return r - l, b - t


def wrap_to_width(d: ImageDraw.ImageDraw, text: str, f: ImageFont.FreeTypeFont, max_w: int) -> list[str]:
    """Word-wrap by progressively adding words until measurement exceeds max_w."""
    words = text.split()
    lines: list[str] = []
    cur = ""
    for w in words:
        trial = (cur + " " + w).strip()
        if measure(d, trial, f)[0] <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def base_canvas() -> Image.Image:
    img = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(img)

    # Subtle vertical paper grain (very faint horizontal lines)
    for y in range(0, H, 4):
        d.line([(0, y), (W, y)], fill=(248, 248, 246), width=1)

    # Brand mark (top-left): accent dot + "ticks" italic
    cx, cy = 64, 60
    d.ellipse([cx - 6, cy - 6, cx + 6, cy + 6], fill=ACCENT)
    f_brand = font(SERIF_ITA, 28)
    d.text((cx + 16, cy - 17), "ticks", font=f_brand, fill=INK)

    # Bottom hairline rule + eyebrow
    d.line([(64, H - 80), (W - 64, H - 80)], fill=LINE, width=1)
    f_eyebrow = font(MONO_REG, 18)
    d.text((64, H - 56), "k3sava.github.io/ticks", font=f_eyebrow, fill=MUTED)
    return img


def render_homepage(count: int, out: Path) -> None:
    img = base_canvas()
    d = ImageDraw.Draw(img)

    # Year-loud: the corpus count, italic serif, very large.
    big = f"{count:,}"
    f_big = font(SERIF_ITA, 280)
    bw, bh = measure(d, big, f_big)
    d.text(((W - bw) // 2, 150), big, font=f_big, fill=INK)

    # Tagline
    f_h = font(SERIF_REG, 56)
    tagline = "moments that unlocked"
    tw, th = measure(d, tagline, f_h)
    d.text(((W - tw) // 2, 460), tagline, font=f_h, fill=INK_2)
    f_h2 = font(SERIF_ITA, 56)
    tag2 = "everything next"
    tw2, _ = measure(d, tag2, f_h2)
    d.text(((W - tw2) // 2, 524), tag2, font=f_h2, fill=ACCENT)

    img.save(out, "PNG", optimize=True)
    print(f"+ wrote {out.relative_to(ROOT)}")


def render_tick(t: dict, out: Path) -> None:
    img = base_canvas()
    d = ImageDraw.Draw(img)

    pad_x = 80
    year_top = 110

    # Year-loud (italic). Use font metrics, not the text bbox, so the
    # row height accounts for descenders even when the year string has none.
    year_size = 180
    f_year = font(SERIF_ITA, year_size)
    asc, desc = f_year.getmetrics()
    year_cell = asc + desc  # full em-box height
    d.text((pad_x, year_top), t["year"], font=f_year, fill=INK)
    year_bottom = year_top + year_cell

    # Domain pill, well below the year baseline.
    f_dom = font(MONO_REG, 18)
    dom_text = t["domain"].lower()
    dw, dh = measure(d, dom_text, f_dom)
    pill_pad_x = 14
    pill_pad_y = 8
    pill_x = pad_x
    pill_y = year_bottom + 16
    d.rounded_rectangle(
        [pill_x, pill_y, pill_x + dw + pill_pad_x * 2, pill_y + dh + pill_pad_y * 2],
        radius=999, fill=(252, 233, 224),
    )
    d.text((pill_x + pill_pad_x, pill_y + pill_pad_y - 2), dom_text, font=f_dom, fill=ACCENT)

    # Name: roman serif, wraps to two lines max.
    name_x = pad_x
    name_y = pill_y + dh + pill_pad_y * 2 + 28
    f_name = font(SERIF_REG, 50)
    lines = wrap_to_width(d, t["name"], f_name, W - 2 * pad_x)[:2]
    line_h = f_name.getmetrics()[0] + f_name.getmetrics()[1] - 8
    for i, line in enumerate(lines):
        d.text((name_x, name_y + i * line_h), line, font=f_name, fill=INK)

    # "before this, X" italic line below the name.
    constraint = t["constraint"].rstrip(".").lower()
    f_cnt = font(SERIF_ITA, 26)
    cb_y = name_y + len(lines) * line_h + 16
    label = f"before this, {constraint}."
    cb_lines = wrap_to_width(d, label, f_cnt, W - 2 * pad_x)[:2]
    cb_h = f_cnt.getmetrics()[0] + f_cnt.getmetrics()[1] - 6
    for i, line in enumerate(cb_lines):
        d.text((name_x, cb_y + i * cb_h), line, font=f_cnt, fill=INK_2)

    img.save(out, "PNG", optimize=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--top", type=int, default=0, help="generate per-tick OGs for the top N most-connected ticks")
    ap.add_argument("--all", action="store_true", help="generate per-tick OGs for every tick (≈200MB)")
    args = ap.parse_args()

    d = json.loads(DATA.read_text())
    render_homepage(len(d["ticks"]), ROOT / "og.png")

    if not (args.top or args.all):
        return

    og_dir = ROOT / "og"
    og_dir.mkdir(exist_ok=True)

    if args.all:
        ticks = d["ticks"]
    else:
        # Source of truth for "what's featured" is featured.json. Build it
        # first if missing so heroes are always covered.
        featured_path = ROOT / "featured.json"
        if not featured_path.exists():
            print("featured.json missing; run scripts/build_featured.py first.")
            return
        feat = json.loads(featured_path.read_text())
        by_id = {t["id"]: t for t in d["ticks"]}
        ticks = [by_id[item["id"]] for item in feat["items"][: args.top] if item["id"] in by_id]

    rendered = []
    for i, t in enumerate(ticks, 1):
        out = og_dir / f"{t['id']}.png"
        render_tick(t, out)
        rendered.append(t["id"])
        if i % 20 == 0 or i == len(ticks):
            print(f"  {i}/{len(ticks)} done")

    # Manifest of which ids have a per-tick OG. App.js reads this so it
    # only points <meta property="og:image"> at files that exist; everything
    # else falls back to the homepage og.png.
    manifest = ROOT / "og-manifest.json"
    manifest.write_text(json.dumps({"count": len(rendered), "ids": rendered}, ensure_ascii=False))
    print(f"+ wrote {manifest.relative_to(ROOT)}: {len(rendered)} ids")


if __name__ == "__main__":
    main()
