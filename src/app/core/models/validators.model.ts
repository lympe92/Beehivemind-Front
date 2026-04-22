import { AbstractControl, ValidationErrors } from '@angular/forms';

export interface ValidatorConfig {
  required?: boolean;
  email?: boolean;
  minLength?: number;
  mustBeTrue?: boolean;
  number?: boolean;
  date?: boolean;
  range?: { min: number; max: number };
}

export interface SyncValidatorDefinition {
  validator: (
    control: AbstractControl,
    arg?: any,
  ) => ValidationErrors | null | Promise<ValidationErrors | null>;
  message: string;
}

export interface SyncValidators {
  [key: string]: SyncValidatorDefinition;
}
