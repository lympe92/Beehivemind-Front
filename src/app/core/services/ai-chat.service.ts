import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { RequestService } from './request.service';
import {
  Conversation,
  SendMessageRequest,
  SendMessageResponseData,
} from '../models/ai-chat.model';

@Injectable({ providedIn: 'root' })
export class AiChatService {
  private request = inject(RequestService);
  private http    = inject(HttpClient);

  sendMessage(payload: SendMessageRequest): Observable<SendMessageResponseData> {
    return this.request
      .postRequest<SendMessageResponseData>('ai/chat', payload)
      .pipe(map(res => res.data));
  }

  listConversations(): Observable<Conversation[]> {
    return this.request
      .getRequest<Conversation[]>('ai/conversations')
      .pipe(map(res => res.data));
  }

  getConversation(id: number): Observable<Conversation> {
    return this.request
      .getRequest<Conversation>(`ai/conversations/${id}`)
      .pipe(map(res => res.data));
  }

  // 204 No Content — use HttpClient directly to avoid ApiResponse parse error
  deleteConversation(id: number): Observable<void> {
    return this.http
      .delete<null>(environment.apiUrl + `ai/conversations/${id}`)
      .pipe(map(() => void 0));
  }
}
