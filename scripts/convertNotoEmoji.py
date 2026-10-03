"""Prepare Google's sbix font for iOS and COLRv1 font for browsers.

Requires fonttools[woff]==4.61.1. Run from the repository root.
"""

from pathlib import Path
from struct import unpack

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont, newTable
from fontTools.ttLib.tables.sbixGlyph import Glyph
from fontTools.ttLib.tables.sbixStrike import Strike


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
font = TTFont(directory / "NotoColorEmoji.ttf", recalcTimestamp=False)
sbix = newTable("sbix")

for bitmap_strike, glyphs in zip(font["CBLC"].strikes, font["CBDT"].strikeData):
    strike = Strike(ppem=bitmap_strike.bitmapSizeTable.ppemY)
    for name, bitmap in glyphs.items():
        bitmap.ensureDecompiled()
        metrics = bitmap.metrics
        strike.glyphs[name] = Glyph(
            glyphName=name,
            graphicType="png ",
            imageData=bitmap.imageData,
            originOffsetX=metrics.BearingX,
            originOffsetY=metrics.BearingY - metrics.height,
        )
    sbix.strikes[strike.ppem] = strike

font["sbix"] = sbix
del font["CBDT"]
del font["CBLC"]

# CoreText requires TrueType outlines. sbix renders the images instead of these
# bounding-box outlines.
builder = FontBuilder(font=font)
builder.isTTF = True
glyphs = {name: TTGlyphPen(None).glyph() for name in font.getGlyphOrder()}
for strike in sbix.strikes.values():
    scale = font["head"].unitsPerEm / strike.ppem
    for name, bitmap in strike.glyphs.items():
        width, height = unpack(">II", bitmap.imageData[16:24])
        x0 = round(bitmap.originOffsetX * scale)
        y0 = round(bitmap.originOffsetY * scale)
        x1 = round((bitmap.originOffsetX + width) * scale)
        y1 = round((bitmap.originOffsetY + height) * scale)
        pen = TTGlyphPen(None)
        pen.moveTo((x0, y0))
        pen.lineTo((x0, y1))
        pen.lineTo((x1, y1))
        pen.lineTo((x1, y0))
        pen.closePath()
        glyphs[name] = pen.glyph()

pen = TTGlyphPen(None)
pen.moveTo((0, 0))
pen.lineTo((1024, 0))
pen.lineTo((1024, 1024))
pen.lineTo((0, 1024))
pen.closePath()
glyphs[".notdef"] = pen.glyph()
builder.setupGlyf(glyphs)
builder.setupMaxp()

rename_font(font)
font.save(directory / "WitchskyNotoColorEmoji.ttf")

# Firefox does not recognize downloadable sbix fonts as color emoji fonts.
# Google's COLRv1 outlines work across modern browser engines.
font = TTFont(directory / "Noto-COLRv1.ttf", recalcTimestamp=False)
rename_font(font)

font.flavor = "woff2"
font.save(directory / "WitchskyNotoColorEmoji.woff2")
