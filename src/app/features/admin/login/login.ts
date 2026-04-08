import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AsyncPipe } from '@angular/common';
import { EmployeeAuthActions } from '../../../store/employee-auth/employee-auth.actions';
import {
  selectEmployeeAuthError,
  selectEmployeeAuthLoading,
  selectIsEmployeeLoggedIn,
} from '../../../store/employee-auth/employee-auth.selectors';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [ReactiveFormsModule, AsyncPipe],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class AdminLoginComponent implements OnInit {
  private store = inject(Store);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  loading$ = this.store.select(selectEmployeeAuthLoading);
  error$ = this.store.select(selectEmployeeAuthError);

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    this.store.select(selectIsEmployeeLoggedIn).subscribe((loggedIn) => {
      if (loggedIn) this.router.navigate(['/admin/dashboard']);
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    const { email, password } = this.form.value;
    this.store.dispatch(EmployeeAuthActions.login({ email, password }));
  }
}
