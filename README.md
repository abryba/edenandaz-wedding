# Eden & Aaron — Wedding Website

**Sunday, 18 October 2026 · The Overseas Passenger Terminal, The Rocks, Sydney**

A light, airy, editorial single-page wedding website built from the design
decks (Place of LB ideation + Studio Roux WIP), the copy doc and the approved
palette board. Pure HTML/CSS/JS — no build step, no dependencies — hostable
anywhere (GitHub Pages, Netlify, Vercel, etc.).

## Experience

1. **Cover page** — a calm, sunlit, auto-playing ocean scene (animated sky,
   low sun, shimmering sun path, three slowly drifting wave layers) with the
   hand-drawn **Eden & Aaron** logo, ringed by a self-drawing ink stroke.
   Guests click the logo and the cover lifts away in a smooth sweep to reveal
   the site. Deep links (e.g. `…/#wedding`) skip the cover automatically.
2. **Invitation** — full invite copy with a custom postage-stamp illustration
3. **Countdown** — live to 1:00 pm AEDT, 18 October 2026
4. **Wedding** — when / where / to follow / dress code + map link
5. **Aufruf** — the pink square: Saturday 10 October 2026, The Central Synagogue
6. **Details** — FAQ accordion (registry, children, dress code, parking, comms, contact)
7. **RSVP** — mailto `edenandaz@gmail.com`

### Optional: real ocean footage

Drop a calm, licensed ocean clip at **`assets/ocean.mp4`** and the cover will
automatically play it behind the logo (muted, looped). Without the file, the
built-in animated scene is the backdrop — no other change needed.

## Design language

- **Palette** (per the palette board, as CSS variables in `css/styles.css`):
  cream `#f2ebd1` · mist `#d7ddd8` · slate `#809499` · olive `#555d3e` ·
  brown `#6e5d4b` — highlights bronze `#c4b991` and rose `#ba8f85`
- **Type**: Jost (clean sans-serif) for all body copy; Caveat for the
  hand-drawn logo, headers and accents, with bronze underline strokes
- Motion respects `prefers-reduced-motion`, and the site works without
  JavaScript (the cover steps aside via `<noscript>`)

## Still to add (marked `PLACEHOLDER` in the code)

- Bank details for the wishing well (Details → registry answer in `index.html`)
- An RSVP form link, if preferred over the mailto button
- Optional `assets/ocean.mp4` footage

## Preview locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy on GitHub Pages

Repo **Settings → Pages → Source: Deploy from a branch**, pick the branch and
`/ (root)`.

## Structure

```
index.html        — all page content (edit text here)
css/styles.css    — palette variables, layout, cover scene, animations
js/main.js        — wedding date, cover transition, countdown, nav, reveals
assets/           — favicon (+ optional ocean.mp4)
```
