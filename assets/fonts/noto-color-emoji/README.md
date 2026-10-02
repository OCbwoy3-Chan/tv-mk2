# Noto Color Emoji

Source: [Google Noto Emoji](https://github.com/googlefonts/noto-emoji/tree/e20cbc2bbec1926686be9f9bee7d1d2cfa1fea0e/2D/fonts),
commit `e20cbc2bbec1926686be9f9bee7d1d2cfa1fea0e`.

- `NotoColorEmoji.ttf`: upstream CBDT/CBLC font for Android.
- `Noto-COLRv1.ttf`: upstream color vector font used to generate the web font.
- `WitchskyNotoColorEmoji.ttf`: the same bitmaps and shaping rules converted to
  Apple's sbix format, with TrueType outlines, for iOS.
- `WitchskyNotoColorEmoji.woff2`: compressed COLRv1 font for web, including
  Firefox/Zen, Chromium and Safari. Firefox does not recognize downloadable
  sbix fonts as color emoji fonts.
  Digit and variation mappings are retained for emoji keycap sequences. The
  app places its text font first so ordinary text and numbers keep their style.

Fonts are licensed under the included SIL Open Font License (`OFL.txt`). The
converted fonts have a distinct family name to avoid system font collisions.

To regenerate the converted files, install `fonttools[woff]==4.61.1` in a Python
environment and run `python scripts/convertNotoEmoji.py` from the repository root.
This conversion preserves glyph IDs, emoji mappings, ligatures, skin tones,
flags, and the original artwork.
Bounding-box outlines provide the glyph bounds CoreText needs. The sbix flags
select the original color bitmaps for rendering. Both converted fonts preserve
the original baseline so emoji fit within text fields and picker rows.
