# Deployment workflow

This project is meant to run as a deployed Next.js personal blog. The local CMS remains an authoring helper, while GitHub and Vercel own the delivery path.

## Production model

1. Edit articles, moments, gallery items, music, links, projects, and site profile data in `data/blog.json`.
2. Use `npm run cms` only when you want a local writing console.
3. Run `npm run check` before publishing.
4. Commit the changed JSON, assets, and source files.
5. Push to GitHub.
6. Vercel builds the Next.js app from the GitHub repository.

## Vercel settings

- Framework Preset: `Next.js`
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: `.next`
- Node.js: `24.x` or any version satisfying `>=20.9`
- Environment Variable: `NEXT_PUBLIC_SITE_URL`

Set `NEXT_PUBLIC_SITE_URL` to the public domain, for example:

```text
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

When `NEXT_PUBLIC_SITE_URL` is not set, the app also supports Vercel's `VERCEL_URL` environment variable so preview builds still produce public absolute URLs.

## GitHub Actions

The CI workflow runs on pushes to `main` and `refactor/**`, plus pull requests targeting `main`.

The quality gate includes:

- `node --check server.js`
- `node --test`
- `npx tsc --noEmit`
- `npm run build`
- `npm audit --audit-level=moderate`

## Content and assets

Images, avatar files, gallery covers, and article covers should be committed under `public/assets/` or uploaded through the future online storage layer. Keep production-facing links out of `localhost` so deployed pages remain usable for visitors.
