# Team review pages: email gate + per-section comment pills

A pattern for putting a **private, comment-enabled twin** of a public page in
front of the team before launch. Reviewers land on a gated copy, and every
section has a pill that files a comment into the WorkBase **Tickets** table
tagged with the exact section they were looking at.

First used on `authoring-vs-platforms.html` → `authoring-vs-platforms-teamcomment.html`.
Adapted from the 15th-anniversary preview on `integral-ed-main-site` (which in
turn borrowed the pill pattern from `IntegralEd/NextGenSW`,
`docs/PILL_COMMENT_INTEGRATION.md`).

---

## What the reviewer sees

1. Open the review URL (see below). A plum modal ("Team review") asks for an
   email.
2. Enter any `@integral-ed.com` address → the page unlocks. The email is kept
   in `sessionStorage` and attached to every ticket, so reviewers don't retype
   it.
3. Each section shows a small **💬 Feedback** pill in its bottom-right corner
   (dimmed until hover; yellow on the dark hero/lock-in bands, plum elsewhere).
4. Clicking a pill opens the WorkBase Tickets form **in a new tab**, pre-tagged
   with that section. The reviewer types their comment there and submits; the
   ticket lands in the Tickets table.

The gate is **soft** — light-touch deterrence for an internal link, not real
security. The page HTML still ships in the response. For anything truly
sensitive use server-side / Netlify password protection instead.

---

## URLs

| Public page | Team review twin |
|---|---|
| `https://integralelearning.com/authoring-vs-platforms.html` | `…/authoring-vs-platforms-teamcomment.html` |
| `https://integralelearning.com/storyline-vs-rise.html` | `…/storyline-vs-rise-teamcomment.html` |

`build.js` generates the twins in a loop (`reviewPages`); to add a review twin
for a new page, add a `[source, output]` pair there. The gate copy and pill
code (`avp-teamreview.js`/`.css`) are page-agnostic and shared.

The `.html` is optional — Netlify serves both at their extensionless paths
(`…/authoring-vs-platforms-teamcomment` works too).

---

## How the ticket is tagged

Clicking a pill opens:

```
https://workbase.softr.app/feedback-ticket?Section=<id>&URL=<full url incl #section>&Email=<gate email>
```

- **`URL`** — the Softr form's existing **hidden URL field** captures this
  whole string, so the section anchor (`#myths`, `#lock-in`, …) is always
  recoverable even if nothing else is mapped. This is the field that made the
  anniversary flow work and is the one guaranteed to land.
- **`Section`** / **`Email`** — populate dedicated Airtable columns **only if**
  the Softr form has hidden fields named exactly `Section` and `Email` mapped
  to those columns. If not, they're harmlessly ignored (still readable inside
  the `URL` value). To turn them into real columns, add matching hidden fields
  in the Softr form builder.

Section ids on this page: `top`, `myths`, `connect`, `lock-in`, `formats`,
`decision-tree`, `checklist`.

To point at a different form (e.g. the preview app), change `FEEDBACK_FORM_URL`
in [`src/js/avp-teamreview.js`](../src/js/avp-teamreview.js).

---

## How it's built (no drift)

The review page is **not** a hand-maintained copy. `build.js` generates it from
the already-built public page on every build, so the review copy can never
drift from what ships. See the "Generating team-review page" block in
[`build.js`](../build.js):

1. Build `authoring-vs-platforms.html` normally (analytics + footer + widget
   injected).
2. Read that built file and write `authoring-vs-platforms-teamcomment.html`
   with these transforms:
   - `robots` → `noindex, nofollow` (canonical still points at the public URL,
     so search only ever indexes the real page).
   - `<title>` prefixed with `Team review · `.
   - Chat widget markup stripped (the pills own the bottom-right corner).
   - Gate assets injected before `</head>`:
     `avp-teamreview.css` + `avp-teamreview.js`.

### Gotcha: inject on the LAST `</head>`

The GA4 analytics snippet injected into every page contains a **documentation
comment with a literal `</head>` in it**. A naive `replace('</head>', …)` hits
that commented occurrence first and buries the gate tags inside the comment —
they parse as comment text and never load (the gate silently no-ops). The build
uses `lastIndexOf('</head>')` to target the real one. If you copy this pattern,
keep that.

### Gotcha: `main.js` is an ES module

The shared `js/main.js` (navbar) uses `import`, so it must be loaded with
`<script type="module">`. Loading it as a plain script throws
`Cannot use import statement outside a module` and kills the mobile nav.

---

## Files

| File | Role |
|---|---|
| [`src/js/avp-teamreview.js`](../src/js/avp-teamreview.js) | Email gate (sessionStorage, `avp-locked` class applied pre-paint from a `<head>` script) + per-section pill builder + ticket-URL construction. Loaded **only** on the review page. |
| [`src/css/avp-teamreview.css`](../src/css/avp-teamreview.css) | Gate modal + pill styles. |
| [`build.js`](../build.js) | "Generating team-review page" block: derives the twin from the built public page. |

Nothing here touches the public page's own JS/CSS
(`authoring-vs-platforms.js` / `.css`), so the live experience is unchanged.

---

## Adapting this to another page

1. Give the page's sections real `id`s and wrap them so
   `.avp-main section[id]` (or your equivalent selector) matches — the pill
   builder appends one pill per matched section.
2. In `build.js`, add a generation block for the new page (copy the existing
   one; change the source/target filenames).
3. Reuse `avp-teamreview.js` / `.css` as-is, or fork them if the selector or
   brand colors differ. Adjust `FEEDBACK_FORM_URL` and the section selector if
   needed.
4. Confirm the Softr form's hidden `URL` field is present (it captures the
   tagged referral). Add hidden `Section` / `Email` fields if you want those as
   columns.

## Taking it public

When the page ships for good, either delete the generation block in `build.js`
(the twin URL simply stops being produced) or leave it — the public page is
untouched either way. There's no gate/pill code on the public page to remove.
