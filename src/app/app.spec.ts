import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { GoogleTagManagerService } from './core/services/google-tag-manager.service';
import { ConsentService } from './core/services/consent.service';

/**
 * The root shell: the router outlet, the one toast stack, and the consent
 * banner behind `@defer`. The measurement stack is stubbed — it reads the
 * store, the router and the network, none of which this shell test is about.
 */
describe('App', () => {
  const tagManager = { init: vi.fn() };
  const showBanner = signal(false);

  beforeEach(async () => {
    tagManager.init.mockClear();
    showBanner.set(false);

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: GoogleTagManagerService, useValue: tagManager },
        { provide: ConsentService, useValue: { showBanner } },
      ],
    }).compileComponents();
  });

  it('starts the measurement stack once', () => {
    TestBed.createComponent(App);
    expect(tagManager.init).toHaveBeenCalledTimes(1);
  });

  it('renders the router outlet and the toast stack', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('router-outlet')).not.toBeNull();
    expect(root.querySelector('app-toast')).not.toBeNull();
  });

  it('leaves the consent banner out for a visitor who is not asked', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('app-consent-banner')).toBeNull();
  });
});
