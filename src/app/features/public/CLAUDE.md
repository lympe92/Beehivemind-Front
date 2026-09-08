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
| `/blog`, `/blog/:slug` | `blog/`, `blog-article/` | PageIntro → PostList (tag chips filter client-side) → CtaBanner; article = `.article__*` + `.prose`. Posts live in `blog/posts.data.ts`. |

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

## Content flags
- Figures in the "Trusted partner" bands and every price/limit on `/pricing` and the home pricing band are **unconfirmed** (`TODO(content)` comments). The home pricing band duplicates `/pricing` — change a price in both.
- Store links: Play `org.beehivemind`, App Store `apps.apple.com/app/beehivemind` (unverified ids).

## Related
[Root CLAUDE.md](../../../../CLAUDE.md) · sections in `shared/components/{hero,info,cta}-sections/` · `seo.config.ts`
