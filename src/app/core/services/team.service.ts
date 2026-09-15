import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequestService } from './request.service';
import { ApiResponse } from '../models/api-response.model';
import { InvitationLookup, Team, TeamInvitation, TeamMember } from '../models/team.model';
import { User } from '../../store/auth/auth.state';
import { inlineErrors } from '../interceptors/error.interceptor';

/** Raw team payloads as returned by the API (snake_case). */
interface TeamMemberPayload {
  id: number;
  name: string;
  surname: string;
  email: string;
  joined_at: string | null;
}

interface TeamInvitationPayload {
  id: number;
  email: string;
  sent_at: string;
  expires_at: string;
  expired: boolean;
}

interface TeamPayload {
  role: Team['role'];
  owner: Team['owner'];
  members?: TeamMemberPayload[];
  invitations?: TeamInvitationPayload[];
}

interface InvitationLookupPayload {
  state: InvitationLookup['state'];
  owner_name: string;
  email: string | null;
}

@Injectable({ providedIn: 'root' })
export class TeamService {
  private request = inject(RequestService);

  getTeam(): Observable<ApiResponse<Team>> {
    return this.request.getRequest<TeamPayload>('team').pipe(
      map(res => ({ ...res, data: this.fromApi(res.data) }))
    );
  }

  /**
   * Refusals come back as a 422 whose `meta.code` says which — the dialog shows
   * them as field errors, so the global toast stays out of it.
   */
  invite(email: string): Observable<ApiResponse<TeamInvitation>> {
    return this.request.postRequest<TeamInvitationPayload>('team/invitations', { email }, { context: inlineErrors() }).pipe(
      map(res => ({ ...res, data: this.invitationFromApi(res.data) }))
    );
  }

  resendInvitation(id: number): Observable<ApiResponse<TeamInvitation>> {
    return this.request.postRequest<TeamInvitationPayload>(`team/invitations/${id}/resend`).pipe(
      map(res => ({ ...res, data: this.invitationFromApi(res.data) }))
    );
  }

  cancelInvitation(id: number): Observable<ApiResponse<void>> {
    return this.request.deleteRequest<void>(`team/invitations/${id}`);
  }

  /** Deletes the editor's account. What they added stays. */
  removeMember(id: number): Observable<ApiResponse<void>> {
    return this.request.deleteRequest<void>(`team/members/${id}`);
  }

  dismissWelcome(): Observable<ApiResponse<void>> {
    return this.request.postRequest<void>('team/welcome/dismiss');
  }

  // ── The invited person, before they have an account ─────────────────────

  lookupInvitation(token: string): Observable<ApiResponse<InvitationLookup>> {
    return this.request.getRequest<InvitationLookupPayload>(`team/invite/${encodeURIComponent(token)}`).pipe(
      map(res => ({ ...res, data: { state: res.data.state, ownerName: res.data.owner_name, email: res.data.email } }))
    );
  }

  acceptInvitation(token: string, data: {
    name: string;
    surname: string;
    password: string;
    country?: string | null;
    country_latitude?: number | null;
    country_longitude?: number | null;
  }): Observable<ApiResponse<{ token: string; user: User }>> {
    return this.request.postRequest<{ token: string; user: User }>(`team/invite/${encodeURIComponent(token)}/accept`, data);
  }

  private fromApi(t: TeamPayload): Team {
    return {
      role:        t.role,
      owner:       t.owner,
      members:     (t.members ?? []).map(m => this.memberFromApi(m)),
      invitations: (t.invitations ?? []).map(i => this.invitationFromApi(i)),
    };
  }

  private memberFromApi(m: TeamMemberPayload): TeamMember {
    return { id: m.id, name: m.name, surname: m.surname, email: m.email, joinedAt: m.joined_at };
  }

  private invitationFromApi(i: TeamInvitationPayload): TeamInvitation {
    return { id: i.id, email: i.email, sentAt: i.sent_at, expiresAt: i.expires_at, expired: i.expired };
  }
}
