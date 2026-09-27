# AI Chat Feature

A general beekeeping assistant on the API's local Ollama model. Connects to the Laravel backend's `/api/ai/*` endpoints. It has no tools and no access to the team's data; when opened from a hive's diagnosis, the API puts that hive's data in front of the model.

## Routes

| URL | Behaviour |
|-----|-----------|
| `/user/ai-chat` | Start a new conversation |
| `/user/ai-chat?beehive=12` | Start one about hive 12 (the diagnosis dialog's "Ask the assistant") |
| `/user/ai-chat/:id` | Load an existing conversation |

The sidebar nav entry "AI Assistant" links to `/user/ai-chat`.

## Files

```
ai-chat/
├── ai-chat-page/          # Main page component (sidebar + chat area)
├── chat-message/          # Single message bubble (user / assistant)
├── conversation-list/     # Sidebar list of past conversations
└── README.md
```

Store slice: `src/app/store/ai-chat/` (registered on the route)
Service:     `src/app/core/services/ai-chat.service.ts`
Types:       `src/app/core/models/ai-chat.model.ts`

## How to test

1. Start the Laravel backend (`php artisan serve`) with Ollama running, and — unless `QUEUE_CONNECTION=sync` — a worker: `php artisan queue:work`.
2. Start the Angular dev server (`npm start`).
3. Log in and navigate to `/user/ai-chat`.
4. Type a question and press **Enter** (or click Send).
5. The question appears at once; the reply is polled and appears when the model is done (up to a minute).
6. After the first reply the URL updates to `/user/ai-chat/{id}` so you can refresh and keep your conversation. Opened from a hive, the "About Hive …" chip stays on the conversation; only "Ask without it" goes.
7. Past conversations appear in the left sidebar. Click one to reload its history.
8. Hover a conversation item and click **×** to delete it (confirm dialog).
9. On a free account the line under the composer counts down from 10 a month; at 0 the composer locks with an upgrade callout.

## Key behaviours

- **HTTP 202** on `POST /api/ai/chat` — the reply is pending; `GET /api/ai/messages/{id}` is polled until `done` or `failed`.
- **Optimistic UI** — the question appears immediately; the input is restored only if the send itself failed.
- **Send / newline** — Enter sends, Shift+Enter inserts a newline.
- **Character counter** — turns amber above 3 500 characters; send is disabled above 4 000.
- **Auth** — the HttpOnly session cookie, like every other request (`withCredentials`).
