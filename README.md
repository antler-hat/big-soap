# big-soap-v2

Static HTML + Sass scaffold for a simple multipage site.

## Commands

- `npm install` installs the Sass dependency.
- `npm run build` compiles Sass and copies HTML/assets into `dist/`.
- `npm run dev` watches `src/`, rebuilds on change, and serves `dist/` locally.
- `npm run clean` removes generated output.

## GitHub Pages

- The repo includes `.github/workflows/pages.yml`, which builds the site on pushes to `main` and deploys `dist/` to GitHub Pages.
- In the GitHub repository settings, Pages should use `GitHub Actions` as the build and deployment source.
- Because the site uses relative asset and page links, it will serve correctly from the project Pages URL under `/big-soap/`.

## Structure

- `src/` authored source files
- `src/styles/main.scss` Sass entrypoint
- `src/assets/` static assets copied as-is
- `dist/` generated output ready for static hosting

## Adding pages

Add new pages as `src/*.html`. The build copies each root-level HTML file directly into `dist/`.
