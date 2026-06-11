# Eden & Az — Wedding Website

A clean, immersive, single-page wedding website. Pure HTML/CSS/JS — no build
step, no dependencies — so it can be hosted anywhere (GitHub Pages, Netlify,
Vercel, etc.).

## Preview locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy on GitHub Pages

Repo **Settings → Pages → Source: Deploy from a branch**, pick the branch and
`/ (root)`. The site will be live at `https://<user>.github.io/edenandaz-wedding/`.

## ⚠️ Placeholder content to replace

The source Canva designs and Google Doc were not accessible when this site was
built, so the following are **placeholders** (each is also marked with a
`PLACEHOLDER` comment in the code):

| What | Where |
|---|---|
| Wedding date (`Saturday, June 12, 2027`) | `index.html` (hero + footer) and `WEDDING_DATE` in `js/main.js` |
| Venue name / location | `index.html` hero + "Travel & Stay" cards |
| Couple names (`Eden & Az`, inferred from the repo name) | `index.html` (hero, title, story, footer) |
| Our Story text | `index.html` `#story` section |
| Schedule of events (times & descriptions) | `index.html` `#schedule` section |
| Dress code | `index.html` `#schedule` section |
| RSVP deadline + RSVP link (currently a `mailto:`) | `index.html` `#rsvp` section |
| FAQ answers | `index.html` `#faq` section |
| Hotel / room block / transport details | `index.html` `#travel` section |

To match the Canva design's exact look, adjust the color variables at the top
of `css/styles.css` (`--ivory`, `--sage-deep`, `--gold`, …) and the fonts in
the `<link>` tag in `index.html`.

## Structure

```
index.html        — all page content (edit text here)
css/styles.css    — theme variables, layout, animations
js/main.js        — wedding date, countdown, nav, scroll reveals
assets/           — favicon
```
