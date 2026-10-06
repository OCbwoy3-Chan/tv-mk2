# Noto Color Emoji (web only)

Source: [Google Noto Emoji](https://github.com/googlefonts/noto-emoji/tree/e20cbc2bbec1926686be9f9bee7d1d2cfa1fea0e/2D/fonts),
commit `e20cbc2bbec1926686be9f9bee7d1d2cfa1fea0e`.

- `Noto-COLRv1.ttf`: upstream color vector font used to generate the web font.
- `WitchskyNotoColorEmoji.woff2`: compressed COLRv1 font for web, including
  Firefox/Zen, Chromium and Safari.
  Digit and variation mappings are retained for emoji keycap sequences. The
  app places its text font first so ordinary text and numbers keep their style.

Fonts are licensed under the included SIL Open Font License (`OFL.txt`). The
converted font has a distinct family name to avoid system font collisions.
Native builds use platform emoji and do not import or package these assets.

To regenerate the web font, install `fonttools[woff]==4.61.1` in a Python
environment and run `python scripts/convertNotoEmoji.py` from the repository root.
This conversion preserves glyph IDs, emoji mappings, ligatures, skin tones,
flags, the original artwork, and the original baseline.
