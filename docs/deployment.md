# Deployment workflow

This project is meant to run as a deployed Next.js personal blog. Content changes live in the repository, while GitHub and Vercel own the delivery path.

## Production model

Application code is deployed from GitHub. Runtime content is stored separately so an
authenticated administrator can publish without committing JSON for every edit:

1. Vercel builds the Next.js application from the GitHub repository.
2. `/admin` starts locked and loads content only after a valid admin token is supplied.
3. Saving writes `blog/blog.json` to the linked private Vercel Blob store and creates a backup.
4. Image and audio uploads use the linked public Blob store.
5. Dynamic public routes read the latest private Blob content on the next request.

`data/blog.json` remains the development fallback and the initial seed for a new Blob
store. Production admin writes never fall back to Vercel's temporary filesystem.

## Vercel settings

- Framework Preset: `Next.js`
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: `.next`
- Node.js: `24.x` or any version satisfying `>=20.9`
- Environment Variable: `NEXT_PUBLIC_SITE_URL`

Required production variables and platform credentials:

```text
ADMIN_WRITE_TOKEN=<long random secret>
BLOB_READ_WRITE_TOKEN=<provided by the linked private Blob store>
BLOB_PUBLIC_STORE_ID=<linked public Blob store id>
NEXT_PUBLIC_SITE_URL=https://yukino-blog.site
DEEPSEEK_API_KEY=<server-side DeepSeek API key>
DEEPSEEK_PET_MODEL=deepseek-v4-flash
DEEPSEEK_MODEL=deepseek-v4-flash
```

The Kurisu assistant reads a private Blob configuration first and then falls back to
`DEEPSEEK_API_KEY` and `DEEPSEEK_PET_MODEL`/`DEEPSEEK_MODEL`. These variables must be
configured in Vercel for the Production environment; never use a `NEXT_PUBLIC_`
prefix for the API key. After deployment, open `/admin`, load the DeepSeek settings,
and confirm the status reports a configured backend or environment key.

If the key is absent or the upstream request fails, `/api/kurisu-pet` intentionally
returns a local reply so the public page remains usable. The server logs record only
the configuration source, model, failure category, and HTTP status; they never record
the API key or visitor message.

Vercel supplies `VERCEL_OIDC_TOKEN` to deployments. The media uploader uses it with the
store selected by `BLOB_PUBLIC_STORE_ID` when a dedicated public Blob token is not configured. Never
commit any token to the repository.

Application-level request throttling is a best-effort guard on each serverless instance.
For sustained abuse protection, also enable Vercel Firewall rate limiting for `/api/admin/*`.

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

Images, avatar files, gallery covers, and article covers can be committed under
`public/assets/` or uploaded from `/admin` to the public Blob store. Keep
production-facing links out of `localhost` so deployed pages remain usable for visitors.
