import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AnalyticsService } from './analytics.service';
import { ClarityService, isRecordablePath } from './clarity.service';
import { ConsentService } from './consent.service';

/**
 * The three promises Clarity is loaded under: consent first, never inside the
 * app, and only the funnel's events. `window.clarity` stays the queue function
 * throughout, since the script itself is never fetched here, so every call the
 * service makes can be read back from `clarity.q`.
 */
describe('ClarityService', () => {
  const analyticsAllowed = signal(false);
  const events = new Subject<unknown>();
  const employee = new BehaviorSubject(false);
  const mutable = environment as { clarityProjectId: string };

  const calls = (): unknown[][] => (window.clarity?.q ?? []) as unknown[][];
  const names = (): unknown[] => calls().map((call) => call[0]);
  const go = (path: string): void => {
    history.replaceState(null, '', path);
    events.next(new NavigationEnd(1, path, path));
  };
  const create = (): ClarityService => {
    const service = TestBed.inject(ClarityService);
    service.init(false);
    TestBed.tick();
    return service;
  };

  beforeEach(() => {
    mutable.clarityProjectId = 'testproject';
    analyticsAllowed.set(false);
    employee.next(false);
    delete window.clarity;
    history.replaceState(null, '', '/');

    TestBed.configureTestingModule({
      providers: [
        { provide: ConsentService, useValue: { analyticsAllowed } },
        { provide: AnalyticsService, useValue: { listen: vi.fn() } },
        { provide: Router, useValue: { events } },
        { provide: Store, useValue: { select: () => employee } },
      ],
    });
  });

  afterEach(() => {
    mutable.clarityProjectId = '';
    delete window.clarity;
    history.replaceState(null, '', '/');
  });

  it('records the public site, login and register, the app, and nothing else', () => {
    expect(
      ['/', '/pricing', '/blog/a-post', '/auth/login', '/auth/register', '/user', '/user/dashboard'].every(isRecordablePath),
    ).toBe(true);
    expect(
      ['/admin', '/admin/users', '/auth/invite', '/auth/reset-password', '/auth'].some(isRecordablePath),
    ).toBe(false);
  });

  it('does nothing before consent', () => {
    create();
    expect(window.clarity).toBeUndefined();
  });

  it('starts on consent, with analytics granted and advertising denied', () => {
    create();
    analyticsAllowed.set(true);
    TestBed.tick();

    expect(calls()[0]).toEqual(['consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' }]);
  });

  it('tells Clarity when consent is withdrawn, and stops', () => {
    analyticsAllowed.set(true);
    create();
    analyticsAllowed.set(false);
    TestBed.tick();

    expect(calls().slice(1)).toEqual([
      ['consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' }],
      ['consent', false],
      ['stop'],
    ]);
  });

  it('never starts on a visit that begins in the admin console', () => {
    analyticsAllowed.set(true);
    history.replaceState(null, '', '/admin/users');
    create();

    expect(window.clarity).toBeUndefined();
  });

  it('keeps recording into the app, stops at the admin console and resumes on the way out', () => {
    analyticsAllowed.set(true);
    create();
    go('/auth/login');
    go('/user/dashboard');
    expect(names()).not.toContain('stop');

    go('/admin/users');
    expect(names().at(-1)).toBe('stop');

    go('/pricing');
    expect(names().slice(-2)).toEqual(['start', 'consentv2']);
  });

  it('stops for a signed-in employee', () => {
    analyticsAllowed.set(true);
    create();
    employee.next(true);

    expect(names().at(-1)).toBe('stop');
  });

  it('reports the register form once per arrival', () => {
    analyticsAllowed.set(true);
    create();
    go('/auth/register');
    employee.next(false);

    expect(calls().filter((call) => call[1] === 'register_form_open')).toHaveLength(1);
  });

  it('forwards the funnel events and drops the rest', () => {
    analyticsAllowed.set(true);
    const service = create();
    service.forward('app_store_click', { store: 'google_play', page_path: '/app' });
    service.forward('sign_up', { method: 'email' });
    service.forward('cta_click', { cta_text: 'Get Started' });
    service.forward('page_view', { page_title: 'Home' });

    expect(calls().slice(1)).toEqual([
      ['set', 'store', 'google_play'],
      ['event', 'app_store_click'],
      ['set', 'sign_up_method', 'email'],
      ['event', 'sign_up'],
      ['event', 'cta_click'],
    ]);
  });

  it('forwards nothing while it is not recording', () => {
    const service = create();
    service.forward('sign_up', { method: 'email' });

    expect(window.clarity).toBeUndefined();
  });
});
