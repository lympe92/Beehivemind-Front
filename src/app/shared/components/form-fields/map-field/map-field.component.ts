import { Component, forwardRef, Injector, Input, OnInit } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SAFormControlNameDirective } from '../../../../core/directives/dynamic-field.directive';
import { ErrorsComponent } from '../errors/errors.component';
import { MapPickerComponent } from '../../ui/map-picker/map-picker';

@Component({
  selector: 'app-form-map',
  templateUrl: './map-field.component.html',
  styleUrls: ['./map-field.component.scss'],
  standalone: true,
  hostDirectives: [
    {
      directive: SAFormControlNameDirective,
      inputs: ['formControlName'],
    },
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MapFieldComponent),
      multi: true,
    },
  ],
  imports: [ErrorsComponent, MapPickerComponent],
})
export class MapFieldComponent implements ControlValueAccessor, OnInit {
  @Input() label!: string;

  protected marker: google.maps.LatLngLiteral | null = null;
  protected disabled = false;
  saFormControlName?: SAFormControlNameDirective | null;

  constructor(private injector: Injector) {
    queueMicrotask(() => {
      this.saFormControlName = this.injector.get(SAFormControlNameDirective, null);
    });
  }

  ngOnInit(): void {}

  onChange: (value: google.maps.LatLngLiteral | null) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: google.maps.LatLngLiteral | null): void {
    this.marker = value ?? null;
  }

  registerOnChange(fn: (value: google.maps.LatLngLiteral | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  onMarkerChange(pos: google.maps.LatLngLiteral): void {
    this.marker = pos;
    this.onChange(pos);
    this.onTouched();
  }

  get isRequired(): boolean {
    const control = this.saFormControlName?.control;
    if (!control?.validator) return false;
    const errors = control.validator(new FormControl(null));
    return errors?.['required'] !== undefined;
  }

  isFieldValid(): boolean {
    if (!this.saFormControlName?.errors) return false;
    const hasErrors = Object.entries(this.saFormControlName.errors).some(([, v]) => v !== false);
    return hasErrors && !this.saFormControlName.valid && !!this.saFormControlName.touched;
  }
}
