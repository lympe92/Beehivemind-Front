import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestService } from './request.service';
import { ApiResponse } from '../models/api-response.model';

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
  /** Honeypot. The form never shows it; a human leaves it empty. */
  website: string;
}

/** The public contact form. One endpoint, no store: nothing is displayed back. */
@Injectable({ providedIn: 'root' })
export class ContactService {
  private request = inject(RequestService);

  send(message: ContactMessage): Observable<ApiResponse<{ sent: boolean }>> {
    return this.request.postRequest<{ sent: boolean }>('contact', message);
  }
}
