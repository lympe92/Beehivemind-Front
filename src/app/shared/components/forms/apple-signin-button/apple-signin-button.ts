import { ChangeDetectionStrategy, Component, inject, input, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../../../store/auth/auth.actions';
import { environment } from '../../../../../environments/environment';

/** Apple's JS, version 1, English: the button's own text is ours, so the locale only names Apple's popup. */
const APPLE_JS = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';

interface AppleSignInResponse {
  authorization: { id_token: string; code: string; state?: string };
  /** Only on the first sign-in to this Services ID, never again. */
  user?: { name?: { firstName?: string; lastName?: string }; email?: string };
}

interface AppleIdAuth {
  init(config: { clientId: string; scope: string; redirectURI: string; state?: string; usePopup: boolean }): void;
  signIn(): Promise<AppleSignInResponse>;
}

/**
 * Sign in with Apple on the website, the counterpart of the Google button:
 * Apple's JS opens Apple's page in a popup and hands back the identity
 * token (and, the first time, the name), which goes to user/auth/apple like
 * the apps' do. The Services ID is the one the Android app uses too;
 * Apple wants the page's own URL registered as its return URL even in popup
 * mode, where it is never navigated to.
 *
 * Black with the white mark, in Apple's own wording, because that is Apple's
 * specification (Human Interface Guidelines, "Sign in with Apple").
 */
@Component({
  selector: 'app-apple-signin-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-apple-btn">
      <button type="button" class="auth-apple-button" [disabled]="busy()" (click)="signIn()">
        <svg width="16" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#ffffff" d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" />
        </svg>
        {{ label() }}
      </button>
    </div>
  `,
})
export class AppleSignInButtonComponent {
  private store = inject(Store);
  private platformId = inject(PLATFORM_ID);

  /** "Sign in with Apple" or "Sign up with Apple". */
  readonly label = input('Sign in with Apple');
  readonly busy = signal(false);

  private script?: Promise<AppleIdAuth>;

  async signIn(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || this.busy()) return;
    this.busy.set(true);
    try {
      const auth = await this.load();
      auth.init({
        clientId: environment.appleServicesId,
        scope: 'name email',
        redirectURI: `${environment.appUrl}/auth/login`,
        usePopup: true,
      });
      const res = await auth.signIn();
      this.store.dispatch(AuthActions.loginWithApple({
        credential: res.authorization.id_token,
        givenName: res.user?.name?.firstName ?? '',
        familyName: res.user?.name?.lastName ?? '',
      }));
    } catch (err) {
      // Closing Apple's popup rejects with "popup_closed_by_user": no error to show.
      const message = (err as { error?: string })?.error ?? String(err);
      if (!/popup_closed_by_user|user_cancelled/i.test(message)) {
        this.store.dispatch(AuthActions.loginFailure({ error: 'Apple sign-in failed' }));
      }
    } finally {
      this.busy.set(false);
    }
  }

  private load(): Promise<AppleIdAuth> {
    const ready = () => (window as unknown as { AppleID?: { auth?: AppleIdAuth } }).AppleID?.auth;
    if (ready()) return Promise.resolve(ready()!);
    this.script ??= new Promise<AppleIdAuth>((resolve, reject) => {
      const tag = document.createElement('script');
      tag.src = APPLE_JS;
      tag.async = true;
      tag.onload = () => (ready() ? resolve(ready()!) : reject(new Error('Apple sign-in did not load')));
      tag.onerror = () => reject(new Error('Apple sign-in did not load'));
      document.head.appendChild(tag);
    });
    return this.script;
  }
}
