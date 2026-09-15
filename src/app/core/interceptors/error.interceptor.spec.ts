import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Store } from '@ngrx/store';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../shared/components/ui/toast/toast.service';
import { AuthActions } from '../../store/auth/auth.actions';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  const store = { dispatch: vi.fn() };
  const toast = { error: vi.fn() };
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    store.dispatch.mockClear();
    toast.error.mockClear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: Store, useValue: store },
        { provide: ToastService, useValue: toast },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  const fail = (path: string, status: number, body: object = { success: false }) => {
    http.post(environment.apiUrl + path, {}).subscribe({ error: () => {} });
    backend.expectOne(environment.apiUrl + path).flush(body, { status, statusText: 'Error' });
  };

  it('signs the user out when a request finds the session expired', () => {
    fail('apiaries', 401);

    expect(store.dispatch).toHaveBeenCalledWith(AuthActions.logout());
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it('does not answer a 401 from the logout request with another logout', () => {
    fail('user/logout', 401);

    expect(store.dispatch).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('sends a removed account to the login notice instead of logging out', () => {
    fail('apiaries', 401, { success: false, code: 'account_removed' });

    expect(store.dispatch).toHaveBeenCalledWith(AuthActions.accountRemoved());
    expect(toast.error).not.toHaveBeenCalled();
  });
});
