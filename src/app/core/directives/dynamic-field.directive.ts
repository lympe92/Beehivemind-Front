import { Directive, Inject, Optional, Self, SkipSelf } from '@angular/core';
import {
  AsyncValidator,
  AsyncValidatorFn,
  ControlContainer,
  ControlValueAccessor,
  FormControlName,
  NG_ASYNC_VALIDATORS,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  Validator,
  ValidatorFn,
} from '@angular/forms';

@Directive({
  standalone: true,
})
export class SAFormControlNameDirective extends FormControlName {
  constructor(
    @Optional() @SkipSelf() parent: ControlContainer,
    @Optional()
    @Self()
    @Inject(NG_VALIDATORS)
    validators: (Validator | ValidatorFn)[],
    @Optional()
    @Self()
    @Inject(NG_ASYNC_VALIDATORS)
    asyncValidators: (AsyncValidator | AsyncValidatorFn)[],
    @Self() @Inject(NG_VALUE_ACCESSOR) valueAccessors: ControlValueAccessor[],
  ) {
    super(parent, validators, asyncValidators, valueAccessors, null);
  }
}