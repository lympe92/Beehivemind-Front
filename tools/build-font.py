"""Build src/assets/fonts/peridot-pe-variable.woff2 from the foundry OTF.

The foundry file (tools/fonts/Peridot_PE_Variable.otf, 1.2 MB) carries three
axes (wght 100-950, wdth 50-150, ital) and 1560 glyphs incl. Cyrillic. The site
uses one width, no italics, weights 400-700 and Latin + Greek text, so the
shipped file pins wdth/ital, keeps wght as a 400-700 axis and drops the rest.
Result: ~40 KB WOFF2.

Run (any Python 3.10+):
    python -m venv .venv && .venv/Scripts/pip install fonttools brotli
    .venv/Scripts/python tools/build-font.py

Subset first, then instance: fonttools' instancer drops gvar entries for
glyphs without deltas, and subsetting afterwards trips over the missing keys.
"""

import os
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "tools", "fonts", "Peridot_PE_Variable.otf")
OUT = os.path.join(ROOT, "src", "assets", "fonts", "peridot-pe-variable.woff2")

# Unicode ranges to keep: Basic Latin, Latin-1, Latin Extended-A, Greek and
# Coptic, Greek Extended, General Punctuation, Euro, trademark, arrows, minus,
# check marks.
RANGES = [
    (0x0020, 0x007E),
    (0x00A0, 0x00FF),
    (0x0100, 0x017F),
    (0x0370, 0x03FF),
    (0x1F00, 0x1FFF),
    (0x2000, 0x206F),
    (0x20AC, 0x20AC),
    (0x2122, 0x2122),
    (0x2190, 0x2199),
    (0x2212, 0x2212),
    (0x2713, 0x2714),
]

# fonttools' default OpenType feature set (kern, liga, calt, locl, ccmp, frac…)
# plus the ones the design system may reach for through font-variant-numeric.
EXTRA_FEATURES = ["ss01", "ss02", "ss03", "tnum", "pnum", "lnum", "onum", "case", "cpsp"]


def main() -> None:
    unicodes: set[int] = set()
    for lo, hi in RANGES:
        unicodes.update(range(lo, hi + 1))

    font = TTFont(SRC)

    options = subset.Options()
    options.layout_features = list(subset.Options()._layout_features_default) + EXTRA_FEATURES
    options.notdef_outline = True
    options.hinting = False
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=unicodes)
    subsetter.subset(font)

    font = instancer.instantiateVariableFont(
        font,
        {"wdth": 100, "ital": 0, "wght": (400, 700)},
        inplace=False,
        updateFontNames=False,
    )
    font.flavor = "woff2"
    font.save(OUT)

    built = TTFont(OUT)
    axes = [(a.axisTag, a.minValue, a.maxValue) for a in built["fvar"].axes]
    print(f"{OUT}: {os.path.getsize(OUT)} bytes, {len(built.getGlyphOrder())} glyphs, axes {axes}")


if __name__ == "__main__":
    main()
