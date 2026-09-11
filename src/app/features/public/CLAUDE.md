# Public site — Claude Guide

> Feature doc. Follows the conventions in the [root CLAUDE.md](../../../../CLAUDE.md); this file covers only what is specific to the marketing pages.

## Purpose
The logged-out website: product pages, plans, help, legal, blog. No store, no services — every page is a static config rendered through the shared section components.

## Routes
`features/public/public.routes.ts`, wrapped by `public-layout` (header + footer, no `<main>` — each page renders its own). Most routes carry `data.seoKey` → `core/services/seo.config.ts`, which the layout applies on every navigation. The pages with a questions band — `/app`, `/pricing`, `/apiariesandbeehives`, `/harvestandfeeding`, `/inspections`, `/financial`, `/help` — carry no `seoKey` and apply their own SEO in the constructor, so they can add the `FAQPage` node built from that band (`core/utils/faq-schema.ts`: `faqPageSchema()`, `withFaq()`, `fromAccordion()`).

| Path | Component | Shape |
|------|-----------|-------|
| `/` | `home/` | HeroLeft (proof strip) → Ribbon → SplitContent (product shot, steps) → SplitAccordion → FeaturesRow → Ribbon → SplitList → PricingTiers → ApplicationDownload → InfoColumns → CtaBanner |
| `/features` | `features-page/` | HeroCenter → SplitList ×3 → Ribbon → SplitList ×2 → CtaBanner (media side alternates across the ribbon) |
| `/app` | `app-page/` | HeroLeft → Ribbon → SplitContent → TextColumns → SplitAccordion → ApplicationDownload → SplitAccordion → SplitAccordion (Common questions) → InfoColumns → CtaBanner |
| `/pricing` | `pricing/` | PageIntro → PricingTiers → TextColumns (level 2, the questions band) → CtaBanner |
| `/apiariesandbeehives`, `/harvestandfeeding` | `apiaries-and-beehives/`, `harvest-and-feeding/` | HeroCenter → SplitContent ×3 (alternating) → SplitAccordion (Common questions) → InfoColumns → CtaBanner |
| `/inspections` | `inspections/` | HeroCenter → SplitAccordion → FeaturesListCta → SplitAccordion → CtaBanner (pivot) → SplitAccordion (Common questions) → InfoColumns → CtaBanner |
| `/financial` | `financial/` | HeroCenter → TextCenterColumn ×2 → FeaturesListCta (6 items) → SplitAccordion (Common questions) → InfoColumns → CtaBanner |
| `/help` | `help/` | PageIntro → TextColumns (level 2) → `.prose` command reference → SplitAccordion (the troubleshooting questions) → CtaBanner |
| `/about` | `about/` | PageIntro → SplitContent → TextColumns → Ribbon → InfoColumns → CtaBanner — **placeholder content, `TODO(content)` throughout** |
| `/contact` | `contact/` | PageIntro → reactive form (`.form-stack`) + neutral Callout → success Callout. Posts to `contact` via `core/services/contact.service.ts` (Content module → email to `info@`, visitor in Reply-To, honeypot field `website`); failure renders inline with the mailbox as fallback (`contact` is in the error interceptor's `SILENT_PATHS`). Success fires `generate_lead`. `/pages/contact-us` redirects here. |
| `/privacy`, `/terms` | `privacy/`, `terms/` | PageIntro → `.prose`. Terms is a **skeleton**; muted paragraphs mark values a lawyer must fill in. |
| `/blog`, `/blog/category/:slug`, `/blog/:slug` | `blog/`, `blog-category/`, `blog-article/` | PageIntro → PostList → CtaBanner; article = `.article__*` + `.prose`. **The only pages here that fetch** — see [The blog](#the-blog). |

## How a page is built
```ts
readonly page: HomePageConfig = { hero: {...}, ribbon1: {...}, ... };   // typed by public-page.model.ts
```
```html
<main>
  <section app-hero-left-content [title]="page.hero.title" ... ></section>
  <section app-ribbon [mode]="page.ribbon1.mode" [quote]="page.ribbon1.quote"></section>
</main>
```
- Section components are **attribute selectors** (`section[app-ribbon]`) with host classes, so the design system's `main > section` band rhythm applies to the real DOM. Pages carry **no `styleUrl`**.
- Config shapes: `public-page.model.ts` (`HeroConfig`, `RibbonConfig`, `SplitContentConfig`, `SplitListConfig`, `SplitAccordionConfig`, `FeaturesRowConfig`, `FeaturesListCtaConfig`, `InfoColumnsConfig`, `CtaBannerConfig`, `PageIntroConfig`, `PricingConfig`, `TextColumnsConfig`, …). Item shapes are the shared component models; a call to action is always one `CtaLink`.
- Repeated sections are arrays mapped with `@for`; the media side alternates by index (`side(i, offset)`).
- Every "Get Started" goes to `/auth/register`; "Need a consultation?" goes to `/contact`. External links (`https://…`) render as `<a target=_blank>` through `LinkButton`.
- **Common questions.** Each product page closes its content with a `SplitAccordion` titled "Common questions", four rows: the ones about the product are checked against the forms in `features/user/` (not against the marketing copy above them), the others answer a beekeeping question people search and link to the blog article that answers it at length. The same array feeds the page and its FAQPage node. `SplitAccordion` renders every answer and only hides closed rows (`[hidden]`, with the body class dropped so its `display: flex` cannot override it), because the markup quotes the answers and a crawler reads the server HTML — before 2026-09-11 only the first row was in the HTML.

## The blog

The one part of the public site that is not a static config. Posts and
categories are written in the admin console and read from the API
([`admin/blog/CLAUDE.md`](../admin/blog/CLAUDE.md)).

- `core/services/blog.service.ts` — thin `RequestService` wrapper, **no store and
  no `fromApi()` mapper**. The article shape is the one thing the frontend does
  not own: `SeoService.convertArticleToSeoModel()` and the sitemap both read the
  API's own field names, so renaming them here would create two spellings of the
  same document.
- The fetch runs during the **server render**, and the transfer cache from
  `provideClientHydration()` carries the result into the browser — a crawler sees
  the list and the article in the HTML, and the client does not fetch twice.
- `blog/blog.mapper.ts` holds what the index and every archive share:
  `ArticleModel → Post`, the chips, the `ItemList` node, and the date format
  (fixed `en-GB`, so the server and the browser produce the same string).
- **Category chips are links**, not a filter. Each category is its own indexable
  archive page with its own meta pair; filtering in place would be one URL where
  there should be five.
- The article renders `content` through `[innerHTML]` (allowlisted server-side on
  save, sanitized again by Angular), plus the visible **In short** list and
  **Common questions** — which is what makes their structured data eligible.
- Render modes: `/blog`, `/blog/category/:slug` and `/blog/:slug` are all
  `RenderMode.Server` in `app.routes.server.ts`. Prerendering them would freeze
  the list at build time. A missing slug calls `SeoService.markNotFound()`, which
  `src/server.ts` turns into a real 404.
- `src/server.ts` builds `/sitemap.xml`, `/rss.xml` and `/llms.txt` from
  `blog/sitemap` and `blog/posts`, cached an hour, falling back to empty rather
  than erroring. It also caches every `api/blog/*` answer for a minute below
  `HttpClient` (a stale copy stands in for a 429/5xx), and answers file-like
  paths such as `/blog/chunk-x.js` with a bare 404 before Angular.
- An article page also loads up to three more posts from its category
  (`withRelated()` in `blog-article.ts`, same server render), shows the byline
  and an "Updated" date when the post changed after the day it went up, and
  links to the product page its category is about (`productPageFor()` in
  `blog.mapper.ts`); the product pages link back through the closing CTA
  banner's `secondary` link and through their "Common questions" rows. A
  category archive with fewer than three posts is `noindex, follow` and out of
  the sitemap (`INDEXABLE_CATEGORY_MIN_POSTS`); since 2026-09-11 every category
  has at least three.
- `BlogPosting.author` is a `Person` only when the console names one; the
  company byline is the `Organization`. A `noindex` page carries no canonical.
- Google no longer shows FAQ rich results for most sites (the Rich Results Test
  lists only Article, Breadcrumbs and Organization for a post); the FAQPage
  markup stays for Bing and the answer engines, which do read it.

## Content flags
- Figures in the "Trusted partner" bands and every price/limit on `/pricing` and the home pricing band are **unconfirmed** (`TODO(content)` comments). The home pricing band duplicates `/pricing` — change a price in both.
- Store links: Play `org.beehivemind`, App Store `apps.apple.com/app/beehivemind` — **both 404 as of 2026-09-09** (the old Play listing is gone, there is no iOS build). Left in place pending a content decision; every click is counted as `app_store_click`.
- The Freshdesk support portal no longer exists. Support links go to `/help` and `/contact`; the LinkedIn company page is gone too and is out of the footer and the Organization schema until a new one exists.
- Titles are keyword-first (`seo.config.ts`), under 60 characters, brand last. Nobody searches for the brand yet.
- Product claims checked against the code on 2026-09-11. **Untrue, removed:** a feeding does not create a cost (only the Costs module creates one), so that sentence is gone from `/harvestandfeeding`. **Still on the pages, not backed by the code:** hive **groups** (`/apiariesandbeehives`, `/app` — the beehive model has no group field) and **cost per hive** (`seo.config.ts` descriptions for `/financial`). Confirmed: QR labels per hive, harvests and feedings per hive or per apiary, income/outgoing cost categories.

## Related
[Root CLAUDE.md](../../../../CLAUDE.md) · sections in `shared/components/{hero,info,cta}-sections/` · `seo.config.ts` · `core/utils/faq-schema.ts`
