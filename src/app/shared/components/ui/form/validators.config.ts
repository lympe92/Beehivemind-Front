import { AbstractControl, ValidationErrors, Validators } from '@angular/forms';
import { map, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

export const syncValidators = {
  required: () =>
    (control: AbstractControl): ValidationErrors | null =>
      Validators.required(control) ? { required: true } : null,

  rangeNumber:
    ({ min, max }: { min?: number; max?: number }) =>
    (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === null || value === undefined || value === '') return null;
      const n = Number(value);
      const below = min !== undefined && n < min;
      const above = max !== undefined && n > max;
      if (!below && !above) return null;
      if (min !== undefined && max !== undefined) return { range: { min, max, actual: value } };
      return below
        ? { range: { min, actual: value, message: `Must be ${min} or more` } }
        : { range: { max, actual: value, message: `Must be ${max} or less` } };
    },

  /** A regex the value has to match; the message is the copy shown when it does not. */
  pattern:
    (regex: RegExp, message: string) =>
    (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === null || value === undefined || value === '') return null;
      return regex.test(String(value)) ? null : { [`pattern_${regex.source}`]: { message } };
    },

  email:
    () =>
    (control: AbstractControl): ValidationErrors | null =>
      Validators.email(control) ? { email: true } : null,

  minLength:
    (min: number) =>
    (control: AbstractControl): ValidationErrors | null =>
      control.value?.length < min
        ? { minLength: { requiredLength: min, actualLength: control.value?.length } }
        : null,

  maxLength:
    (max: number) =>
    (control: AbstractControl): ValidationErrors | null =>
      control.value?.length > max
        ? { maxLength: { maximumLength: max, actualLength: control.value?.length } }
        : null,

  number:
    () =>
    (control: AbstractControl): ValidationErrors | null =>
      typeof control.value !== 'number' ? { number: true } : null,
};

export const asyncValidators = {
  apiValidator: (http: HttpClient, urlPath: string, mapperRes: (res: unknown) => boolean) =>
    (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.dirty && control.pristine) return of(null);
      if (!control.value) return of({ apiValidator: true });

      return http.get(environment.apiUrl + `${urlPath}/${control.value}`).pipe(
        map(res => (mapperRes(res) ? null : { apiValidator: true })),
        catchError(() => of({ apiValidator: true })),
      );
    },
};

export const crossFieldValidators = {
  lessThanOrEqual: (maxFieldName: string) =>
    (control: AbstractControl): ValidationErrors | null => {
      if (!control.parent) return null;
      const maxValue = control.parent.get(maxFieldName)?.value;
      const value = control.value;
      if (value == null || maxValue == null) return null;
      return Number(value) <= Number(maxValue) ? null : { lessThanOrEqual: { max: maxValue, actual: value } };
    },

  greaterThanOrEqual: (minFieldName: string) =>
    (control: AbstractControl): ValidationErrors | null => {
      if (!control.parent) return null;
      const minValue = control.parent.get(minFieldName)?.value;
      const value = control.value;
      if (value == null || minValue == null) return null;
      return Number(value) >= Number(minValue) ? null : { greaterThanOrEqual: { min: minValue, actual: value } };
    },

  lessThan: (maxFieldName: string) =>
    (control: AbstractControl): ValidationErrors | null => {
      if (!control.parent) return null;
      const maxValue = control.parent.get(maxFieldName)?.value;
      const value = control.value;
      if (value == null || maxValue == null) return null;
      return Number(value) < Number(maxValue) ? null : { lessThan: { max: maxValue, actual: value } };
    },

  greaterThan: (minFieldName: string) =>
    (control: AbstractControl): ValidationErrors | null => {
      if (!control.parent) return null;
      const minValue = control.parent.get(minFieldName)?.value;
      const value = control.value;
      if (value == null || minValue == null) return null;
      return Number(value) > Number(minValue) ? null : { greaterThan: { min: minValue, actual: value } };
    },

  /** `targetLabel`, when given, names the other field in the message: "Must match the new password". */
  equalTo: (targetFieldName: string, targetLabel?: string) =>
    (control: AbstractControl): ValidationErrors | null => {
      if (!control.parent) return null;
      const targetValue = control.parent.get(targetFieldName)?.value;
      if (control.value === targetValue) return null;
      return targetLabel ? { equalTo: { message: `Must match ${targetLabel}` } } : { equalTo: true };
    },

  notEqualTo: (targetFieldName: string) =>
    (control: AbstractControl): ValidationErrors | null => {
      if (!control.parent) return null;
      const targetValue = control.parent.get(targetFieldName)?.value;
      return control.value !== targetValue ? null : { notEqualTo: true };
    },

  notEmpty: (targetFieldName: string) =>
    (control: AbstractControl): ValidationErrors | null => {
      if (!control.parent) return null;
      const targetControl = control.parent.get(targetFieldName);
      return targetControl?.valid && targetControl?.value ? null : { notEmpty: true };
    },
};
