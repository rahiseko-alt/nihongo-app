# Third-Party Notices

This application bundles data from the third parties listed below. The
application source code itself is distributed under the MIT License (see
`LICENSE`); the data described here remains under its own license terms.

---

## 1. KanjiVG — stroke order data

- **Author**: Copyright (C) 2009-2011 Ulrich Apel
- **Website**: http://kanjivg.tagaini.net
- **License**: Creative Commons Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0)
- **License text**: https://creativecommons.org/licenses/by-sa/3.0/

### Where it is used

| Path | Contents |
|---|---|
| `app/static/svg/*.svg` | 1,007 KanjiVG source SVG files, placed as-is |
| `app/src/lib/data/kanji/*.js` | 1,028 files. The `d` attribute path data is extracted from the corresponding KanjiVG SVG; coordinates are unmodified. Stroke colouring is original to this project. |

Every file under `app/src/lib/data/kanji/` carries the attribution in its header
comment, naming the KanjiVG source file it was derived from.

### Required attribution

> Stroke order data from KanjiVG by Ulrich Apel,
> licensed under CC BY-SA 3.0
> (https://creativecommons.org/licenses/by-sa/3.0/)

### ShareAlike

The KanjiVG-derived data in this repository is redistributed under CC BY-SA 3.0.
If you redistribute a modified version of that data, the modified data must also
be licensed under CC BY-SA 3.0. The application code authored by this project is
independent and is licensed separately under the MIT License.

---

## 2. KANJIDIC2 — kanji meanings and readings

- **Author**: Electronic Dictionary Research and Development Group (EDRDG), Monash University
- **Website**: https://www.edrdg.org/wiki/index.php/KANJIDIC_Project
- **License**: Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)
- **License text**: https://creativecommons.org/licenses/by-sa/4.0/

### Where it is used

Meanings and readings in `app/src/lib/data/kanji/*.js` and `app/src/lib/data/sets.js`
were derived in part from KANJIDIC2 during data generation
(`app/scripts/build-kanji-translated-stages.mjs`).

### Required attribution

> This application uses the KANJIDIC2 dictionary file. This file is the property
> of the Electronic Dictionary Research and Development Group, and is used in
> conformance with the Group's licence
> (https://www.edrdg.org/edrdg/licence.html).

---

## 3. Unihan Database (Unicode Character Database)

- **Author**: Copyright © 1991-2026 Unicode, Inc.
- **Website**: https://www.unicode.org/charts/unihan.html
- **License**: Unicode License (https://www.unicode.org/license.txt)

### Where it is used

Korean readings and several CJK variant readings in `app/src/lib/data/kanji/*.js`
were derived from `Unihan_Readings.txt` during data generation
(`app/scripts/stage7-fix-ko-unihan.mjs`).

### Required attribution

> Copyright © 1991-2026 Unicode, Inc. All rights reserved.
> Distributed under the Terms of Use in https://www.unicode.org/copyright.html

---

## Note on source data files

The raw upstream archives used during data generation (the Unihan archive,
`kanjidic2.xml.gz`, and reference PDFs) are **not** redistributed in this
repository. Only the derived data described above is included, with attribution.
Regenerating the data from scratch requires downloading those sources from their
original publishers.
