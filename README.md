# Eden & Aaron — Wedding Website

**Sunday, 18 October 2026 · The Overseas Passenger Terminal, The Rocks, Sydney**

A light, airy, editorial single-page wedding website built from the design
decks (Place of LB ideation + Studio Roux WIP) and the copy doc. Pure
HTML/CSS/JS — no build step, no dependencies — hostable anywhere
(GitHub Pages, Netlify, Vercel, etc.).

## Design language

- **Feel** (from the ideation brief): light, airy, ethereal, elevated, minimal, seamless
- **Palette**: bone `#efece6`, ink `#1d1c19`, poppy red `#ff3131` (sparing accent),
  olive `#555d3e`, sand `#c4b991`, dusty rose `#ba8f85` — all editable as CSS
  variables at the top of `css/styles.css`
- **Type**: Cormorant Garamond (clean serif) + Jost (spaced uppercase labels) +
  Caveat for the hand-drawn headings with red underline strokes
- **Features from the brief**: moving backdrop with names on landing, the invite
  as a card with a custom postage-stamp illustration, hand-drawn section
  headings, the Aufruf as a pink square, details/FAQ and RSVP sections

## Sections

1. **Hero** — animated colour wash + botanical/poppy line art, EDEN & AARON
2. **Invitation** — full invite copy with stamp illustration
3. **Countdown** — live countdown to 1:00 pm AEDT, 18 Oct 2026
4. **Wedding** — when / where / to follow / dress code + map link
5. **Aufruf** — Saturday 10 October 2026, The Central Synagogue
6. **Details** — FAQ accordion (registry, children, dress code, parking, comms, contact)
7. **RSVP** — mailto `edenandaz@gmail.com`

## Still to add (marked `PLACEHOLDER` in the code)

- Bank details for the wishing well (Details → registry answer in `index.html`)
- An RSVP form link, if preferred over the mailto button

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
css/styles.css    — theme variables, layout, animations
js/main.js        — wedding date, countdown, nav, scroll reveals
assets/           — favicon
```
