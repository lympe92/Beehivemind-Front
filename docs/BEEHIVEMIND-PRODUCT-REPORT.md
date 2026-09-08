# BeehiveMind — Product & Platform Report

> Source material for SEO / content generation. Everything below is derived directly from the three codebases (`beehivemind-Front`, `BEEHIVEMIND-Laravel`, `beehivemind-Mobile`) as of 8 September 2026. Items marked **[unconfirmed]** are placeholder values in the code (`TODO(content)`) and must be verified before being published as fact.

---

## 1. What BeehiveMind is

**BeehiveMind is a beehive-management platform for working beekeepers.** It combines three products that share one account and one backend:

| Product | What it is | Who uses it |
|---|---|---|
| **BeehiveMind Web** (`beehivemind.tech`) | The public website plus the beekeeper dashboard (apiaries, hives, inspections, feeding, harvest, treatments, financials, calendar, AI assistant) and a separate admin panel for staff | Beekeepers (desktop/tablet) and BeehiveMind staff |
| **BeehiveMind Mobile** (Android app, package `org.beehivemind`) | A voice-driven field app: you describe a hive out loud while your hands are in it, and the inspection is recorded and synced later | Beekeepers at the apiary |
| **BeehiveMind API** (`api.beehivemind.tech`) | The Laravel backend that stores all data, runs the diagnostic Rules Engine, the Trend Engine, the LLM assistant, weather, notifications and the admin tooling | Both clients |

**Positioning as stated on the site:** "Most intelligent beekeeping software" — "Increase your business productivity with our beehive management software." Three proof points: *Records with no signal · Hands stay in the hive · Android and iOS*.

**Core promise:** record every inspection by voice in the field, have the data appear as a clean table and charts on the web, and let the platform turn that history into diagnoses, trends, treatment schedules and financial insight.

**Domain vocabulary (used consistently across all products):**

| Term | Meaning |
|---|---|
| **Apiary** (μελισσοκομείο) | A location with GPS coordinates that holds several beehives |
| **Beehive** (κυψέλη) | One hive, belongs to an apiary, identified by a number/name and a UUID (used for QR labels) |
| **Queen** | Each hive has a queen record: year, breed, marked or not, aggression, source (purchased / nuc / swarm), installation date, notes |
| **Beehive group** | A user-defined grouping of hives with similar characteristics (e.g. bought queens, new hives) |
| **Inspection** (επιθεώρηση) | A recorded hive check: 14 readings (see §3.4) |
| **Feeding** (τάισμα) | A feeding record: type, food, quantity, unit |
| **Harvest** (συγκομιδή) | A product harvest: honey / pollen / royal jelly / propolis, quantity, unit |
| **Treatment type** | A reusable treatment definition (e.g. a varroa product with dose, interval and repetitions) |
| **Treatment session** | A treatment type applied on a start date to a set of hives; fans out into dated **treatment instances** (doses) |
| **Cost / cost category** | Financial records, each category typed as *income* or *outcome* |
| **Employee** | A staff account for the admin panel (roles: support, moderator, admin, superadmin), distinct from a beekeeper user |

---

## 2. Technology overview

