import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { environment } from '../../../environments/environment';
import { BeehiveService } from './beehive.service';
import { Beehive, beehiveLabel, beehiveTag, compareBeehives } from '../models/beehive.model';

describe('BeehiveService', () => {
  let service: BeehiveService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BeehiveService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reads the number and lists an apiary\'s hives in number order', () => {
    let result: Beehive[] = [];
    service.getBeehives().subscribe(res => (result = res.data));

    http.expectOne(environment.apiUrl + 'beehives').flush({
      success: true,
      data: [
        { id: 5, uuid: 'e', number: 10, apiary_id: 1, queen: null },
        { id: 9, uuid: 'i', number: 1, apiary_id: 2, queen: null },
        { id: 7, uuid: 'g', number: 2, apiary_id: 1, queen: { year: 2025 } },
      ],
    });

    expect(result.map(b => [b.apiaryId, b.number])).toEqual([[1, 2], [1, 10], [2, 1]]);
    expect(result[0]).toEqual({ id: 7, uuid: 'g', number: 2, apiaryId: 1, queen: { year: 2025 } });
  });

  it('sends the number on an edit', () => {
    service.updateBeehive(7, { number: 12 }).subscribe();

    const req = http.expectOne(environment.apiUrl + 'beehives/7');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ number: 12 });
    req.flush({ success: true, data: { id: 7, uuid: 'g', number: 12, apiary_id: 1 } });
  });

  it('hands a taken number back to the caller as a 422', () => {
    let status = 0;
    let message = '';
    service.updateBeehive(7, { number: 3 }).subscribe({
      error: err => { status = err.status; message = err.error.message; },
    });

    http.expectOne(environment.apiUrl + 'beehives/7').flush(
      { success: false, message: 'Beehive 3 already exists in this apiary.' },
      { status: 422, statusText: 'Unprocessable Content' },
    );

    expect(status).toBe(422);
    expect(message).toBe('Beehive 3 already exists in this apiary.');
  });
});

describe('beehive labels', () => {
  it('names a hive by its number', () => {
    expect(beehiveLabel({ number: 12 })).toBe('Beehive 12');
    expect(beehiveTag({ number: 12 })).toBe('#12');
  });

  it('orders by apiary, then number', () => {
    const hive = (id: number, apiaryId: number, number: number): Beehive => ({ id, uuid: '', number, apiaryId, queen: null });
    expect([hive(1, 1, 10), hive(2, 1, 9), hive(3, 0, 50)].sort(compareBeehives).map(b => b.id)).toEqual([3, 2, 1]);
  });
});
