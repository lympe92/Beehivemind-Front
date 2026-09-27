import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AiChatService } from './ai-chat.service';

/**
 * Whether the assistant takes messages on this server (`GET ai/status`, the
 * API's `AI_CHAT_ENABLED`). Asked once per session by the user layout; the
 * sidebar link, the diagnosis dialog's "Ask the assistant" and the chat page
 * all read the same answer. Unknown counts as off, so nothing flashes and
 * then vanishes.
 */
@Injectable({ providedIn: 'root' })
export class AiAssistantStatusService {
  private chat      = inject(AiChatService);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private asked     = false;

  /** `null` until the API has answered. */
  readonly state = signal<boolean | null>(null);

  /** On, once known. */
  readonly enabled = () => this.state() === true;

  load(): void {
    if (this.asked || !this.isBrowser) return;
    this.asked = true;
    this.chat.getStatus().subscribe({
      next:  enabled => this.state.set(enabled),
      error: () => this.state.set(false),
    });
  }

  /** The API said 503: remember it without another request. */
  markUnavailable(): void {
    this.asked = true;
    this.state.set(false);
  }
}
