# Africa EPU Index — Blog

Source for the CAPE Africa Economic Policy Uncertainty (EPU) Index blog, published with GitHub Pages.

**Live site:** https://CAPE-ERC.github.io/CAPE-ERC-EPU-Index/

## What's here

- `index.html` — the long-form blog page (narrative + visualizations)
- `assets/css/style.css` — design tokens and layout
- `assets/js/charts.js` — chart renderers and the underlying data, sourced from the methodology document's tables
- `methodology/` — the full methodology PDF, linked from the page
- `assets/img/` — CAPE logo

## Local preview

This is a static site with no build step. Serve the folder with any static file server, e.g.:

```
npx serve .
```

## Updating

Edit `index.html` / `assets/css/style.css` / `assets/js/charts.js` directly and push to `main` — GitHub Pages redeploys automatically.
