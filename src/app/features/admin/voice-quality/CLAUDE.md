# Admin · Voice Quality — Claude Guide

> ⚠️ **Admin zone uses a lighter pattern than the user zone** — see [Admin conventions](../user-management/CLAUDE.md#admin-zone-conventions).

## Purpose
How well the phone app's voice recording (Record round, the on-device
recognizer) is doing in the field: how often a phrase is not understood, how
often the app has to ask for the beehive again, how often it falls back to
Google's recognizer and why, how fast it answers, and which phones struggle.
**Counts only** — the API stores no audio and no speech text; the page says so
under its title.

## Route
`/admin/voice-quality` → `voice-quality.ts` (`VoiceQualityComponent`), under
`employeeGuard` + `employeeRoleGuard('admin')`. Nav link in `admin-layout.html`
(microphone, admin+, after AI Responses).

## State & Data
- **No store, no domain service** — one call through `RequestService`:
  `GET admin/voice-quality?from=YYYY-MM-DD&to=YYYY-MM-DD[&build=][&device_model=]`
  → `{ summary, daily[], devices[], self_test_failures[], fallback_reasons, builds[], device_models[] }`.
  `build` and `device_model` are sent only when chosen.
- Local signals: `from`, `to` (default the last 30 days), `build`, `deviceModel`,
  `data`, `loading`, `error`. Every filter change calls `load()`, which drops the
  request still in flight.
- The range is clamped to the **90 days** the API keeps raw counts for (`MAX_DAYS_BACK`),
  never past today, and `from ≤ to`; a hint under the filter bar says why.
- The selects list `builds` / `device_models` from the last response, plus the
  current choice when the new range no longer has it.

## Formatting (exported, unit-tested in `voice-quality.spec.ts`)
- Rates are 0..1 or null → `formatRate`: "4.2%", "—" for null.
- Latencies in ms → `formatLatency`: "0.9 s". RTF → two decimals; RAM → GB.

## Layout
Filters · KPI cards (`.admin-stats`; Rounds carries the one accent dot, Response
time shows p50 with p90 under it) · **Problems per day** (line, percent axis) ·
**Rounds per day** (bars — its own chart, never a second y-axis) · **Why it fell
back to Google** (three figures, not a pie) · **Phones** table (order as returned:
worst first) · **Self-test failures** table. No rounds in range → one empty-state
card instead of everything below the filters.

## Patterns / gotchas
- **One line per metric, not per build.** `daily` is per day *and* build;
  `dailyByDate()` folds the builds into one point per day, each rate weighted by
  that build's rounds, and fills every day of the range (no rounds → a gap in the
  lines, a 0 bar). Three metrics × several builds was too many lines to read; to
  compare builds, pick one in the **App build** select. Chosen over per-build series.
- `DataTable` tracks rows by `id`; the rows get their index as `id`.
- No page CSS: global classes only. Audit mock: `audit/mocks.mjs` → `VOICE_QUALITY`.

## Related
[Root](../../../../CLAUDE.md) · [AI Responses](../ai-responses/CLAUDE.md) ·
The phone app's voice recording lives in `beehivemind-Mobile`.
