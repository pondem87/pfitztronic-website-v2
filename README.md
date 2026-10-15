# Pfitztronic website

A Pfitztronic Astro website built from the Boxup Pro template, with separate static builds for Botswana and Zimbabwe.

## Run locally

Use Node.js 22.12 or newer (Node 24 recommended) and npm:

```sh
npm install
npm run dev
```

Astro prints the local development URL. Other commands:

```sh
npm run dev:bw       # Botswana development server (also npm run dev)
npm run dev:zw       # Zimbabwe development server
npm run check        # Astro and TypeScript diagnostics; requires dev dependencies
npm test             # Contact submission and hosting regression tests
npm run build:bw     # Botswana output in dist/bw (also npm run build)
npm run build:zw     # Zimbabwe output in dist/zw
npm run build:all    # Build both countries sequentially
npm run verify:all   # Check both generated sites
npm run prepare:hosting # Prepare exact S3 keys and legacy URL redirects
npm run deploy:bw    # Review Botswana AWS commands (does not upload)
npm run preview:bw   # Preview Botswana (also npm run preview)
npm run preview:zw   # Preview Zimbabwe
```

## Country configuration and deployment

The public settings in `.env.bw` and `.env.zw` were copied from `~/vscode_projects/pfitztronic-website`. Both files are intentionally committed; do not put credentials in them. `scripts/run-country.mjs` loads the selected country file, forwards additional CLI arguments (for example `npm run dev:zw -- --port 4322`), and fixes the build output to `dist/bw` or `dist/zw`. The selected file takes precedence over inherited environment values so a Botswana shell cannot accidentally create a mixed Zimbabwe build. Unsupported country codes, mismatched output directories, missing settings, and invalid HTTP(S) URLs fail the build.

`src/config.ts` provides the country settings to Astro components. Each build uses its configured locale, canonical origin, cross-country alternate links, location, phone, email, map, Analytics property, contact endpoint, and social profile URLs. Sitemaps and robots files use the selected domain. Service content and pricing remain shared and editable in their Markdown files.

The source configuration currently gives Zimbabwe the same Botswana telephone number and contact endpoint as Botswana. These values are preserved. Each enquiry includes its country and the submitted mobile number in the message sent through the existing endpoint. No PHP host is needed. Successful delivery still depends on that endpoint accepting requests from the deployed domain.

`.github/workflows/main.yaml` validates pull requests, then deploys verified artifacts after pushes or manual runs on `main`. It runs type diagnostics, regression tests, both builds and static verification before saving the artifact. Production jobs check contact preflight, validate the AWS target, upload each country, wait for CloudFront invalidation and verify live routes. See [the deployment and cutover guide](docs/DEPLOYMENT.md) for secrets, permissions, compatibility URLs and recovery.

| Country | Output | S3 bucket / domain | CloudFront distribution |
| --- | --- | --- | --- |
| Botswana | `dist/bw/` | `pfitztronic.co.bw` | `E2IHQHKBAWD0GN` |
| Zimbabwe | `dist/zw/` | `pfitztronic.co.zw` | `E1NIKM2EN50E34` |

Set repository or production-environment secrets `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. The optional repository variable `AWS_REGION` defaults to `af-south-1`. The workflow uses Node.js 24 and automatically uses `npm ci` when a committed `package-lock.json` is present, otherwise `npm install` with pinned direct dependencies. Generate and commit the complete lockfile with registry access before cutover; local registry DNS prevented generating it here.

The site uses directory URLs such as `/about/`. Deployment publishes HTML at the exact trailing-slash S3 keys as well as normal `index.html` paths, supporting the existing private S3/CloudFront setup. Original `.html` URLs and slashless paths use HTML compatibility redirects. No CloudFront rewrite or infrastructure change is required. The workflow retains prior assets and does not delete bucket objects. Disable the old repository's workflow before cutover to prevent competing deployments.

## Project structure

- `src/pages/` defines URLs and composes layouts and sections. Each normal route uses a folder with `index.astro`.
- `src/layouts/BaseLayout.astro` owns document metadata, global styles/scripts, navigation, footer, spinner, and back-to-top control.
- `src/layouts/PageLayout.astro` adds an inner-page heading and breadcrumbs to the base layout.
- `src/components/` groups building blocks under `shared`, `common`, `home`, `about`, `features`, `services`, `blog`, `team`, `testimonials`, and `contact`.
- New template sections extracted for reuse include `stats`, `process`, `pricing`, `projects`, `faq`, and `careers` components.
- `src/data/` contains typed feature, team, and testimonial data used by the cards.
- `src/content/services/` contains Markdown service descriptions. The `services` collection drives homepage cards, the services index, navigation dropdown, and detail routes.
- `src/content/blogs/` contains full Markdown posts with frontmatter. `src/content.config.ts` defines the `blogs` collection with Astro's `glob()` loader and a validated schema.
- `public/img/blogs/` contains blog cover images and the author portrait.
- `public/` contains the copied template assets. Root-relative URLs allow these assets to work at any route depth.

| Template | URL | Page |
| --- | --- | --- |
| `index.html` | `/` | `src/pages/index.astro` |
| `about.html` | `/about/` | `src/pages/about/index.astro` |
| `service.html` | `/services/` | `src/pages/services/index.astro` |
| Markdown services | `/services/<slug>/` | `src/pages/services/[...slug].astro` |
| `blog.html` | `/blog/` | `src/pages/blog/index.astro` |
| Markdown posts | `/blog/<slug>/` | `src/pages/blog/[...slug].astro` |
| `feature.html` | `/features/` | `src/pages/features/index.astro` |
| `team.html` | `/team/` | `src/pages/team/index.astro` |
| `testimonial.html` | `/testimonials/` | `src/pages/testimonials/index.astro` |
| `contact.html` | `/contact/` | `src/pages/contact/index.astro` |
| `404.html` | `/404.html` | `src/pages/404.astro` |

The 404 page is Astro's special static error document. The existing CloudFront configuration serves it with HTTP 404 for missing objects. Privacy and FAQ pages were migrated from the original site and are linked in the footer.

## Reusing building blocks

Pages remain small compositions. For example:

```astro
---
import PageLayout from '../../layouts/PageLayout.astro';
import ServicesSection from '../../components/services/ServicesSection.astro';
import { getServices } from '../../utils/services';
const services = await getServices();
---
<PageLayout title="Services" description="Explore our services.">
  <ServicesSection items={services.slice(0, 4)} />
