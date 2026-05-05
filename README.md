# HomeOrder

HomeOrder is a Next.js App Router project for a home bakery order and inventory workflow. The current implementation uses a mock repository by default and keeps the repository boundary ready for a future Google Sheets data source.

## Local Development

Install dependencies:

```powershell
npm install
```

Start the development server:

```powershell
npm run dev
```

Optional development warmup after the dev server is ready:

```powershell
npm run dev:warmup
```

Useful checks:

```powershell
npm run lint
npm run type-check
npm run build
```

## Project Scripts

```json
{
  "dev": "next dev",
  "dev:turbo": "next dev --turbopack",
  "dev:warmup": "node scripts/warmup-dev.mjs",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "type-check": "tsc --noEmit"
}
```

## Deployment Guide

This project is intended to deploy with:

- GitHub for source control
- GitHub Actions for CI
- Vercel for hosting and CD
- `main` as the production branch
- `develop` and pull requests as preview deployment sources

GitHub Pages is not used.

### 1. GitHub Setup

1. Create a new GitHub repository.
2. Commit this project into the repository.
3. Push the initial branches:

```powershell
git branch -M main
git push -u origin main
git checkout -b develop
git push -u origin develop
```

Recommended branch flow:

- `main`: production-ready code. Vercel should deploy this as the production site.
- `develop`: integration branch for upcoming work. Vercel can deploy this as preview.
- feature branches: open pull requests into `develop` or `main` depending on your workflow.

### 2. GitHub Actions CI

The CI workflow is located at:

```text
.github/workflows/ci.yml
```

It runs automatically on:

- push to `main`
- push to `develop`
- pull request targeting `main`
- pull request targeting `develop`

The workflow uses Node.js 20 on `ubuntu-latest` and runs:

```powershell
npm ci
npm run lint --if-present
npm run type-check --if-present
npm run build
```

CI must pass before merging production changes.

### 3. Vercel Deployment

1. Go to Vercel.
2. Create a new project.
3. Import the GitHub repository.
4. Vercel should automatically detect this as a Next.js project.
5. Keep the project build settings aligned with `vercel.json`:
   - Build Command: `npm run build`
   - Install Command: `npm ci`
   - Output Directory: leave empty for Next.js
6. Set the production branch to `main`.
7. Keep preview deployments enabled for `develop` and pull requests.
8. Add environment variables in Vercel Project Settings.
9. Deploy.

### 4. Environment Variables

Use `.env.example` as the template. Do not commit real secrets.

Set these in Vercel Project Settings when needed:

```text
NEXT_PUBLIC_APP_NAME
NEXT_PUBLIC_BASE_URL
DATA_SOURCE
GOOGLE_SHEETS_SPREADSHEET_ID
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
NEXTAUTH_SECRET
NEXTAUTH_URL
```

Notes:

- `NEXT_PUBLIC_*` values are browser-visible. Do not put secrets in them.
- `GOOGLE_*` values are reserved for the future Google Sheets integration. They can stay empty while using the mock repository.
- `NEXTAUTH_*` values are reserved for a future auth layer. They can stay empty until NextAuth is implemented.
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` often needs escaped newlines in hosted environments:

```text
-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```

For local development, create `.env.local` from `.env.example`:

```powershell
Copy-Item .env.example .env.local
```

`.env.local` is ignored by git.

### 5. Update Flow

Recommended daily flow:

1. Create a feature branch from `develop`.
2. Push the branch to GitHub.
3. Open a pull request.
4. GitHub Actions runs CI.
5. Vercel creates a preview deployment for the branch or PR.
6. Merge to `develop` for integration preview.
7. Merge to `main` when ready for production.
8. Vercel automatically updates the production site from `main`.

### 6. Common Deployment Issues

Environment variable is missing:

- Check Vercel Project Settings.
- Redeploy after adding or changing environment variables.
- Remember that `NEXT_PUBLIC_*` variables are embedded at build time.

Build fails:

- Run locally first:

```powershell
npm ci
npm run lint
npm run type-check
npm run build
```

Type-check fails:

- Fix TypeScript errors before merging.
- CI runs `npm run type-check --if-present`.

Lint fails:

- Run `npm run lint`.
- This project uses ESLint flat config in `eslint.config.mjs`.

Google private key format issue:

- Store `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` in Vercel with escaped newlines.
- If the future Google Sheets adapter expects real newlines, convert `\\n` to `\n` in server-only code.

Mock data appears in production:

- The current default repository is mock data.
- Do not treat the current deployment as production data storage until the Google Sheets repository or another persistent data store is implemented and selected with `DATA_SOURCE`.

## Vercel Configuration

This project includes a small `vercel.json` file:

```json
{
  "installCommand": "npm ci",
  "buildCommand": "npm run build"
}
```

The file is intentionally minimal. Vercel can still detect this as a standard Next.js App Router project, but the install command is pinned to `npm ci` so Vercel uses the committed lockfile exactly like GitHub Actions.

- Framework Preset: Next.js
- Build Command: `npm run build`
- Install Command: `npm ci`
- Output Directory: Vercel default for Next.js
- Production Branch: `main`
- Preview Deployments: `develop` and pull requests

Expand `vercel.json` later only if the project needs custom redirects, headers, cron jobs, function regions, or other Vercel-specific behavior.

## Deployment Preflight Checklist

- Server-only code:
  - Repository access is currently used through server routes and server components.
  - Future Google Sheets credentials must only be used in server-side modules, API routes, route handlers, or server actions.

- Client-side secret risk:
  - Do not expose `GOOGLE_*`, `NEXTAUTH_SECRET`, private keys, or service account credentials through `NEXT_PUBLIC_*`.
  - Current client code uses relative API calls and does not need secrets in the browser.

- Vercel build risks:
  - `npm run build` must pass locally.
  - `npm run type-check` must pass locally.
  - Keep `package-lock.json` committed so `npm ci` works in CI and Vercel.

- Hard-coded localhost:
  - `scripts/warmup-dev.mjs` defaults to `http://localhost:3000`, but it is a local development helper only.
  - For public URLs, use `NEXT_PUBLIC_BASE_URL` when the app starts needing absolute URLs.

- Mock repository in production:
  - `src/repositories/provider.ts` defaults to the mock repository.
  - `DATA_SOURCE=google_sheets` is already reserved, but the Google Sheets repository is still a stub.
  - Before using real production data, complete the Google Sheets repository and set required secrets in Vercel.

## Related Documentation

- [Program Overview](docs/program-overview.md)
- [Google Sheets Template](docs/google-sheets-template.md)
