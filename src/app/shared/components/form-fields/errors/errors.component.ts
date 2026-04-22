import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ValidationErrors } from '@angular/forms';

const ERROR_MESSAGES: Record<string, (params?: any) => string> = {
  required:           ()  => 'This field is required',
  email:              ()  => 'Invalid email address',
  minLength:          (p) => `Minimum ${p?.requiredLength} characters required`,
  maxLength:          (p) => `Maximum ${p?.maximumLength} characters allowed`,
  range:              (p) => `Value must be between ${p?.min} and ${p?.max}`,
  number:             ()  => 'Must be a number',
  apiValidator:       ()  => 'This value is not available',
  lessThan:           (p) => `Must be less than ${p?.max}`,
  greaterThan:        (p) => `Must be greater than ${p?.min}`,
  lessThanOrEqual:    (p) => `Must be ${p?.max} or less`,
  greaterThanOrEqual: (p) => `Must be ${p?.min} or more`,
  equalTo:            ()  => 'Fields do not match',
  notEqualTo:         ()  => 'Fields must be different',
  notEmpty:           ()  => 'The related field must have a value',
};

@Component({
  selector: 'app-form-errors',
  templateUrl: './errors.component.html',
  styleUrls: ['./errors.component.scss'],
  standalone: true,
})
export class ErrorsComponent implements OnChanges {
  @Input() errors!: ValidationErrors | null;
  errorMessages: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['errors']?.currentValue) {
      this.errorMessages = [];
      return;
    }

    this.errorMessages = Object.entries(changes['errors'].currentValue)
      .filter(([, value]) => value !== false)
      .map(([key, value]) => {
        const fn = ERROR_MESSAGES[key];
        return fn ? fn(value as any) : key;
      });
  }
}
