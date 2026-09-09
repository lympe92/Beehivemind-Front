# Admin · Blog — Claude Guide

> Admin-zone lighter pattern (see [User Management](../user-management/CLAUDE.md#admin-zone-conventions)).

## Purpose
Write, publish and organise the public blog. Before this existed the posts were a
hardcoded array in the frontend, so publishing meant a deploy.

## Routes
All under `employeeRoleGuard('admin')`. Order matters in `admin.routes.ts`:
`blog/categories` and `blog/new` are declared **before** `blog/:id`, or their
paths are read as post ids.

| Path | Component |
|------|-----------|
| `/admin/blog` | `posts/blog-posts.ts` — every post, published or not |
| `/admin/blog/new`, `/admin/blog/:id` | `post-editor/post-editor.ts` |
| `/admin/blog/categories` | `categories/blog-categories.ts` |

## State & Data
Direct `RequestService`, local signals, no store. Types are local snake_case
interfaces in `blog.types.ts`.

```
GET|POST            admin/blog/posts            list (search, status, category_id) / create
GET|PUT|DELETE      admin/blog/posts/:id
POST                admin/blog/posts/:id/publish|unpublish
GET                 admin/blog/posts/slug-available?slug=&ignore=
GET|POST|PUT|DELETE admin/blog/categories[/:id]
POST                admin/media                 multipart; used for every image
```

Backend: `api/BeehiveMind/Content/` in BEEHIVEMIND-Laravel.

## The editor
A bespoke `FormGroup` rather than `<app-form>` — the page is two columns of cards
with counters, a result preview and two repeaters, which a `DynamicField[]`
schema cannot lay out. It still uses the schema system's **field components**
(`app-form-input`, `app-form-textarea`, `app-form-select`, `app-form-richtext`)
with plain `formControlName`: they are `ControlValueAccessor`s whose
`SAFormControlNameDirective` extends `FormControlName`, so they work in any
reactive form.

`post-editor.scss` is page layout only (two columns, repeaters, preview) — the
design system draws this inline in its kit rather than as classes. Tokens only.

### Why the sidebar looks like that
Everything a search or answer engine reads about the article is set here and
stored per post, because the API returns *finished* SEO strings and something
has to author them:

- **Search result** — meta title/description with counters, focus keyword,
  canonical override, and a `noindex` switch. The preview applies the same
  fallbacks the API does, so it is what a crawler will actually read.
- **Social card** — see below.
- **Answers** (in the main column) — key takeaways and FAQ. Both are rendered
  **visibly** on the published article as well as into `FAQPage` markup; Google
  drops markup whose answers are not on screen, and answer engines lift the
  visible text.

### Rich text
`shared/components/form-fields/richtext/` — TipTap, imported **dynamically inside
`isPlatformBrowser`** because it touches `document` while constructing and would
break the server render. The control's value is `{ html, json }`: the HTML is
what readers get, the JSON is the editor document so re-opening a post is
lossless. Headings are limited to H2/H3 — the article title is the page's only
H1 — and the schema matches what `HtmlSanitizer` accepts server-side.

The editor never uploads: it emits `imageRequested`, and the host answers with
`insertImage()`. That keeps the alt-text rule in one place per feature.

### The OG card
`og-card.ts` draws a post's 1200×630 card on a `<canvas>` and uploads it as an
ordinary image. It cannot be done server-side: `tools/build-og.mjs` — which draws
the site's three static cards — drives headless Chrome through puppeteer, and
neither exists on the droplet. The artwork mirrors that script (ink ground,
honeycomb, amber rule, category as kicker, title, domain).

## Gotchas
- **Slug is locked when editing.** It is a published URL; "Change" unlocks it and
  warns. Availability is checked live against `slug-available`.
- **Alt text is asked for before upload**, not after: an article image without one
  fails the site's own audit, and there is no endpoint to add it later.
- Publishing without a social card asks for confirmation — every share would use
  the site's generic blog image.
- A post with `status: published` and no date gets `now()` server-side; a
  `scheduled` post surfaces on its own when the date passes (`published()` filters
  on it — no cron).
- Delete is a **soft** delete, so the row keeps its slug and the URL cannot be
  handed to a different article later.

## Related
[Root](../../../../CLAUDE.md) · [Public site](../../public/CLAUDE.md) ·
[Form system](../../../shared/components/ui/form/CLAUDE.md) ·
[User Management](../user-management/CLAUDE.md) (admin conventions).
