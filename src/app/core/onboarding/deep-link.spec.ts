import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clearedParams, onDeepLink, readDeepLink } from './deep-link';

describe('readDeepLink', () => {
  it('needs the first key; the others travel with it', () => {
    expect(readDeepLink(convertToParamMap({ add: '1', apiary: '4', page: '2' }), ['add', 'apiary'])).toEqual({ add: '1', apiary: '4' });
    expect(readDeepLink(convertToParamMap({ add: 'session' }), ['add', 'apiary'])).toEqual({ add: 'session' });
    expect(readDeepLink(convertToParamMap({ apiary: '4' }), ['add', 'apiary'])).toBeNull();
    expect(readDeepLink(convertToParamMap({}), ['add'])).toBeNull();
  });

  it('drops only its own keys from the URL', () => {
    expect(clearedParams(['add', 'apiary'])).toEqual({ add: null, apiary: null });
  });
});

describe('onDeepLink', () => {
  let params: BehaviorSubject<ParamMap>;
  let navigate: ReturnType<typeof vi.fn>;
  const route = {} as ActivatedRoute;

  beforeEach(() => {
    params = new BehaviorSubject(convertToParamMap({}));
    navigate = vi.fn().mockResolvedValue(true);
    Object.assign(route, { queryParamMap: params });
    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: { navigate } },
      ],
    });
  });

  it('takes the parameter off the URL at once and opens once the page is ready', () => {
    const ready = signal(false);
    const open = vi.fn();
    params.next(convertToParamMap({ add: '1', tab: 'x' }));
    TestBed.runInInjectionContext(() => onDeepLink(['add'], ready, open));

    // Replaced, not pushed, and every other parameter kept: a reload does not reopen the form.
    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: route, queryParams: { add: null }, queryParamsHandling: 'merge', replaceUrl: true,
    });
    TestBed.tick();
    expect(open).not.toHaveBeenCalled();

    ready.set(true);
    TestBed.tick();
    expect(open).toHaveBeenCalledOnce();
    expect(open).toHaveBeenCalledWith({ add: '1' });

    // The URL without the parameter, and a later change of readiness, open nothing more.
    params.next(convertToParamMap({ tab: 'x' }));
    ready.set(false);
    TestBed.tick();
    ready.set(true);
    TestBed.tick();
    expect(open).toHaveBeenCalledOnce();
  });

  it('does nothing without its parameter', () => {
    const open = vi.fn();
    TestBed.runInInjectionContext(() => onDeepLink(['add'], () => true, open));
    TestBed.tick();
    expect(open).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('reacts on a page already on screen, when a step points at it again', () => {
    const open = vi.fn();
    TestBed.runInInjectionContext(() => onDeepLink(['add'], () => true, open));
    params.next(convertToParamMap({ add: 'cost' }));
    TestBed.tick();
    expect(open).toHaveBeenCalledWith({ add: 'cost' });
  });
});
