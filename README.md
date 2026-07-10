# Paulette C — Systems Portfolio

A modern, privacy-first personal page for internal use, built on the KYN design system as an editorial one-page layout:
- Warm paper/oat surfaces, restrained periwinkle, soft pastel accents, and a small whimsy spark.
- Sections for Hero, About, Skills, Projects, Now, and Contact — with scroll reveals, a scroll-synced typewriter effect on the About copy, and an infinite marquee.
- Hero image path set to `assets/paulette.png`.
- Automatic language detection based on browser locale, with a manual switcher (persisted in `localStorage`) across 5 languages (EN/ES/FR/PT/DE).
- A “Visual Lab” projects section rendered from an auto-generated manifest at `proyectos/projects.json`.

## Local preview

Because project cards are loaded with `fetch`, preview with a local static server instead of opening the file directly:

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173>.

## Project cards

The homepage reads `proyectos/projects.json` at runtime and renders the cards automatically. Regenerate the manifest after adding a new project folder under `proyectos/`:

```bash
npm run projects:manifest
```

A project is included when its folder contains an `index.html`. The generator derives metadata from, in order:
1. `proyectos/projects.config.json` overrides.
2. `package.json`, when present.
3. `README.md` / `readme.md`, when present.
4. The project `index.html` title.
5. The folder name.

Use `proyectos/projects.config.json` only when you want polished titles, descriptions, or type labels without editing homepage code.

## Hero image notes

- Put your image at: `assets/paulette.png`.
- If the file is missing, the page automatically falls back to a placeholder image.

## Customize content

- Update page structure in `index.html`.
- Update translations and project rendering behavior in `script.js`.
- Update the visual system in `styles.css`.

## Deploy on GitHub Pages

This repo includes `.github/workflows/pages.yml`.

On GitHub:
1. Go to **Settings → Pages**.
2. Set **Source** to **GitHub Actions**.
3. Push to `main`.
4. The workflow deploys your site automatically.
