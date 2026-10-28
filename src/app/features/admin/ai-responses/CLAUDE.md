# Admin · AI Responses — Claude Guide

> ⚠️ **Admin zone uses a lighter pattern than the user zone** — see [Admin conventions](../user-management/CLAUDE.md#admin-zone-conventions).

## Purpose
Quality review of the assistant's replies. Two tabs: **Awaiting judgment** —
replies nobody has judged, with a **Judge** button that runs the Claude Haiku
judge — and **Judged** — every judged reply, filterable (low score,
hallucination, safety, not reviewed, flagged for retraining) and sortable.
Either opens the detail: the rubric, the automatic checks, the admin's own
notes and "flag for retraining", and the whole conversation the reply sits in.
(Backend: `BEEHIVEMIND-Laravel/api/BeehiveMind/AI/src/Services/Judging/`.)

## Route
`/admin/ai-responses` → `ai-responses.ts` (`AiResponsesComponent`), under
`employeeGuard` + `employeeRoleGuard('admin')` — and the API requires the admin
role too. Nav link in `admin-layout.html` (🤖, admin+).

## State & Data
- **No store, no domain service** — calls `RequestService` directly:
  - `GET admin/ai-responses/pending?page` → un-judged replies (`{ data, meta }`)
  - `POST admin/ai-responses/{messageId}/judge` → queues the judge: 200 the existing judgment, 201 the judgment (sync queue), 202 `{ message_id, status: 'queued' }`
  - `GET admin/ai-responses/{messageId}/judgment` → `{ status: done | queued | failed | none, judgment?, error? }`, polled every 2 s for up to 90 s after a 202
  - `GET admin/ai-responses?page&flag&sort` → judged replies
  - `GET admin/ai-responses/{id}` → the judgment with the conversation's messages
  - `PATCH admin/ai-responses/{id}/admin-review` `{ admin_notes, flagged_for_retraining }`
- Local `signal`s per tab (`pending*`, `judged*`), `judgingId` (single-flight), and the detail: `selected`, `conversation`, `notesDraft`, `flagDraft`, `saving`.
- Both lists use the shared `DataTableComponent` with server-side pagination.

## Patterns / gotchas
- **Judge once:** the backend returns the existing judgment if one exists. A judged row leaves the pending list and the judged tab reloads next time it is opened.
- **The judge is queued, not awaited:** `judge()` polls the status endpoint while `judgingId` holds the row (single-flight); `failed` shows the API's reason (the daily cost cap, the judge giving up), and after 90 s the page says the result will appear in the Judged tab.
- The rubric has no tool score any more (the chat has no tools): factual accuracy, refusal appropriateness (null when no refusal was needed), helpfulness, the two flags, the composite (1.0 whenever a flag is set, else the mean of accuracy and helpfulness). `detector_flags` are the deterministic checks (unknown treatment, frame count out of range, reading not in the hive context, tool-like prose) — hints shown beside the verdict; only tool-like prose sets the hallucination flag.
- The conversation in the detail reuses the chat's `.app-chat__log` / `.app-msg` classes.

## Related
[Root](../../../../CLAUDE.md) · [AI Chat (user)](../../user/ai-chat/CLAUDE.md) ·
Backend judging: `BEEHIVEMIND-Laravel/api/BeehiveMind/AI/src/Services/Judging/README.md`.
