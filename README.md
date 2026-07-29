# integralelearning

Marketing microsite for **integralelearning.com** — Integral Ed's instructional
design and eLearning development services. Static site built by a small Node
script (`build.js`) into `dist/`, deployed on Netlify.

## Develop

```bash
npm run build     # build src/ -> dist/ (node build.js)
npm run dev       # serve src/ at http://localhost:3000 (live-server)
npm run preview   # serve the built dist/ at http://localhost:8080
```

Netlify runs `npm run build` and publishes `dist/`.

## How the build works

- `build.js` copies `src/` → `dist/`, and for each page in the `htmlFiles` list
  injects, from `vendor/integralthemes/components/`: the GA4 analytics snippet
  (before `</head>`), the shared network footer (at the `<!-- FOOTER_INJECT -->`
  marker), and the chat widget (before `</body>`).
- Styling: `vendor/integralthemes/theme/theme.css` (shared brand theme) +
  `src/css/site.css` (site overrides). Individual pages may add their own
  page-scoped CSS/JS under `src/css/` and `src/js/`.
- The vendored `integralthemes` theme is the shared Integral Ed design system
  (tokens, layout, components, brand assets).

## Pages

| URL | Source |
|---|---|
| `/` | `src/index.html` |
| `/authoring-vs-platforms.html` | `src/authoring-vs-platforms.html` — "Do You Need an LMS?" interactive explainer (authoring tools vs. platforms) |
| `/storyline-vs-rise.html` | `src/storyline-vs-rise.html` — capability matrix for the two Articulate 360 tools; reuses the explainer's design system |

### "Do You Need an LMS?" explainer

`authoring-vs-platforms.html` is a self-contained interactive page (myth flip
carousel, home/music analogy system, decision-tree self-assessment) with its
own page-scoped CSS/JS and FAQ structured data. It borrows layout patterns
(sticky scroll-spy rail, dark hero, reveal-on-scroll) from the main site's
15th-anniversary page.

**Team review twin:** `build.js` also generates
`authoring-vs-platforms-teamcomment.html` — a private, email-gated copy with
per-section comment pills that file into WorkBase Tickets. See
[`docs/TEAM_REVIEW_COMMENTS.md`](docs/TEAM_REVIEW_COMMENTS.md).

## Structure

```
src/
  index.html                       homepage
  authoring-vs-platforms.html      LMS explainer (page-scoped css/js)
  css/site.css                     site overrides on top of the vendor theme
  css/authoring-vs-platforms.css   explainer page styles
  css/avp-teamreview.css           team-review gate + comment pills
  js/main.js  js/config.js         navbar + site config (ES modules)
  js/authoring-vs-platforms.js     explainer interactions
  js/avp-teamreview.js             team-review gate + comment pills
  assets/ images/                  page assets + the decision-checklist PDF
vendor/integralthemes/             shared brand theme + components
build.js                           the build
docs/                              feature docs
```
