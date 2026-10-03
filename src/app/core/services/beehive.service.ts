import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { RequestService } from './request.service';
import { ApiResponse } from '../models/api-response.model';
import { Beehive, compareBeehives } from '../models/beehive.model';
import { inlineErrors } from '../interceptors/error.interceptor';

/** Raw beehive payload as returned by the API (snake_case). */
interface BeehivePayload {
  id: number;
  uuid: string;
  number: number;
  apiary_id: number;
  queen?: Beehive['queen'];
}

@Injectable({ providedIn: 'root' })
export class BeehiveService {
  private request = inject(RequestService);

  /** In number order, an apiary's hives together (`compareBeehives`). */
  getBeehives(): Observable<ApiResponse<Beehive[]>> {
    return this.request.getRequest<BeehivePayload[]>('beehives').pipe(
      map(res => ({ ...res, data: (res.data ?? []).map(b => this.fromApi(b)).sort(compareBeehives) }))
    );
  }

  getBeehivesOfApiary(apiaryId: number): Observable<ApiResponse<Beehive[]>> {
    return this.request.getRequest<BeehivePayload[]>(`beehives/apiary/${apiaryId}`).pipe(
      map(res => ({ ...res, data: (res.data ?? []).map(b => this.fromApi(b)).sort(compareBeehives) }))
    );
  }

  /** The API numbers the new hives itself, after the apiary's highest number. */
  createBeehives(apiaryId: number, count: number): Observable<ApiResponse<Beehive[]>> {
    return this.request.postRequest<Beehive[]>('beehives', { apiary_id: apiaryId, hives_number: count });
  }

  /**
   * A number already taken in the apiary answers 422 ("Beehive 3 already
   * exists in this apiary."); the edit row shows it under the field, so that
   * status is not toasted too (`inlineErrors(422)`).
   */
  updateBeehive(id: number, data: Partial<Beehive>): Observable<ApiResponse<Beehive>> {
    const payload: { number?: number } = {};
    if (data.number !== undefined) payload.number = data.number;
    return this.request.putRequest<BeehivePayload>(`beehives/${id}`, payload, { context: inlineErrors(422) }).pipe(
      map(res => ({ ...res, data: this.fromApi(res.data) }))
    );
  }

  /**
   * A hive that still holds a queen cannot be deleted without saying what
   * happens to her: she is lost with the hive, or moved to another one — and
   * moving her onto a hive that already has a queen is refused with a 409
   * unless the caller says to replace.
   */
  deleteBeehive(
    id: number,
    queen?: { queen_fate: 'lost' | 'moved'; target_beehive_id?: number; force_replace_queen?: boolean },
  ): Observable<ApiResponse<void>> {
    return this.request.deleteRequest<void>(`beehives/${id}`, queen ?? {});
  }

  private fromApi(b: BeehivePayload): Beehive {
    return {
      id:       b.id,
      uuid:     b.uuid,
      number:   b.number,
      apiaryId: b.apiary_id,
      queen:    b.queen ?? null,
    };
  }
}
