# Senbon — 千本 / Kanji Pilgrimage

A kanji learning app for non-native speakers of Japanese. Learn 1,000 kanji
through stroke-order animation, with the interface available in six languages.

> **Senbon** (千本, "a thousand") is named after the thousand torii gates of
> Fushimi Inari. Each kanji you clear advances you along the path.

## Features

- **1,000 kanji** with authentic stroke-order animation, derived from KanjiVG
- **Six interface languages** — Japanese, English, Chinese, Korean, Vietnamese, Nepali
- **Per-kanji meanings and readings** in every supported language
- **Progress tracking** — cleared kanji are recorded and shown as pilgrimage progress
- **Installable (PWA)** and fully static — no account, no backend, no tracking

## Tech stack

| Layer | Choice |
|---|---|
| Framework | SvelteKit 2 (Svelte 5) |
| Language | TypeScript |
| Build | Vite 6, `@sveltejs/adapter-static` |
| Tests | Vitest |
| Hosting | Cloudflare Pages (static) |

The app builds to fully static output — there is no server-side runtime.

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default `http://localhost:5173`).

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Build static output into `build/` |
| `npm run preview` | Preview the production build locally |
| `npm run check` | Type-check with `svelte-check` |
| `npm run test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |

## Project layout

```
src/
  lib/
    data/
      kanji/        # 1,028 per-kanji data modules (stroke paths, readings, meanings)
      sets.js       # kanji set definitions grouped by category
      translations.ts  # UI strings for all six languages
    stores/         # language selection
    utils/          # progress persistence (localStorage)
  routes/
    +page.svelte        # home
    select/             # choose a kanji set
    play/               # stroke-order practice
    admin/              # study log and progress
static/
  svg/            # 1,007 KanjiVG source SVGs
  assets/         # images and icons
scripts/          # one-off data generation and QA scripts
tests/            # unit and integration tests
```

## Data persistence

Progress is stored in the browser's `localStorage` only. There is no account
system and no server-side storage, which means **progress does not follow the
user across devices or survive clearing site data**. This is a deliberate
trade-off for a zero-backend, zero-tracking app.

## Deployment

The app deploys as static output to Cloudflare Pages:

```bash
npm run build
npx wrangler pages deploy build
```

The Pages project name is pinned in `wrangler.toml`.

## Licensing

- **Application source code**: MIT — see [`LICENSE`](../LICENSE)
- **Bundled third-party data**: retains its own terms — see
  [`THIRD-PARTY-NOTICES.md`](../THIRD-PARTY-NOTICES.md)

Stroke-order data comes from **KanjiVG** by Ulrich Apel (CC BY-SA 3.0).
Meanings and readings are derived in part from **KANJIDIC2** (EDRDG, CC BY-SA 4.0)
and the **Unihan Database** (Unicode, Inc.). Attribution for each is given in
`THIRD-PARTY-NOTICES.md`, and every generated kanji data file carries its source
in a header comment.

Raw upstream archives are not redistributed here; regenerating the dataset
requires downloading them from their original publishers.