### 2.1 Web (`beehivemind-Front`)
- **Angular 21** (standalone components, signals, lazy-loaded routes), **NgRx** store/effects, **Angular CDK** dialogs.
- **Server-side rendering** (`@angular/ssr` on Express) with client hydration and store hydration — the public site is fully server-rendered for SEO.
- **Google Maps** (apiary map, map picker), **ApexCharts** (dashboards), **qrcode** (hive QR labels).
- Google Analytics 4 and Google Tag Manager are wired in (`G-93PRS27RL6`, `GTM-TL4DLVB8`).
- Per-route SEO metadata is defined centrally (`seo.config.ts`): title, description, focus keyword, canonical, robots, Open Graph, Twitter card and JSON-LD schema (`WebSite`, `WebPage`, `CollectionPage`, `AboutPage`, `ContactPage`). Locale is `en_US`; the product UI is **English only**.
- A ported design system (one accent colour #f69520, ink #212121, weights 400/500/700) is applied verbatim; an automated accessibility/visual audit runs at 375/768/1024/1440 px.

### 2.2 Backend (`BEEHIVEMIND-Laravel`)
- **Laravel 12**, PHP 8.2, **Laravel Passport** (OAuth2 tokens), **Horizon** (queues), Redis, **Google2FA** (TOTP).
- Modular monolith: `api/BeehiveMind/{Module}` for **Admin, AI, Apiaries, Auth, Beehives, Costs, Notifications, Records, Rules, Treatments, Trends, Weather**.
- REST JSON API under `/api`, snake_case payloads, uniform envelope `{ success, data, ... }`, server-side pagination.
- Auth: httpOnly cookie for the web (`access_token` / `employee_token`) **or** bearer token (mobile); rate-limited auth endpoints (10/min per IP), account lockout after failed logins, constant-time password checks.
- Third-party integrations: **Tomorrow.io** (weather), **Ollama / llama3.1:8b** (AI assistant), **Anthropic Claude Haiku 4.5** (AI response judging), **Google Identity** (sign-in).
- Scheduled jobs: `notifications:generate` daily at 08:00, `passport:purge` daily, Horizon snapshots every 5 minutes.

### 2.3 Mobile (`beehivemind-Mobile`)
- **Ionic 8 + Angular 21 + Capacitor 8**, Android-first (minSdk 24, target 36). iOS is planned, not shipped.
- Native plugins: `@capacitor-community/speech-recognition` (on-device speech-to-text, `en-US`), `@capacitor/preferences` (local storage), `@capacitor/network` (sync when online), `@capgo/capacitor-social-login` (Google), haptics, keyboard, status bar.
- Rewrite of the original 2019 native Android app (same Play Store id `org.beehivemind`); the voice grammar and domain logic were ported to TypeScript.
- Talks to the same Laravel API with a bearer token stored on-device.

### 2.4 Data flow in one picture

```
Field (phone, no signal)              Web dashboard                     Backend
────────────────────────              ─────────────                     ───────
say "beehive number twelve"           inspections table / charts        records table
say "three frames of pollen" …   ──►  (edit in place, filter by         ──► Rules Engine (diagnosis)
tap "Finish and save"                  apiary / hive)                   ──► Trend Engine (multi-inspection patterns)
draft saved on device                 treatments → to-do list           ──► AI assistant (Ollama + tools)
uploads when signal returns           financials, weather, QR labels    ──► notifications (08:00 daily)
```

---

## 3. The beekeeper web dashboard (`/user/…`)

Every logged-in beekeeper lands on the dashboard. Left sidebar navigation: **Dashboard · To-Do (List, Calendar) · Apiaries (List, Details, Map) · Beehives · Treatments (Create Treatments, Treatment Sessions) · Inspections · Feeding · Harvest · Financials · AI Assistant · Profile**. A notification bell sits in the header.

### 3.1 Dashboard (`/user/dashboard`)
- Inspection analytics charts (line / bar / pie via ApexCharts) built from average-inspection endpoints.
- Filter by **user (all) → apiary → beehive**; the filter level decides which chart endpoint is used.
- **Disease-detection summary**: counts of varroa, American foulbrood, European foulbrood and nosema based on the *latest inspection per hive* (at user/apiary level) or a Yes/No for a single hive.

### 3.2 Apiaries (`/user/apiary`, `/details`, `/map`, `/:id`)
- **List**: paginated table of apiaries with add / edit / delete. Creating an apiary opens a form with a **Google Maps click-to-place picker** for coordinates, plus name, number of hives, optional location text and date established. Duplicate names are rejected.
- **Details**: card view of apiaries with per-apiary pending to-do counts.
- **Map**: all apiaries plotted on a Google Map.
- **Apiary view** (single apiary dashboard): header with Edit, a **weather card** for the apiary's coordinates, figure tiles for "Hives" and "Pending to-dos", a recent-inspections table, and the apiary's treatment sessions with per-dose rows.
- Deleting an apiary cascades to its hives.

### 3.3 Beehives (`/user/beehives`)
- Filter by apiary.
- **Bulk create**: choose an apiary, enter a count, and that many numbered hives (each with its own queen record) are created at once.
- **Inline edit** of hive name and queen year (must be ≥ 2000).
- **QR code** per hive (from its UUID) with PNG download — for printing labels; the API can look a hive up by UUID.
- Delete a hive.
- The backend also supports **beehive groups** and **queen breeds** (create/list/delete) and richer queen details; the web UI currently exposes name + queen year.

### 3.4 Inspections (`/user/inspections`)
The canonical "records" page. An inspection is one row of **14 readings**:

| Reading | Meaning |
|---|---|
| Date | When the hive was inspected |
| Frames (frame_space) | How many frames the box holds |
| Population | Frames covered by bees |
| Pollen | Frames of stored pollen (fractions allowed) |
| Honey / Nectar | Frames of capped + uncapped honey |
| Eggs (opened_brood) | Eggs and uncapped larvae |
| Closed brood | Capped brood — recorded separately so the next three weeks can be predicted |
| Varroa | Detected yes/no |
| AFB | American foulbrood yes/no |
| EFB | European foulbrood yes/no |
| Nosema | Detected yes/no |
| Queen | Queen seen yes/no |
| Queen cells | Swarm/supersedure cells present |
| Queen year | Year of the queen |

- Two-level filter (apiary → beehive), add/edit via a schema-driven modal with cascading apiary → beehive selects, delete with confirmation.
- One inspection per hive per date (duplicate guard on both client and DB).
- Saving an inspection **syncs the hive's queen record** (queen year, or removes the queen when "no queen" is recorded on the latest inspection).
- The page can be opened directly on one record from the calendar (`?id=`).
- Backend analytics: average inspections over time per user / per apiary, inspections per apiary / per hive (last 360 days).
- Backend diagnostic endpoint: `POST /inspections/{record}/analyze` runs the Rules Engine (see §5.1) and `POST /inspections/{record}/feedback` records user feedback on the diagnosis.

### 3.5 Feeding (`/user/feeding`)
- Records: **feeding type** (stimulation / maintenance), **food type** (pollen patties, sugar syrup, fresh pollen, fondant, nutritional supplement), **quantity**, **unit** (kg, libre, lt, gallon), per hive.
- Beehive is optional: choosing "All beehives" records the feeding for **every hive in the apiary** in one action (bulk store).
- Same filter / modal / duplicate-guard pattern as inspections.

### 3.6 Harvest (`/user/harvest`)
- Records: **product** (honey, pollen, royal jelly, propolis), optional honey description (only for honey), **total quantity**, **unit** (kg, libre, lt, gallon).
- Beehive optional: an apiary-level harvest is **distributed evenly across the apiary's hives** by the backend (remainder to the last hive).
- The "Beehive" column appears only when filtered to an apiary but not a single hive.

### 3.7 Treatments (`/user/treatments`, `/user/treatments/details`)
- **Treatment types** (reusable definitions): name, disease, product, dose, notes, **interval in days**, **repetitions**, recurring flag. Create / edit / delete / "apply".
- **Treatment sessions**: pick a type, a start date, optionally an apiary, a set of hives and notes. The backend **generates every dose as a dated instance** (day 0, +interval, +2×interval, …; repetitions + 1 instances), each with status `planned` → `done` / `skipped` and an actual date when completed.
- Session list shows progress (instances done / total); deleting a type cascades to its sessions, deleting a session removes its instances.

### 3.8 To-Do list and Calendar (`/user/todo/list`, `/user/todo/calendar`)
- **To-do list** = the agenda: every *planned* treatment instance across all apiaries, sorted by date, with overdue items flagged in red and an apiary badge. Ticking an item marks the dose done (and refreshes the notification bell). Optional filter per apiary.
- **Calendar**: month view of inspections per hive; clicking an event opens that inspection.

### 3.9 Financials (`/user/financial`)
- **Cost categories**: name, description, type = *income* or *outcome* (e.g. jars, feeding, tools, honey, pollen).
- **Costs**: date, name, category, amount. Full CRUD in tables.
- Charts (last 12 months): **monthly income vs outgoing** bar/line chart, **yearly totals**, **income by category pie**, **outgoing by category pie**.
- Site copy also promises filtered financial reports/exports **[unconfirmed — no export endpoint exists yet]**.

### 3.10 AI Assistant (`/user/ai-chat`, `/user/ai-chat/:id`)
- Conversational assistant over the user's own hive data. Sidebar of past conversations, message thread, example prompts, optimistic sending, up to 4,000 characters per message.
- Answers general beekeeping questions directly; for questions about a specific hive it **runs the Rules Engine diagnosis** and/or **fetches recent trends** through tools and never invents recommendations that the tools did not return (see §5.3).
- Conversations are persisted and can be deleted (soft-delete).

### 3.11 Weather (inside apiary view)
- 7-day forecast plus today's hourly table for the apiary's coordinates: temperature, humidity, wind speed/gust/direction, rain probability and mm, UV index, cloud cover, pressure, sunrise/sunset. Powered by **Tomorrow.io**, proxied and cached (10 min) by the backend so the key stays server-side. Shows "Set apiary coordinates to enable weather" when an apiary has none.

### 3.12 Notifications (header bell)
- Generated daily at 08:00 by the backend for treatments: **"Overdue: {treatment}"** for planned doses past their date and **"Upcoming: {treatment}"** for doses due within 7 days ("Due today / in N days"). Idempotent; stale notifications are removed when a dose is completed.
- Unread badge (99+ cap), mark one / mark all as read.

### 3.13 Profile (`/user/profile`)
- Account card (initials, name, "beekeeper · country"), details (name, surname, country, email read-only, unit, show-hints), **change password** dialog (current password only if the account has one — Google-only accounts do not).
- **Two-factor authentication (TOTP)**: setup shows a QR code for an authenticator app, confirmation, **backup codes** with regeneration, disable.

---

## 4. Accounts, sign-in and plans

### 4.1 Beekeeper accounts (`/auth/…`)
- **Register** with name, surname, email, strong password (strength rules enforced) and optional country (used for default map/weather coordinates). **Email confirmation** is required before login; confirmation can be resent.
- **Sign in with Google** on both web and mobile (Google Identity / native account picker). A Google-only account has no password; a first-time Google user is asked to complete their profile (country) or skip.
- **Login** with brute-force protection (failed-login counter, temporary lock with "retry after N minutes"), suspended/banned status enforcement.
- **2FA** login step when enabled (6-digit code or backup code). The mobile app does not yet support 2FA sign-in.
- **Forgot / reset password** via emailed token (mobile points users to the website for this).
- **Logout** revokes the token.

### 4.2 Plans (as displayed on the site — all prices/limits **[unconfirmed]**)

| Plan | Price | For | Includes |
|---|---|---|---|
| **Free** | €0 forever | One apiary, a beekeeper starting out | 1 apiary, up to 10 hives · voice inspections and harvest · offline recording · data exportable at any time |
| **Pro** | €9 / month | The working beekeeper, one to twenty apiaries | Unlimited apiaries and hives · treatment schedules and reminders · financial tracking by category · weather per apiary · QR labels for every hive |
| **Enterprise** | Talk to us | Cooperatives and operations with staff | Everything in Pro · several users on one operation · per-user roles and permissions · bulk import of existing records · support with setup |

Stated plan policies: change plan any time from the profile; downgrading never deletes records (apiaries over the limit become read-only); all data exportable on every plan; monthly billing, cancel at month end; **coupons** apply at checkout. The backend stores `plan` (free / pro / enterprise) and `plan_expires_at` per user and admin-managed coupons (percentage or free period in days/months, max uses, expiry). **No payment gateway or plan-limit enforcement exists in the code yet.**

---

## 5. The intelligence layer (backend)

### 5.1 Rules Engine — inspection diagnosis
Evaluates a single inspection against **configurable rules stored in the database** and returns a structured diagnosis: mode (`normal` / `survival`), risks present, recommended actions, forbidden actions, bilingual reasoning (EN/EL) and a confidence score. Every evaluation is logged with its input snapshot.

- Rules have conditions (AND within a group, OR between groups), a priority, a category (`hard`, `disease`, `structural`, `seasonal`, `optimization`) and links to a **risk catalog** and an **action catalog**. New rules need no code changes.
- When several rules fire, an **effective priority** = base priority + boosts from recently detected trends decides the winner (high/critical trends boost every rule).
- **Seeded rules (25):** Winter Starvation Emergency · Queenless Colony (critical) · Varroa Detected — Treatment Required · Swarm Cells Detected · Healthy Hive — Routine Check · American Foulbrood Detected · European Foulbrood Detected · Severe Colony Collapse (Summer) · Multiple Disease Co-infection · Varroa with Weak Population · Varroa Winter Treatment (Broodless) · Varroa Spring Treatment (Pre-Flow) · Varroa Pre-Winter Critical Treatment · Varroa Post-Harvest Treatment · Nosema Infection Detected · Suspected Viral Infection · Old Queen — Replacement Needed · Drone-Laying Queen Suspected · Abnormally Low Brood in Strong Colony · Weak Colony in Summer · Brood–Population Imbalance · Honey-Bound Brood Nest · Pre-Winter Feeding — Critical Window · Fall Preparation Routine · Spring Buildup — Stimulation Required.
- **Risk catalog (16):** colony starvation, winter colony loss, high varroa infestation, AFB suspected, EFB suspected, nosema infection, queenless colony, queen failure, imminent swarming, colony collapse, weak colony, risk of absconding, hive overheating, robbing risk, regulatory notification required, viral infection suspected — each with a severity (medium / high / critical).
- **Action catalog (32):** emergency fondant feeding, sugar syrup feeding, pollen substitute feeding, oxalic / thymol / formic acid varroa treatment, report to veterinary authorities, isolate hive, destroy hive (regulatory), minimize disturbance, full inspection, continue monitoring, verify queen presence, add super, remove queen cells, split hive, unite with strong hive, introduce new queen, add brood frame, reduce hive space, insulate for winter, provide water, provide shade, reduce entrance, follow-up inspection in 3 / 7 days, consult expert, perform varroa count, apply nosema treatment, replace old combs, harvest honey, install/check queen excluder.

### 5.2 Trend Engine — multi-inspection patterns
Analyses a hive's inspection history over a look-back window (default 60 days, minimum 3–4 inspections) and persists detected trends with severity, direction, confidence, data points, and an insight in English and Greek. Detectors:

| Trend | Direction |
|---|---|
| Population decline | negative |
| Chronic varroa | negative |
| Rapid growth (spring) | positive |
| Brood disruption (non-winter) | negative |
| Treatment failure | negative |
| Colony recovery | positive |
| Queen instability | negative |

Trends feed the Rules Engine (re-ranking rules) and the AI assistant (`get_recent_trends` tool).

### 5.3 AI assistant (LLM layer)
- Runs on **Ollama (llama3.1:8b)** with a tool-calling loop (max 5 iterations). Tools: `run_diagnostic` (Rules Engine), `get_recent_trends` (Trend Engine), `explain_analysis` (format a diagnosis), `request_clarification` (ask for the hive when missing).
- System prompt rules: answer educational questions directly; for a specific hive always run the diagnostic first; never invent treatments; keep answers concise; keep multi-turn context (remembers which hive "it" refers to and reuses earlier tool results).
- History trimming to an 8k-token context, automatic conversation titles, every tool call audited (arguments, result, timing).
- **Quality judging** (admin-triggered, or automatic with `JUDGE_AUTO`): Claude Haiku 4.5 scores each assistant response on factual accuracy, tool correctness, refusal appropriateness, helpfulness, plus hallucination and safety flags; when a diagnostic was run, the Rules Engine output is injected as ground truth so fabricated risks/actions are caught. Daily cost cap, prompt caching, admin review notes and "flag for retraining".
- A dataset-generation pipeline (Claude API, topic seeds for diagnostic / educational / clarification / multi-turn / refusal cases) exists for training/evaluation data.

---

## 6. The mobile app — voice recording in the field

### 6.1 Purpose and scope
The app does one thing: **record inspections and harvests by voice, offline, and sync them to the account**. There are no charts, treatments or financials on the phone — those live on the web. Tagline on the welcome screen: *"Let the Record Begin"*.

### 6.2 Screens
- **Launcher** (splash) → **Onboarding** (4 slides: Welcome · Specify your bees' features · Manage your colonies · Enable microphone) → **Welcome / Welcome back** → **Login / Sign up** (email+password or Google).
- Tab bar: **Record · Commands · Sync · More**.
  - **Record**: choose mode (Inspection / Harvest), date and apiary; tap the microphone and say a beehive number; the screen switches to "Recording — Beehive N" and the field list (Population, Frames, Pollen, Nectar, Eggs, Closed Brood, Queen, Diseases) fills as phrases are recognised. "Finish and save" queues everything and uploads if there is signal ("Saved to your account" / "Saved on this device — N waiting for signal").
  - **Commands**: reference of what you can say, grouped (Frames, Pollen, Nectar, Eggs, Closed Brood, Queen, Diseases; Harvest: Honey).
  - **Sync (Pending sync / outbox)**: the queue of recordings waiting or failed (e.g. "No beehive named “23” in this apiary"), with Retry and Discard.
  - **More**: Help, Rate us, Voice training, Settings, Log out.
- **Voice training**: teach the recogniser how *you* say each key word (beehive, frames, pollen, honey, brood, varroa, nosema); a word is "learned" after four consistent recognitions, and the learned corrections are applied to every future transcript.
- **Settings**: beep after command, notifications, rate, share app. **Help**: 6 steps + tips. **Rate**: low scores open private feedback, high scores nudge to the store review.

### 6.3 Voice grammar (English)
| Say | Effect |
|---|---|
| "beehive number twelve" / "beehive number 12" | Selects the hive; everything after applies to it |
| "six frames of space" | Frame space (whole frames) |
| "five frames population" / "… of population" | Frames covered by bees |
| "two frames of pollen", "half a frame of pollen", "zero point four frames of pollen" | Pollen (fractions allowed; amounts **add up** as you call out frames) |
| "three frames of nectar" | Honey/nectar |
| "one frame of egg" | Open brood (eggs) |
| "two frames of closed brood" | Capped brood |
| "queen twenty twenty one" / "queen 2021" | Queen year |
| "queen seen", "queen cells", "queenless" / "no queen" | Queen status flags |
| "varroa detected", "nosema detected", "american foulbrood detected", "european foulbrood detected" | Disease flags |
| Harvest mode: "seven kilos honey", "zero point five kilo honey" | Adds kilos of honey |

Recognition robustness: known mishearings are corrected automatically ("behave/behind" → beehive, "flames" → frames, "Poland" → pollen, "brewed/brute" → brood, …), all recogniser candidates are tried and the first that parses wins, and anything that does not parse is reported as "not understood" rather than recorded as zero.

### 6.4 Offline-first sync
- Every draft is written to device storage on each change, so a dead battery or a crash costs nothing.
- Drafts are queued, uploaded only when the network is available, and **removed only after the server confirms** them. Failed uploads stay in the queue with the reason.
- Hive numbers are resolved against the apiary's hive names at sync time.
- Logging out keeps unsynced recordings on the device.

---

## 7. Admin panel (staff only, `/admin/…`)

Separate login (`/admin/login`) with its own employee accounts and optional 2FA. Role-gated navigation:

| Role | Can |
|---|---|
| support | View dashboard stats and users (read-only) |
| moderator | + change user status (suspend indefinitely or until a date, ban, reactivate), force-confirm emails, Moderation page (placeholder) |
| admin | + change user plan, reset user password, delete users, manage employees, manage coupons, judge AI responses |
| superadmin | + Raw data browser (direct CRUD on users, employees, apiaries, beehives, queens, beehive groups, records, costs, cost categories, coupons; revoke API tokens) |

- **Dashboard**: totals of users (active / suspended / banned / new this month / by plan), employees, apiaries, beehives, records.
- **Users**: server-side search, status and plan filters, status badges.
- **Employees**: CRUD with roles.
- **Coupons**: code, type (percentage / free period in days or months), max uses, expiry, active toggle, usage count.
- **AI Responses**: list un-judged assistant replies, run the judge, view the rubric (scores, flags, reasoning).

---

## 8. Public website map (`beehivemind.tech`)

| Route | Page | Existing meta description |
|---|---|---|
| `/` | Home | The platform that gives you full control of your hives. Track inspections, production, and colony health all in one place. |
| `/features` | Features | Discover all BeehiveMind features: hive inspections, production tracking, colony health monitoring, and much more. |
| `/app` | The App | Discover the BeehiveMind app and how it can simplify your daily apiary management. |
| `/inspections` | Hive Inspections | Record and track hive inspections. Monitor the health of your colonies with BeehiveMind. |
| `/apiariesandbeehives` | Apiaries & Beehives | Organize your apiaries and beehives. Track each colony individually with BeehiveMind. |
| `/harvestandfeeding` | Harvest & Feeding | Log honey harvests and colony feedings. Analyze the productivity of each hive with BeehiveMind. |
| `/financial` | Financial Management | Track your apiary income, expenses, and production costs. Complete financial overview in one place. |
| `/pricing` | Plans | Start free and stay free if one apiary is all you keep. Compare the Free, Pro and Enterprise plans. |
| `/help` | Help | How recording works: the ten voice phrases, three steps (open and start · say what you see · stop and sync) and troubleshooting. Links to the support portal (`beehivemind.freshdesk.com`). |
| `/about` | About | Who builds Beehivemind, why it records by voice. **Placeholder content.** Principles: *The records are yours · It works where the bees are · Free stays free.* |
| `/contact` | Contact | Contact form (**no backend endpoint yet**). |
| `/blog`, `/blog/:slug` | Blog | Four illustrative posts: *What closed brood tells you three weeks early* · *Why we built the app to be used without looking at it* · *Recurring treatments, and the doses people forget* · *Cost per hive is the number that changes decisions*. |
| `/privacy`, `/terms` | Legal | `noindex`; terms is a skeleton. |

**Existing focus keywords:** beekeeping, hive management, beekeeping app, beekeeping app features, hive inspection tracking, apiary management, beehive tracking, apiary financial management, beekeeping income tracking, honey harvest, bee feeding, honey production, hive inspections, colony health monitoring, beekeeping software pricing, beehive management plans, BeehiveMind help, user guide.

**Recurring site messaging worth reusing:** "Turn inspections into knowledge" · "Inspect without inspection checklists" · "Throw away the beekeeping inspection spreadsheets" · "Everything you recorded, in one row" · "The app is where the recording happens — free on both stores, and it works without signal" · "Learn ten phrases and you never touch the screen during an inspection."

**Figures on the site that are placeholders [unconfirmed]:** "1.000+ beekeepers", "18.000+ hives managed", "260.000+ inspections recorded", "10.000+ social followers", "3 years online", "founded 2019", "6 people", "24 countries"; the Google Play review quote; App Store link (`apps.apple.com/app/beehivemind`, no iOS build exists yet).

---

## 9. Feature checklist (quick reference for page generation)

**Field recording (mobile)**
- Voice-driven inspection recording, hands-free, English commands
- Voice-driven harvest recording (kilos of honey)
- Offline recording with automatic sync when signal returns
- Pending-sync queue with retry/discard and failure reasons
- Personal voice training for jargon words
- Voice command reference in-app
- Google sign-in, email/password sign-in

**Hive management (web)**
- Apiaries with GPS pin on Google Maps, map of all apiaries
- Bulk hive creation, inline rename, queen year, per-hive QR label
- Beehive groups and queen breeds (API)
- Per-apiary dashboard with weather, hives, pending to-dos, recent inspections, treatments

**Records (web)**
- Inspections: 14 readings per visit, edit/delete, filter by apiary/hive, one per hive per day
- Feeding: type, food, quantity, unit; apiary-wide bulk feeding
- Harvest: honey/pollen/royal jelly/propolis with units; apiary-level harvest split across hives
- Calendar of inspections

**Planning**
- Treatment types with interval and repetitions
- Treatment sessions generating dated doses per hive
- To-do list of planned/overdue doses; mark done
- Daily notifications for overdue and upcoming treatments

**Analytics**
- Dashboard charts of inspection averages (user / apiary / hive)
- Disease-detection summary
- Financial charts: monthly income vs outgoing, yearly totals, category pies

**Intelligence**
- Rules Engine diagnosis per inspection (25 rules, 16 risks, 32 actions, EN/EL reasoning)
- Trend Engine (7 multi-inspection detectors)
- AI assistant with tool-grounded answers and conversation history
- AI answer quality judging (staff)

**Account & security**
- Email confirmation, password reset, Google sign-in
- Two-factor authentication with backup codes
- Brute-force lockout, rate-limited auth, httpOnly cookies on web, bearer tokens on mobile
- Plans: Free / Pro / Enterprise; coupons (admin)

**Staff tooling**
- Admin dashboard, user management (suspend/ban/plan/reset/delete), employees, coupons, AI response judging, raw data browser

---

## 10. Gaps and caveats for content writers

- **Language:** all product UI and site copy are English; the Rules/Trend engines also produce Greek reasoning/insights, but the apps do not display Greek yet.
- **iOS:** advertised on the site, not built. Android is the shipping platform.
- **Payments:** plans and coupons are stored and displayed, but there is no checkout or enforcement of plan limits in code.
- **Data export:** promised on the site, no export endpoint exists.
- **Contact form:** UI exists, no backend endpoint.
- **Mobile 2FA and password reset:** handled on the website only.
- **Moderation page:** placeholder.
- **All statistics, prices, dates and testimonials on the public site are placeholders** until confirmed by the team.
