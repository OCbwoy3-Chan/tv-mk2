"""Prepare Google's COLRv1 font for browsers.

Requires fonttools[woff]==4.61.1. Run from the repository root.
"""

from pathlib import Path

from fontTools.ttLib import TTFont


def rename_font(font):
    """Give converted fonts a distinct family to avoid system font collisions."""
    for name_id, value in {
        1: "Witchsky Noto Color Emoji",
        3: "Witchsky Noto Color Emoji",
        4: "Witchsky Noto Color Emoji",
        6: "WitchskyNotoColorEmoji",
    }.items():
        for record in font["name"].names:
            if record.nameID == name_id:
                record.string = value.encode(record.getEncoding())


directory = Path("assets/fonts/noto-color-emoji")
font = TTFont(directory / "Noto-COLRv1.ttf", recalcTimestamp=False)
rename_font(font)
font.flavor = "woff2"
font.save(directory / "WitchskyNotoColorEmoji.woff2")
