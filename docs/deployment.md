# Deployment workflow

This project is meant to run as a deployed Next.js personal blog. Content changes live in the repository, while GitHub and Vercel own the delivery path.

## Production model

1. Edit articles, moments, gallery items, music, links, projects, and site profile data in `data/blog.json`.
2. Add production-facing images and icons under `public/assets/`.
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

## GitHub project auto sync

The `/projects` page can read public repositories from GitHub instead of manually maintained project cards.

Recommended production variables:

```text
GITHUB_PROJECTS_OWNER=your-github-user
GITHUB_PROJECTS_TOKEN=your-github-readonly-token-optional
GITHUB_PROJECTS_WEBHOOK_SECRET=use-a-long-random-secret
CRON_SECRET=use-another-long-random-secret
```

Add a GitHub Webhook to each project repository, or to the organization/account that owns those repositories:

- Payload URL: `https://your-domain.example/api/github/projects`
- Content type: `application/json`
- Secret: the same value as `GITHUB_PROJECTS_WEBHOOK_SECRET`
- Events: push, repository, create, delete, public, and release events

When GitHub sends a signed webhook, the blog invalidates the GitHub project cache, warms the latest repository list, and revalidates `/projects`. If the webhook is unavailable, the page still refreshes from GitHub through the normal Next.js revalidation window.

New repositories also sync into the project page. `vercel.json` defines a daily cron job for `/api/github/projects`, so a newly created public repository is pulled into `/projects` even before that new repository has its own webhook configured. Vercel sends the cron request with `Authorization: Bearer $CRON_SECRET`; keep `CRON_SECRET` private and different from the GitHub webhook secret. Paid Vercel plans can increase the cron frequency if faster no-traffic discovery is needed.

## GitHub Actions

The CI workflow runs on pushes to `main` and `refactor/**`, plus pull requests targeting `main`.

The quality gate includes:

- `node --test`
- `npx tsc --noEmit`
- `npm run build`
- `npm audit --audit-level=moderate`

## Content and assets

Images, avatar files, gallery covers, and article covers should be committed under `public/assets/` or uploaded through the future online storage layer. Keep production-facing links out of `localhost` so deployed pages remain usable for visitors.
