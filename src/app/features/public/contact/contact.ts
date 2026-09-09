import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PageIntroComponent } from '../../../shared/components/info-sections/page-intro/page-intro';
import { CalloutComponent } from '../../../shared/components/ui/callout/callout';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { ContactService } from '../../../core/services/contact.service';
import { PageIntroConfig } from '../public-page.model';

interface ContactPageConfig {
  intro: PageIntroConfig;
  docs: { title: string; text: string; routerLink: string; label: string };
  /** The company mailbox — the way in when the form cannot be. */
  email: string;
}

/**
 * The contact page. Every "Need a consultation?" CTA used to point at
 * `/pages/contact-us`, which matched no route. There is no phone number or
 * response-time commitment anywhere in the source, so none is stated here.
 *
 * The form posts to `contact` (Content module), which emails the company
 * mailbox with the visitor in Reply-To. Failure is rendered here, not toasted:
 * the page has the mailbox to fall back on, and a toast could not say so.
 */
@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PageIntroComponent, CalloutComponent],
  templateUrl: './contact.html',
})
export class ContactComponent {
  private fb = inject(FormBuilder);
  private contactService = inject(ContactService);
  private analytics = inject(AnalyticsService);

  readonly page: ContactPageConfig = {
    intro: {
      eyebrow: 'Contact',
      title: 'Get in touch',
      lead: 'Questions about the software, your account, or something you need it to do — write below and we will come back to you.',
    },
    docs: {
      title: 'Already answered?',
      text: 'Setup, the voice commands and troubleshooting are covered on the help page. Most questions are quicker to answer there.',
      routerLink: '/help',
      label: 'Read the help page',
    },
    email: 'info@beehivemind.tech',
  };

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    subject: [''],
    message: ['', Validators.required],
    // Honeypot: visually hidden, never filled by a person. The API drops the
    // message silently when it is.
    website: [''],
  });

  readonly sending = signal(false);
  readonly sent = signal(false);
  readonly failed = signal(false);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.sending()) return;

    this.sending.set(true);
    this.failed.set(false);

    this.contactService.send(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.sending.set(false);
        if (res.success) {
          this.sent.set(true);
          this.analytics.event('generate_lead', { form: 'contact' });
        } else {
          this.failed.set(true);
        }
      },
      error: () => {
        this.sending.set(false);
        this.failed.set(true);
      },
    });
  }

  invalid(control: 'name' | 'email' | 'message'): boolean {
    const c = this.form.controls[control];
    return c.invalid && c.touched;
  }
}
