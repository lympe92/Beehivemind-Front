/** An account is the owner of its team, or an editor in somebody else's. There is no third role. */
export type TeamRole = 'owner' | 'editor';

export interface TeamPerson {
  id: number;
  name: string;
  surname: string;
  email: string;
}

export interface TeamMember extends TeamPerson {
  /** ISO timestamp — accepting the invitation created the account. */
  joinedAt: string | null;
}

export interface TeamInvitation {
  id: number;
  email: string;
  sentAt: string;
  expiresAt: string;
  expired: boolean;
}

/**
 * The team as its reader may see it. An owner gets the members and the open
 * invitations; an editor only whose team it is — the members card is absent
 * for them, so the API sends nothing to fill it.
 */
export interface Team {
  role: TeamRole;
  owner: Pick<TeamPerson, 'name' | 'surname'> & Partial<Pick<TeamPerson, 'id' | 'email'>>;
  members: TeamMember[];
  invitations: TeamInvitation[];
}

/**
 * What the shell knows about the team from the signed-in user, without a
 * request of its own: the role, whose team it is, how many editors, and
 * whether the editor's one-time welcome is still due. Arrives on the user
 * object in snake_case, as the rest of it does.
 */
export interface UserTeamSummary {
  role: TeamRole;
  owner_name: string;
  member_count: number;
  show_welcome: boolean;
}

/** Why an address cannot be invited. Every one is about the address, so every one is a field error. */
export type InviteRefusalCode = 'self' | 'in_team' | 'already_invited' | 'has_account';

/** What `/auth/invite` resolves its token to before it renders. `signed-in` is a client check, not a token state. */
export type InviteState = 'valid' | 'google-mismatch' | 'expired' | 'invalid' | 'used' | 'signed-in';

export interface InvitationLookup {
  state: 'valid' | 'expired' | 'used';
  ownerName: string;
  email: string | null;
}

/** "Added by" on a record, cost or treatment session; null when there is nothing to say. */
export interface RecordAttribution {
  /** Null once the person's account is gone — then `former` is true. */
  name: string | null;
  former: boolean;
  /** Y-m-d. */
  at: string | null;
}

/** "Daniel Hart's team". A team has no name of its own. */
export function teamName(ownerName: string): string {
  return `${ownerName}'s team`;
}
