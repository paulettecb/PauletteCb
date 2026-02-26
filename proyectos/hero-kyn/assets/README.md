# KYN Assets

Use this folder for KYN-specific static assets.

## Structure
- `fonts/` → local font files (`.otf`, `.woff2`, `.woff`, `.ttf`).
- `images/` → logos, product images, and brand graphics.

## Current font mapping used by `HeroKyn.vue`
The component loads local fonts from these paths:
- `./fonts/neuehaasgrottext-45light-trial.otf` → weight `300`
- `./fonts/neuehaasgrottext-55roman-trial.otf` → weight `400`
- `./fonts/neuehaasgrottext-65medium-trial.otf` → weight `500`

If your uploaded files use different names, update the `@font-face` URLs in `HeroKyn.vue`.

## Example usage in `proyectos/hero-kyn/index.html`
```html
<img src="./assets/images/logo-kyn.svg" alt="KYN logo" />
```
