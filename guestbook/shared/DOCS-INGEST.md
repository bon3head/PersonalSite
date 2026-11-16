# Shared guestbook: technical docs ingest

Version 1.0.0, 2026-11-16. Read before the spec (Justin, 2026-11-16: "do a technical docs ingest first"). Every rule in DESIGN 6.14 Shared marks and in `SETUP.md` that depends on a platform behavior cites a line here. Read live on 2026-11-16; recheck the source if a behavior below looks wrong.

## 1. Vercel Functions in a Vite project

| Fact | Source |
|---|---|
| A file under `api/` in a project on a framework other than Next.js becomes a Vercel Function. The Web signature is a default export with a `fetch(request)` method returning a `Response`. | [Functions quickstart](https://vercel.com/docs/functions/quickstart), [Functions](https://vercel.com/docs/functions) |
| Without a framework module system, use `"type": "module"` in package.json or `.mjs`. This repo's package.json already has `"type": "module"`, so `api/sign.js` is ESM. | [Edge runtime page, module note](https://vercel.com/docs/functions/runtimes/edge) |
| The Node.js runtime supports `.ts` in `api/` but compiles with the root tsconfig; path mappings and project references are unsupported. This repo's tsconfig only includes `src`, so the function is plain JS with JSDoc and stays out of `tsc --noEmit`. | [Node.js runtime](https://vercel.com/docs/functions/runtimes/node-js) |
| `@vercel/functions` (`ipAddress`) and `@vercel/firewall` (`checkRateLimit`) exist but are new dependencies. Not used: the headers below give the IP with no package. | [@vercel/functions reference](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package), [Rate limiting SDK](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting-sdk) |

## 2. Client IP on Vercel

| Fact | Source |
|---|---|
| `x-forwarded-for` holds the client's public IP. "Vercel overwrites this header and does not forward external IPs to prevent IP spoofing." | [Request headers](https://vercel.com/docs/headers/request-headers) |
| `x-real-ip` is identical to `x-forwarded-for`. `x-vercel-forwarded-for` is identical too and survives a proxy placed in front of Vercel. The function reads `x-vercel-forwarded-for`, then `x-real-ip`, then the first entry of `x-forwarded-for`. | same |

## 3. Environment variables

| Fact | Source |
|---|---|
| Project environment variables are set in Project Settings; Vercel recommends against `build.env` in vercel.json. | [vercel.json](https://vercel.com/docs/project-configuration/vercel-json) |
| A variable can be marked Sensitive (type secret): its value cannot be read back from the dashboard. Use this for the GitHub token and the salt. | [Sensitive environment variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables), [vercel env add --sensitive](https://vercel.com/docs/cli/env) |
| `VERCEL=1` and `VERCEL_ENV` (production, preview, development) are set at build and runtime. The build pull runs only when the token is present, so local and test builds never call GitHub. | [System environment variables](https://vercel.com/docs/environment-variables/system-environment-variables) |

## 4. Deploy Hooks

| Fact | Source |
|---|---|
| A Deploy Hook is a URL for one project and one Git branch. A GET or POST to it starts a deployment. "No authorization header is required", so the URL itself is the secret. | [Deploy Hooks](https://vercel.com/docs/deploy-hooks) |
| The response is a job with state `PENDING`. Build cache is on by default for hooks made after May 2021 (`?buildCache=false` turns it off). | same |
| Hooks do not fire if `github.enabled = false` is set in vercel.json. This repo has no vercel.json. | same |

## 5. GitHub REST: issues

| Fact | Source |
|---|---|
| Create an issue: `POST /repos/{owner}/{repo}/issues`. Fine-grained PAT needs repository permission Issues (write). | [Issues REST API](https://docs.github.com/en/rest/issues/issues) |
| Labels, milestones and assignees on create need push access: "Labels are silently dropped otherwise." So an issue anyone else files by hand never carries the `guestbook` label; only Justin's token (owner, push access) can file a labeled one. | same |
| Creating content too fast may hit secondary rate limits (no number published). The global daily cap keeps the function far below any plausible limit. | same, and [REST rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) |
| List repository issues: `GET /repos/{owner}/{repo}/issues` with `state` (open, closed, all), `labels`, `creator`, `since` (updated after), `sort` (created default), `direction` (desc default), `per_page` up to 100. Needs Issues (read). Pull requests can come back too; they carry a `pull_request` key and are skipped. | same |
| Community report: a fine-grained PAT with read-only Issues can still open issues on a public repo, because anyone can open issues on a public repo. Not relied on; noted because it is why the label plus creator filter, not "only the token can file", is the injection guard. | [community discussion 180063](https://github.blesdmm.dns-dynamic.net/orgs/community/discussions/180063) (unverified by GitHub staff) |

## 6. Fine-grained personal access tokens

| Fact | Source |
|---|---|
| Steps: pick expiration, resource owner, "Only select repositories" (this repo), then repository permissions. "Choose the minimal permissions necessary." Metadata (read) is listed as a read-only repository permission and comes with any repository grant. | [Managing personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) |
| "Infinite lifetimes are allowed but may be blocked by a maximum lifetime policy." A personal account has no such policy, so the setup picks a one-year expiry and a calendar reminder rather than none. | same |

## 7. GitHub Actions on issue events

| Fact | Source |
|---|---|
| The `issues` event has activity types for opened, edited, closed, reopened, labeled, unlabeled, deleted and more. It runs only if the workflow file is on the default branch, with `GITHUB_REF` the default branch. So the workflow lands on the default branch to work, whatever branch Vercel deploys from. | [Events that trigger workflows](https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows) |
| Events made with `GITHUB_TOKEN` do not start new runs; events made with a personal access token do (the docs' label example). Issues filed by the function use Justin's PAT, so they start the workflow. | [Triggering a workflow](https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/triggering-a-workflow) |
| Concurrency: at most one running and one pending run per group; a new run cancels the older pending one. `cancel-in-progress: true` also cancels the running one. With a short wait as the first step, a burst of marks inside the wait collapses to one deploy. | [Concurrency](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/control-the-concurrency-of-workflows-and-jobs) |

## 8. Rate limits with no new service

| Option | Fit | Source |
|---|---|---|
| Vercel WAF rate limit rule. "Available on all plans." Hobby: 1 rate limit rule per project (inside 3 custom rules), fixed window 10s to 10min, keys IP or JA4, 1,000,000 allowed requests included. Dashboard config, no code, no dependency. | Use: the edge layer for bursts on `/api/sign` | [WAF rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting) |
| `@vercel/firewall` `checkRateLimit` from code | Not used: new dependency | [Rate limiting SDK](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting-sdk) |
| Counting today's issues (one list call) and the salted visitor hashes in their bodies | Use: the daily per-visitor and global caps, since the WAF window tops out at 10 minutes on Hobby | section 5 |
| In-memory counters in the function | Not used: instances are not shared, so counts reset at random | (no source needed: Functions run as many instances) |
| Redis, KV or Edge Config | Not used: a new service | Justin, 2026-11-15 |

## 9. Not verified from this sandbox

- The Vercel project's framework preset, production branch and plan (the Vercel connector has no access to the team scope from here). The setup steps name the branch as "the branch Vercel deploys to production" for Justin to fill in.
- A live function run, a live deploy hook and a live issue filing. Claude never deploys; Justin runs the smoke test in `SETUP.md` section 6.
