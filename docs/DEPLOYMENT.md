# Replacing the original website

This repository builds both public sites and uses the same S3 buckets, CloudFront distributions, contact endpoint and country settings as `~/vscode_projects/pfitztronic-website`. The source repository, infrastructure and mail handler have not been changed.

## Release workflow

Pull requests to `main` run Astro/TypeScript diagnostics, the submission and hosting tests, both production builds, and verification of metadata, routes, assets and forms. They do not receive AWS credentials or deploy. Pushes to `main` and manual runs on `main` deploy the exact validated artifact, independently for each country. Manual runs on other branches only validate.

The deployment jobs use GitHub environments `production-bw` and `production-zw` and serialize deployments per country without cancelling a running upload. Configure any desired environment protection in GitHub. Artifact retention is 30 days. A failed country does not cancel the other country's deployment; inspect both jobs.

| Country | Bucket | CloudFront distribution | URL |
| --- | --- | --- | --- |
| Botswana | `pfitztronic.co.bw` | `E2IHQHKBAWD0GN` | https://pfitztronic.co.bw |
| Zimbabwe | `pfitztronic.co.zw` | `E1NIKM2EN50E34` | https://pfitztronic.co.zw |

Deployment targets are defined in `scripts/lib/hosting.mjs`. Country content configuration remains in `.env.bw` and `.env.zw`; these files contain public settings only.

## First cutover

1. With npm registry access, run `npm install --package-lock-only`, commit `package-lock.json`, and run `npm ci`. The workflow automatically uses `npm ci` when the lockfile is present. Direct dependencies are pinned; the no-lock fallback uses `npm install` and does not lock transitive dependencies. Registry DNS was unavailable in the editing environment, so a complete lockfile could not be generated here.
2. Run `npm run check`, `npm test`, `npm run build:all`, `npm run verify:all`, and `npm run prepare:hosting`. Run `npm run check:contact` from a network-connected environment.
3. Set repository or production-environment secrets `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`, as in the source repository. `AWS_REGION` is an optional repository variable, defaulting to `af-south-1`. Credentials require `s3:ListBucket` on both buckets; `s3:GetObject` and `s3:PutObject` on their contents; and `cloudfront:GetDistributionConfig`, `cloudfront:CreateInvalidation`, and `cloudfront:GetInvalidation` for the two distributions. The new preflight and invalidation wait need the CloudFront read permissions in addition to the original workflow's permissions. No delete or distribution-update permission is needed.
4. Confirm the existing DigitalOcean handler's `ALLOWED_HOSTS` includes **both** `https://pfitztronic.co.bw` and `https://pfitztronic.co.zw`, space-separated. Its SMTP credentials and recipient remain backend configuration. They must not be added to this repository or browser code.
5. Disable the old repository's deployment workflow before enabling this repository's production deployment. GitHub concurrency groups do not coordinate across repositories. Keep a copy of the existing deployed sites or a known recoverable release before the first switch.
6. Push the reviewed changes to this repository's `main`, or run the workflow manually on `main`. Confirm both deployment jobs and live smoke checks succeed. The workflow does not change DNS, bucket policies, CloudFront associations or Terraform.

No production upload or real enquiry was performed during implementation. The current local checkout has no usable Git metadata, so GitHub repository settings and secrets cannot be confirmed from it.

## Directory URLs and old links

The original infrastructure in `pfitztronic-website-iac` uses private S3 REST origins. Its viewer-request function canonicalizes `www` and `/index.html` but does not resolve `/about/` to `/about/index.html`. [AWS documents this distinction for default root objects](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/DefaultRootObject.html).

`npm run prepare:hosting` prepares artifacts for this exact configuration:

