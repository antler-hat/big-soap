# big-soap-v2

Static HTML + Sass scaffold for a simple multipage site.

## Commands

- `npm install` installs the Sass dependency.
- `npm run build` compiles Sass and copies HTML/assets into `dist/`.
- `npm run dev` watches `src/`, rebuilds on change, and serves `dist/` locally.
- `npm run clean` removes generated output.

## Structure

- `src/` authored source files
- `src/styles/main.scss` Sass entrypoint
- `src/assets/` static assets copied as-is
- `dist/` generated output ready for static hosting

## Adding pages

Add new pages as `src/*.html`. The build copies each root-level HTML file directly into `dist/`.
