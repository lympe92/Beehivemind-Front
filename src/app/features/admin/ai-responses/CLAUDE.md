# Admin · AI Responses — Claude Guide

> ⚠️ **Admin zone uses a lighter pattern than the user zone** — see [Admin conventions](../user-management/CLAUDE.md#admin-zone-conventions).

## Purpose
On-demand quality evaluation of AI assistant responses. The admin sees responses that have
not been judged yet and presses **Judge** to run the Claude Haiku judge, then views the
rubric result inline. (Backend judging engine lives in `BEEHIVEMIND-Laravel` under
`AI/src/Services/Judging/` — this page only triggers it.) Copy is English, per the design
system's English-only decision (it was Greek before the 2026-09 port).

## Route
`/admin/ai-responses` → `ai-responses.ts` (`AiResponsesComponent`), under
`employeeGuard` + `employeeRoleGuard('admin')`. Nav link in `admin-layout.html` (🤖, admin+).

## State & Data
- **No store, no domain service** — calls `RequestService` directly:
  - `GET admin/ai-responses/pending?page` → un-judged assistant messages (`{ data, meta }`)
  - `POST admin/ai-responses/{messageId}/judge` → runs the judge synchronously, returns the rubric
- Local `signal`s: `pending`, `loading`, `error`, `total`, `totalPages`, `page`,
  `judgingId` (row with spinner), `results` (message_id → rubric map), `selectedResult` (detail panel).
- Renders the list with the shared `DataTableComponent` (server-side pagination via `pageChange`).

## Patterns / gotchas
- **Judge once:** the backend returns the existing judgment if one exists; the UI keeps a
  `results` map so a judged row swaps its button for a score badge + **View**.
- **Synchronous judging:** the Haiku call takes a few seconds; `judgingId` disables all
  Judge buttons while one is in flight (single-flight).
- Result rubric (1–5 dims + `hallucination_flag` / `safety_flag` + `composite_score` +
  `reasoning`) is shown in a "Judgment" `<app-card>` above the table as an `.app-fields`
  grid; the composite score is `.app-badge--active` (> 2.5) or `--banned` (≤ 2.5), the two
  flags are `.app-bool` cells. Errors render as a dismissable error `<app-callout>`.

## Related
[Root](../../../../CLAUDE.md) · [AI Chat (user)](../../user/ai-chat/CLAUDE.md) ·
Backend judging: `BEEHIVEMIND-Laravel/api/BeehiveMind/AI/src/Services/Judging/README.md`.