- Normal Astro files such as `about/index.html` remain available.
- A manifest instructs deployment to upload that HTML at the exact S3 object key `about/`, with `text/html` content type. This serves the canonical directory URL without an infrastructure change.
- Slashless URLs such as `/about` and the original `.html` URLs receive small HTML redirect documents pointing to their new destinations. These use a canonical link, meta refresh, a clickable fallback and JavaScript that preserves query strings and fragments. They are **HTTP 200 compatibility documents, not HTTP 301 redirects**. Permanent HTTP redirects can later be implemented in the separately managed CloudFront function.
- All original public routes are mapped, including renamed services and `/blogs/*.html`. Privacy and FAQ content have been migrated so their original URLs remain useful. Redirects are excluded from the sitemap.
- `.hosting/` is internal artifact metadata and is excluded from recursive S3 uploads. `release.json` is public and records only country and revision.

The deploy script checks the CloudFront origin and aliases before upload. It uploads hashed assets first with immutable caching, other assets next, then HTML with `no-cache`, exact URL objects, and finally `release.json`. It retains old objects instead of deleting them, allowing cached pages to finish loading older hashed assets. Retired objects should be cleaned up separately after their retention needs are understood. Publishing is not an atomic site-wide switch; a short mixture of old and new pages is possible during upload.

CloudFront invalidation is awaited before live smoke checks. Those checks verify the release revision, every canonical route, every compatibility URL, HTML content types, country metadata and the existing HTTP 404 behavior. A live failure fails the deployment job; it does not silently roll back or send a test email.

## Contact submission

Both homepage and contact-page forms use `public/js/contact-form.js` and the same country-selected endpoint. The JSON contract remains `name`, `email`, `subject`, `text`, `html`, matching `pfitz-basic-functions/packages/mail/webmailhandler/webmailhandler.js`. Country and mobile are included in both message bodies. User input is escaped before inclusion in HTML. No SMTP credentials or recipient configuration are exposed to the browser.

The script validates required fields and phone numbers, locks fields while sending, suppresses duplicate submits, and times out after 30 seconds. It reads the handler's JSON receipt even though the handler uses `text/plain`, and only shows success when a nonempty `messageId` is returned. HTTP errors retain the form; lost responses and timeouts explicitly say delivery is unconfirmed and never trigger an automatic retry. A mail-service receipt confirms submission, not inbox delivery.

The submit button starts disabled and is enabled only when the handler and configuration are ready. A country-specific email link remains available with or without JavaScript. Privacy information is linked next to the form. The inactive newsletter signup has been replaced with a working blog link.

`npm run check:contact` sends **OPTIONS only**, checks JSON POST preflight permissions for both countries and never sends mail. DigitalOcean's permissive preflight does not establish that the handler's `ALLOWED_HOSTS` accepts a real request or that SMTP delivery works; see [DigitalOcean's CORS documentation](https://docs.digitalocean.com/products/functions/how-to/set-custom-cors-headers/). End-to-end mail delivery needs an explicitly approved real enquiry after deployment. The 18 regression tests use fake responses and do not contact the live mail service. The generated contact form also passed isolated Playwright browser checks for successful submission, reset, and data retention after HTTP failure with a mocked transport.

## Local deployment review and recovery

```sh
npm run build:all
npm run verify:all
npm run prepare:hosting
npm run deploy:bw       # Prints AWS commands only
npm run deploy:zw       # Prints AWS commands only
```

Only `node scripts/deploy.mjs bw --execute` (or `zw`) uploads. In GitHub the deployment script requires the artifact revision to match `GITHUB_SHA`.

For a later rollback, download a known-good `websites-<commit>` artifact into `dist/`, check its `.hosting/manifest.json`, and deploy it using the scripts from that release and the matching revision. In a local shell, leave `GITHUB_SHA` unset or set it to that release's full SHA. Run the smoke command afterwards. The first cutover's previous website must be restored from its backup or original repository workflow; pause this repository's deployment workflow first to prevent competing uploads. Previously uploaded objects are retained, so rollback restores public routes and assets but does not erase files introduced by newer releases.
