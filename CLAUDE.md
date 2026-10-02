# Campuscout site

- Page URLs: the canonical form of every page is the `.html` URL (`https://campuscout.org/india.html`); the home page is `https://campuscout.org/`. Internal links must use the `.html` form (or `/` for home) and never the extensionless form (`/india`). netlify.toml turns off Netlify's Pretty URLs and 301-redirects the extensionless forms; keep both in place.
- Whenever a page is added, removed or renamed, update `sitemap.xml` (and its `<lastmod>`), add the page's canonical and Open Graph tags, and add its extensionless 301 to `netlify.toml`. This gets forgotten otherwise.