</PageLayout>
```

Card sections accept typed `items` arrays. Blog sections require collection entries; services default to their sorted collection entries. The remaining sections default to their shared demo data. Features and testimonials also accept `dark` to reproduce their homepage appearance. The team listing still repeats its four demo records to match the original eight-card grid.

`PageLayout` accepts `title`, optional `description`, and optional `breadcrumbs` (`{ label, href? }[]`). `BaseLayout` accepts optional `title` and `description`. `ContactForm` accepts a required unique `idPrefix` and optional `dark` styling.

## Editing services

Edit the eight Markdown files in `src/content/services/` to change service copy and pricing. Their frontmatter contains `title`, `description`, `order` (a positive integer), `image`, optional `imageAlt`, and optional service-specific `pricing`. The Markdown body supplies the detail page.

To add `/services/consulting/`, add `src/content/services/consulting.md`:

```md
---
title: "Consulting"
description: "A short description for cards and page metadata."
order: 9
image: "/img/service-1.jpg"
imageAlt: ""
pricing:
  eyebrow: "Consulting Pricing"
  title: "Choose a Suitable Engagement"
  currency: ""
  plans:
    - name: "Assessment"
      price: "Custom quote"
      description: "A focused review of your needs and priorities."
      featured: false
      href: "/contact/"
      features:
        - label: "Discovery discussion"
          included: true
        - label: "Written recommendations"
          included: true
---

Describe the service here.

## What this can include

