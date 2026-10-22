# aaaravm.github.io

Portfolio of **Aarav Muttanapalli**: AI / ML engineer, founder of logrthm.ai, FTC code lead.

A single WebGL point cloud (24,576 dots, halftone style) sits behind every page and survives navigation.
It starts as noise and denoises into a halftone globe framed by golden-ratio lines. As you scroll or click it
morphs into other shapes: a starfield behind the project grid, the smrthire agent pipeline, `y = log(x)` for
logrthm.ai, an FTC field, a constellation of awards, a neural net and a golden-spiral galaxy. Each project page
has its own shape: a GNN, a curriculum tree, an eye under a CNN, an exoplanet transit, an LSTM wave field,
clipboard streamlines or histology with Grad-CAM.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static site → out/
```

Requires Node 20.9+.

## Edit the words

All copy and links live in **`src/lib/content.ts`**:

- `PROFILE`: the hero
- `PROJECTS` and `SMRTHIRE`: the work cards and the `/projects/<slug>/` pages
- `EXPERIENCE`, `ABOUT`, `AWARDS`: the home page sections
- `LINKS.resume`: the résumé link

## Deploy (GitHub Pages)

The site is a static export (`output: "export"`), so `out/` is plain HTML/CSS/JS.

**Option A: automatic (recommended).** Push this project to the `aaaravM/aaaravM.github.io` repo. In
*Settings → Pages → Build and deployment*, set **Source: GitHub Actions**.
`.github/workflows/deploy.yml` then builds and publishes on every push to `main`.

**Option B: manual.** Run `npm run build` and upload the **contents** of `out/` to the repo root. Keep the
`.nojekyll` file so the `_next/` folder is served.

## Where things are

| Path | What |
| --- | --- |
| `src/components/canvas/engine/` | particle stage (three.js), GLSL shaders, formation builders, registry |
| `src/components/sections/` | home page sections; each declares its formation with `data-formation` |
| `src/components/project/` | the project detail page |
| `src/components/chrome/` | the persistent shell: nav, cursor, smooth scroll, overlays, footer |
| `src/components/fx/` | scramble text, reveals, magnetic hover, links |
| `src/components/ui/` | components from Cult UI, Skiper UI and Watermelon UI (adapted) |
| `public/media/formations/` | dot-matrix stills of each formation, used on the project cards |

UI components: [Cult UI](https://cult-ui.com), [Skiper UI](https://skiper-ui.com) (free tier, credited in the
footer), [Watermelon UI](https://ui.watermelon.sh).
