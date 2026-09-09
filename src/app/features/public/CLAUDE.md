# Public site — Claude Guide

> Feature doc. Follows the conventions in the [root CLAUDE.md](../../../../CLAUDE.md); this file covers only what is specific to the marketing pages.

## Purpose
The logged-out website: product pages, plans, help, legal, blog. No store, no services — every page is a static config rendered through the shared section components.

## Routes
`features/public/public.routes.ts`, wrapped by `public-layout` (header + footer, no `<main>` — each page renders its own). Every route carries `data.seoKey` → `core/services/seo.config.ts`.

| Path | Component | Shape |
|------|-----------|-------|
| `/` | `home/` | HeroLeft (proof strip) → Ribbon → SplitContent (product shot, steps) → SplitAccordion → FeaturesRow → Ribbon → SplitList → PricingTiers → ApplicationDownload → InfoColumns → CtaBanner |
| `/features` | `features-page/` | HeroCenter → SplitList ×3 → Ribbon → SplitList ×2 → CtaBanner (media side alternates across the ribbon) |
| `/app` | `app-page/` | HeroLeft → Ribbon → SplitContent → TextColumns → SplitAccordion → ApplicationDownload → SplitAccordion → InfoColumns → CtaBanner |
| `/pricing` | `pricing/` | PageIntro → PricingTiers → TextColumns (level 2) → CtaBanner |
| `/apiariesandbeehives`, `/harvestandfeeding` | `apiaries-and-beehives/`, `harvest-and-feeding/` | HeroCenter → SplitContent ×3 (alternating) → InfoColumns → CtaBanner |
| `/inspections` | `inspections/` | HeroCenter → SplitAccordion → FeaturesListCta → SplitAccordion → CtaBanner (pivot) → InfoColumns → CtaBanner |
| `/financial` | `financial/` | HeroCenter → TextCenterColumn ×2 → FeaturesListCta (6 items) → InfoColumns → CtaBanner |
| `/help` | `help/` | PageIntro → TextColumns (level 2) → `.prose` command reference → SplitAccordion → CtaBanner |
| `/about` | `about/` | PageIntro → SplitContent → TextColumns → Ribbon → InfoColumns → CtaBanner — **placeholder content, `TODO(content)` throughout** |
| `/contact` | `contact/` | PageIntro → reactive form (`.form-stack`) + neutral Callout → success Callout. **No backend endpoint yet.** `/pages/contact-us` redirects here. |
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
- `src/server.ts` builds `/sitemap.xml` and `/rss.xml` from `blog/sitemap` and
  `blog/posts`, cached an hour, falling back to empty rather than erroring.

## Content flags
- Figures in the "Trusted partner" bands and every price/limit on `/pricing` and the home pricing band are **unconfirmed** (`TODO(content)` comments). The home pricing band duplicates `/pricing` — change a price in both.
- Store links: Play `org.beehivemind`, App Store `apps.apple.com/app/beehivemind` (unverified ids).

## Related
[Root CLAUDE.md](../../../../CLAUDE.md) · sections in `shared/components/{hero,info,cta}-sections/` · `seo.config.ts`