- A relevant activity or deliverable.
```

The `glob()` collection loader discovers new Markdown files automatically. `getServices()` sorts entries by `order`, using the entry ID to break ties. The homepage, services index, and dropdown use this same order. The Services dropdown includes an All services link and highlights the current detail page. Its items wrap on narrow screens.

`src/pages/services/[...slug].astro` generates detail pages with `getStaticPaths()` and renders each Markdown body inside `ServiceLayout`, including breadcrumbs, metadata, a contact link, and a link back to all services. No separate page file or navigation edit is required for a new service.

Each service detail page reads its pricing section from that Markdown file's `pricing` frontmatter. Add or remove plans, set each plan's name, custom price text, optional period and description, featured state, contact URL, and feature labels. Change the pricing eyebrow, title, or currency there as well. If `pricing` is omitted, that service has no pricing section.

## Reusing the newer template sections

The newer Boxup download contributes reusable, data-driven Astro sections without replacing Pfitztronic's existing About, blog, or service copy:

- `StatsSection` accepts a list of `{ value, label, icon }` facts.
- `ProcessSection` accepts ordered `{ title, icon, description? }` steps and an optional dark style.
- `PricingSection` accepts plans with a price, optional period and description, feature rows, an optional contact URL, and an optional featured state. Supply real pricing and terms before using it publicly.
- `ProjectsGrid` accepts `{ title, category, image, imageAlt, description?, href? }` projects. The downloaded sample project images are kept under `public/img/boxup-v2/` to avoid overwriting existing image files.
- `FaqSection` accepts `{ question, answer }` entries and uses native disclosure elements.
- `CareerList` accepts role details and only renders an Apply link when `applyHref` is supplied.

Each section accepts optional heading text where appropriate. For example, compose `ProcessSection` on a page like this:

```astro
---
import ProcessSection from '../components/process/ProcessSection.astro';
const steps = [
  { title: 'Discover', icon: 'fa fa-search', description: 'Understand the business and its goals.' },
  { title: 'Design', icon: 'fa fa-sitemap', description: 'Shape the process and solution.' },
];
---
<ProcessSection {steps} />
```

These components are extracted building blocks; existing pages do not add sample pricing, job vacancies, statistics, or projects as factual Pfitztronic claims.

## Editing projects

`src/pages/projects/index.astro` lists projects and links to their detail pages. IoT Hub lives at `/projects/iot-hub/`, composed from `IoTHub` and `IoTHero` in `src/components/projects/`. Both projects reuse `EquipmentCard` and `ProjectHero`, which retains the Boxup Minimal carousel markup and script.

IoT Hub's content and eleven images were copied from `~/vscode_projects/pfitztronic-website`. Edit the equipment, applications, and solution copy in `IoTHub.astro`; its contact email follows the country configuration. Images live in `public/img/projects/iot-hub/` and Astro generates optimized WebP versions. The hero uses the existing Boxup Minimal carousel markup and script with the three source hero images.

Home Automation lives at `/projects/home-automation/`. Edit its accessory descriptions, coordinated-system examples and installation steps in `src/components/projects/HomeAutomation.astro`. Its two hero images and seven accessory images were copied from `~/Downloads/home_automation/` to `public/img/projects/home-automation/` and are optimized by Astro. The enquiry email follows the selected country configuration.

## Writing blog posts

Add a Markdown file such as `src/content/blogs/my-new-post.md`:

```md
---
title: "My new post"
description: "A short summary used on the listing and in metadata."
published: "2026-10-11"
image: "/img/blogs/my-new-post.jpg"
imageAlt: "A description of the cover image"
author: "Author name"
---

The full article starts here.

## A section heading

Use Markdown paragraphs, lists, links, emphasis, and blockquotes.
```

Place its image in `public/img/blogs/`. The filename determines the URL (`/blog/my-new-post/`); no route or card registration is needed. Optional frontmatter fields are `seoTitle`, `authorImage`, `authorBio`, and `cta` (with `heading` and `text`). Dates are validated and displayed in UTC.

Both the homepage and blog index query `getCollection('blogs')`, ordered newest first with the entry ID breaking date ties. The homepage shows four posts; the blog index shows every post once. The detail route uses `getStaticPaths()` and `render(post)` to render the Markdown inside `BlogPostLayout` with metadata, breadcrumbs, author details, and a back link.

The five migrated articles and six images came from the sibling project `~/vscode_projects/pfitztronic-website`, whose full article components were converted to Markdown while retaining their text and reference links. The source project remains unchanged.

## Template behavior and assets

The homepage uses the Minimal carousel from the local Boxup Pro template. The homepage omits team members and testimonials; their reusable components and separate pages remain available.

Bootstrap and jQuery load from the template's CDNs. Local WOW, easing, and template scripts load in order with `defer`. Google Fonts and icon fonts also retain their original external sources, so full presentation and interactions require internet access. No client-side router or UI framework is added.

The homepage and contact-page forms use the original project's JSON contact endpoint, selected from the country configuration. Submission validates inputs, prevents duplicate sends, checks the mail receipt, preserves entries on failure and offers a direct email fallback. The footer links to the blog instead of offering a nonfunctional newsletter signup.

The spinner has an independent timeout and stays hidden without JavaScript. `public/pfitz-icon.png` is used for the favicon and header logo. The Pfitztronic wordmark uses Josefin Sans, matching the headings. The unused PHP library file is excluded from the static assets.

## Validation notes

Both country production builds pass `npm run verify:all`, checking all 27 HTML pages per country, canonical and alternate links, contact data, Analytics IDs, maps, sitemap entries, local assets, and collection links. The country loader has also been checked with conflicting inherited settings and invalid configuration. The 18 contact and hosting regression tests pass, including duplicate-submit prevention, response failures, timeouts, exact S3 paths and legacy URL mappings. Deployment preparation produces 26 canonical routes and 45 compatibility URLs per country. No live enquiry or AWS deployment was made.

Full Astro type checking requires installing the declared `@astrojs/check` and TypeScript dependencies with registry access. These dependencies were unavailable in the editing environment, so type checking could not run here. The generated contact form passed isolated browser checks for success and HTTP failure using mocked transport; full-site preview and live endpoint/hosting checks remain for the connected deployment environment.

## License

See `LICENSE-Boxup.txt` for the supplied Pro template license. The footer credits Pfitztronic. The source folder in `~/Downloads/Boxup` is not modified or needed to run this project.
