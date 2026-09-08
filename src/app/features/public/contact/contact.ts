import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageIntroComponent } from '../../../shared/components/info-sections/page-intro/page-intro';
import { CalloutComponent } from '../../../shared/components/ui/callout/callout';
import { PageIntroConfig } from '../public-page.model';

interface ContactPageConfig {
  intro: PageIntroConfig;
  docs: { title: string; text: string; href: string; label: string };
}

/**
 * The contact page. Every "Need a consultation?" CTA used to point at
 * `/pages/contact-us`, which matched no route. There is no contact address,
 * phone number or response-time commitment anywhere in the source, so none
 * is stated here — add the real ones before this ships.
 *
 * TODO(backend): the form has no endpoint yet; submitting shows the sent
 * state only. Wire it to a `contact` API call when one exists.
 */
@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ReactiveFormsModule, PageIntroComponent, CalloutComponent],
  templateUrl: './contact.html',
})
export class ContactComponent {
  private fb = inject(FormBuilder);

  readonly page: ContactPageConfig = {
    intro: {
      eyebrow: 'Contact',
      title: 'Get in touch',
      lead: 'Questions about the software, your account, or something you need it to do — write below and we will come back to you.',
    },
    docs: {
      title: 'Already answered?',
      text: 'Setup, voice commands and billing are covered in the support docs. Most questions are quicker to answer there.',
      href: 'https://beehivemind.freshdesk.com/support/home',
      label: 'Open the support docs',
    },
  };

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    subject: [''],
    message: ['', Validators.required],
  });

  readonly sent = signal(false);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.sent.set(true);
  }

  invalid(control: 'name' | 'email' | 'message'): boolean {
    const c = this.form.controls[control];
    return c.invalid && c.touched;
  }
}
