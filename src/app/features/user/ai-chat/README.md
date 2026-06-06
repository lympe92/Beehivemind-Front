# AI Chat Feature

Conversational AI assistant for BeehiveMind. Connects to the Laravel backend's `/api/ai/*` endpoints.

## Routes

| URL | Behaviour |
|-----|-----------|
| `/user/ai-chat` | Start a new conversation |
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

Store slice: `src/app/store/ai-chat/`  
Service:     `src/app/core/services/ai-chat.service.ts`  
Types:       `src/app/core/models/ai-chat.model.ts`

## How to test

1. Start the Laravel backend (`php artisan serve`) — must be running on `http://127.0.0.1:8000`.
2. Start the Angular dev server (`ng serve`).
3. Log in and navigate to `/user/ai-chat`.
4. Type a message and press **Enter** (or click Send).
5. Wait up to 30 seconds — the AI runs a tool loop before responding.
6. After the first reply the URL updates to `/user/ai-chat/{id}` so you can refresh and keep your conversation.
7. Past conversations appear in the left sidebar. Click one to reload its history.
8. Hover a conversation item and click **×** to delete it (native `confirm()` prompt).

## Key behaviours

- **HTTP 201** on `POST /api/ai/chat` — handled correctly (Angular `HttpClient` accepts all 2xx).
- **Optimistic UI** — user message appears immediately; rolled back (input restored) on error.
- **Filtering** — `tool` and `system` role messages are hidden from the UI.
- **Send / newline** — Enter sends, Shift+Enter inserts a newline.
- **Character counter** — turns amber above 3 500 characters; send is disabled above 4 000.
- **Auth** — the existing `authInterceptor` attaches `Authorization: Bearer <token>` automatically.