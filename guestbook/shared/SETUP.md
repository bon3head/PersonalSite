# Shared guestbook: setup for Justin

About 15 minutes, once. Nothing here costs money on Vercel Hobby or GitHub Free. Sources for every step: `DOCS-INGEST.md` (same folder). Design: DESIGN 6.14 Storage and Shared marks.

What you end up with: a visitor locks in a mark, it shows for them at once, GitHub emails you an issue titled `mark: <name>`, and about two minutes later the site redeploys with the mark on it for everyone. To take one down, close the issue.

## 1. GitHub token (for the function and the build)

1. GitHub, Settings, Developer settings, Personal access tokens, Fine-grained tokens, Generate new token.
2. Name `guestbook`. Expiration: 1 year (put a reminder in your calendar a week before).
3. Resource owner: `bon3head`. Repository access: Only select repositories, `PersonalSite`.
4. Repository permissions: Issues, Read and write. Leave everything else at No access (Metadata read comes along by itself).
5. Generate, copy the token. You only see it once.

## 2. Label

On the repo: Issues, Labels, New label, name `guestbook`. Any color.

## 3. Vercel environment variables

Vercel, project `justin-poli-astryx`, Settings, Environment Variables. Add each for **Production only** (so previews never file public marks), and tick **Sensitive** on the first two:

| Name | Value |
|---|---|
| `GUESTBOOK_TOKEN` | the token from step 1 |
| `GUESTBOOK_SALT` | any long random string, for example the output of `openssl rand -hex 32` |
| `GUESTBOOK_REPO` | `bon3head/PersonalSite` (optional, this is the default) |
| `GUESTBOOK_ORIGINS` | your extra domains if the site answers on more than one, comma separated, like `https://example.com,https://www.example.com` (optional; the function always accepts its own host) |

## 4. Deploy Hook and the Action

1. Vercel, project Settings, Git, Deploy Hooks. Name `guestbook`, branch: the branch Vercel deploys to production. Create, copy the URL (it is a secret: anyone with it can start a deploy).
2. GitHub repo, Settings, Secrets and variables, Actions, New repository secret: `VERCEL_GUESTBOOK_HOOK` = that URL.
3. The workflow file is `.github/workflows/guestbook-deploy.yml`. GitHub runs issue workflows only from the **default branch** (`main`), so it must be on `main` to fire, even if production deploys from another branch.

## 5. Rate limit rule (Vercel Firewall)

Vercel, project, Firewall, Configure, New Rule:

- Name `guestbook sign`.
- If: Request Path, equals, `/api/sign`.
- Then: Rate Limit, Fixed Window, 600 seconds, 5 requests, key IP, action Too Many Requests (429).
- Save, Review Changes, Publish.

Hobby allows one rate limit rule per project, and this is it. The function also caps each visitor at 3 marks a day and the whole site at 30 a day.

## 6. Smoke test (after the PR merges and deploys)

1. Open the production site, Contact, Leave a mark, sign as `test`. The done note should read "Everyone will see it in a few minutes."
2. Check GitHub: a new issue `mark: test` with the `guestbook` label, filed by you.
3. Check Actions: a `guestbook deploy` run, waiting 60 seconds, then calling the hook. Then Vercel: a new production deployment.
4. After it is live, reload: `test` is a pin and the count reads `1 mark`.
5. Close the issue. Another run and deploy follow; the pin is gone.
6. Try a link as the line (`see example.com`): the note should read "Kept in this browser. Links and some words stay off the shared field." and no issue appears.

If step 1 says "Kept in this browser for now.", the function did not file: check the Vercel function logs for `/api/sign` (they show only a status and a reason word, never the token or IP).

## 7. Day to day

- Each new mark is a GitHub email. Ignore the good ones. Close the bad ones; the site updates in about two minutes.
- To block a word for good: add it to `api/_words.js` (BLOCK list) in a PR.
- Token expires in a year: make a new one the same way and replace `GUESTBOOK_TOKEN`, then redeploy. While it is expired, new marks stay in each visitor's browser, and a build cannot read the issues, so it ships the committed empty list and shared pins disappear until the new token is in.
- To turn sharing off: delete `GUESTBOOK_TOKEN` in Vercel and redeploy. The function answers 503, visitors see "Kept in this browser for now.", and shared pins leave the site. Your issues stay as a record.
