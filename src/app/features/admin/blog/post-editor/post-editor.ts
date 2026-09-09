import { Component, computed, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { of } from 'rxjs';
import { RequestService } from '../../../../core/services/request.service';
import { ToastService } from '../../../../shared/components/ui/toast/toast.service';
import { ModalService } from '../../../../core/modal/modal.service';
import { CardComponent } from '../../../../shared/components/ui/card/card';
import { AppErrorComponent } from '../../../../shared/components/ui/app-error/app-error';
import { InputComponent } from '../../../../shared/components/form-fields/input/input.component';
import { TextareaComponent } from '../../../../shared/components/form-fields/textarea/textarea.component';
import { SelectComponent } from '../../../../shared/components/form-fields/select/select.component';
import { RichTextComponent } from '../../../../shared/components/form-fields/richtext/richtext.component';
import { isRichTextEmpty, RichTextValue } from '../../../../shared/components/form-fields/richtext/richtext.model';
import { AdminBlogCategory, AdminMedia, AdminPost, SEO_LIMITS } from '../blog.types';
import { drawOgCard } from '../og-card';
import { environment } from '../../../../../environments/environment';

/** Where an uploaded image is going. */
type UploadTarget = 'featured' | 'body' | 'og';

/**
 * The post editor.
 *
 * A bespoke reactive form rather than `<app-form>`: the page is two columns of
 * cards with counters, an OG preview and two repeaters, none of which a
 * `DynamicField[]` schema can lay out. It still uses the schema system's field
 * components — they are plain `ControlValueAccessor`s, so `formControlName`
 * works on them anywhere — so a text input here is the same control as one in
 * any modal.
 *
 * The SEO sidebar is not decoration. Everything a crawler and an answer engine
 * read about the article is set here and stored per post: the meta pair, the
 * canonical, the robots directive, the social card, and — for the answer
 * engines specifically — the takeaways and the questions, which the article
 * renders on the page as well as into `FAQPage` markup.
 */
@Component({
  selector: 'app-admin-post-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CardComponent,
    AppErrorComponent,
    InputComponent,
    TextareaComponent,
    SelectComponent,
    RichTextComponent,
  ],
  templateUrl: './post-editor.html',
  styleUrl: './post-editor.scss',
})
export class PostEditorComponent implements OnInit {
  private fb      = inject(FormBuilder);
  private request = inject(RequestService);
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private toast   = inject(ToastService);
  private modal   = inject(ModalService);

  @ViewChild(RichTextComponent) private body?: RichTextComponent;
  @ViewChild('bodyFile') private bodyFileInput?: ElementRef<HTMLInputElement>;

  readonly limits = SEO_LIMITS;

  postId     = signal<number | null>(null);
  categories = signal<AdminBlogCategory[]>([]);
  loading    = signal(true);
  saving     = signal(false);
  error      = signal<string | null>(null);

  featuredImage = signal<AdminMedia | null>(null);
  ogImage       = signal<AdminMedia | null>(null);
  /** Set while a file is in flight, so the two dropzones can say so. */
  uploading     = signal<UploadTarget | null>(null);
  slugTaken     = signal(false);

  /** Locked once a post exists: changing a live slug breaks every link to it. */
  slugLocked = signal(false);

  readonly form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    slug: [''],
    excerpt: ['', [Validators.required, Validators.maxLength(SEO_LIMITS.excerpt)]],
    body: [{ html: '', json: null } as RichTextValue],

    status: ['draft'],
    published_at: [''],
    category_id: [null as number | null],
    tags: [''],

    meta_title: ['', Validators.maxLength(120)],
    meta_description: ['', Validators.maxLength(300)],
    focus_keyword: [''],
    canonical_url: [''],
    noindex: [false],
    og_title: ['', Validators.maxLength(160)],
    og_description: ['', Validators.maxLength(300)],

    key_takeaways: this.fb.array([] as unknown[]),
    faq: this.fb.array([] as unknown[]),
  });

  readonly categoryOptions = computed(() =>
    of([
      { displayValue: 'No category', returnValue: null },
      ...this.categories().map(c => ({ displayValue: c.name, returnValue: c.id })),
    ]),
  );

  readonly statusOptions = of([
    { displayValue: 'Draft', returnValue: 'draft' },
    { displayValue: 'Scheduled', returnValue: 'scheduled' },
    { displayValue: 'Published', returnValue: 'published' },
  ]);

  get takeaways(): FormArray {
    return this.form.get('key_takeaways') as FormArray;
  }

  get faq(): FormArray {
    return this.form.get('faq') as FormArray;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.loadCategories();

    if (!id) {
      this.loading.set(false);
      this.wireSlugFromTitle();
      return;
    }

    this.postId.set(Number(id));
    this.slugLocked.set(true);
    this.load(Number(id));
  }

  private load(id: number): void {
    this.loading.set(true);
    this.request.getRequest<AdminPost>(`admin/blog/posts/${id}`).subscribe({
      next: res => {
        this.patch(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('This post did not load.');
        this.loading.set(false);
      },
    });
  }

  private loadCategories(): void {
    this.request.getRequest<AdminBlogCategory[]>('admin/blog/categories').subscribe({
      next: res => this.categories.set(res.data ?? []),
      error: () => {},
    });
  }

  private patch(post: AdminPost): void {
    this.form.patchValue({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      body: { html: post.content_html, json: post.content_json },
      status: post.status,
      // The control is a datetime-local input, which cannot read an offset.
      published_at: post.published_at ? post.published_at.slice(0, 16) : '',
      category_id: post.category_id,
      tags: post.tags.join(', '),
      meta_title: post.meta_title ?? '',
      meta_description: post.meta_description ?? '',
      focus_keyword: post.focus_keyword ?? '',
      canonical_url: post.canonical_url ?? '',
      noindex: post.robots.includes('noindex'),
      og_title: post.og_title ?? '',
      og_description: post.og_description ?? '',
    });

    this.takeaways.clear();
    post.key_takeaways.forEach(text => this.takeaways.push(this.fb.control(text)));

    this.faq.clear();
    post.faq.forEach(entry =>
      this.faq.push(this.fb.group({ question: [entry.question], answer: [entry.answer] })),
    );

    this.featuredImage.set(post.featured_image);
    this.ogImage.set(post.og_image);
  }

  /** Only until the post first exists — after that the slug is a published URL. */
  private wireSlugFromTitle(): void {
    this.form.get('title')!.valueChanges.subscribe((title: string) => {
      if (this.slugLocked()) return;
      this.form.get('slug')!.setValue(this.slugify(title), { emitEvent: false });
      this.checkSlug();
    });
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }

  unlockSlug(): void {
    this.slugLocked.set(false);
    this.toast.warning('Changing a published slug breaks every link to the post.');
  }

  checkSlug(): void {
    const slug = this.form.get('slug')!.value as string;
    if (!slug) return;

    const query = new URLSearchParams({ slug });
    const id = this.postId();
    if (id) query.set('ignore', String(id));

    this.request
      .getRequest<{ available: boolean }>(`admin/blog/posts/slug-available?${query.toString()}`)
      .subscribe({
        next: res => this.slugTaken.set(!res.data.available),
        error: () => {},
      });
  }

  // --- images

  /**
   * The two dropzones and the editor's image button all land here.
   *
   * Alt text is asked for before the file goes anywhere, and it is stored on
   * the media row: the image is going onto a public page, and an article image
   * without a description fails the site's own accessibility audit. Cancelling
   * the prompt cancels the upload — better than a silent empty alt.
   */
  onFile(event: Event, target: Exclude<UploadTarget, 'og'>): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const alt = window.prompt('Describe the image for a screen reader', '')?.trim();
    if (!alt) {
      this.toast.warning('The image needs a description before it can be used.');
      return;
    }

    this.upload(file, file.name, target, alt);
  }

  private upload(file: Blob, filename: string, target: UploadTarget, alt: string): void {
    const data = new FormData();
    data.append('file', file, filename);
    data.append('alt', alt);

    this.uploading.set(target);
    this.request.postRequest<AdminMedia>('admin/media', data).subscribe({
      next: res => {
        this.uploading.set(null);
        this.applyUpload(res.data, target);
      },
      error: () => this.uploading.set(null),
    });
  }

  private applyUpload(media: AdminMedia, target: UploadTarget): void {
    if (target === 'featured') {
      this.featuredImage.set(media);
      return;
    }
    if (target === 'og') {
      this.ogImage.set(media);
      return;
    }
    this.body?.insertImage(media.url, media.alt ?? '');
  }

  /** The toolbar's image button, routed to the body dropzone's file input. */
  pickBodyImage(): void {
    this.bodyFileInput?.nativeElement.click();
  }

  removeFeatured(): void {
    this.featuredImage.set(null);
  }

  /**
   * Draws the post's social card in the browser and uploads it. Server-side
   * generation is not available — see og-card.ts — and a post without a card
   * of its own falls back to the site's generic one, which is the same picture
   * on every share.
   */
  async generateOgCard(): Promise<void> {
    const title = (this.form.get('title')!.value as string).trim();
    if (!title) {
      this.toast.warning('Give the post a title first — it is what the card says.');
      return;
    }

    this.uploading.set('og');

    try {
      const blob = await drawOgCard({ title, kicker: this.categoryName() ?? 'Blog' });
      this.upload(blob, `og-${this.form.get('slug')!.value || 'post'}.jpg`, 'og', title);
    } catch {
      this.uploading.set(null);
      this.toast.error('The card could not be drawn in this browser.');
    }
  }

  clearOgCard(): void {
    this.ogImage.set(null);
  }

  categoryName(): string | null {
    const id = this.form.get('category_id')!.value as number | null;
    return this.categories().find(c => c.id === id)?.name ?? null;
  }

  // --- AEO repeaters

  addTakeaway(): void {
    this.takeaways.push(this.fb.control(''));
  }

  removeTakeaway(index: number): void {
    this.takeaways.removeAt(index);
  }

  addFaq(): void {
    this.faq.push(this.fb.group({ question: [''], answer: [''] }));
  }

  removeFaq(index: number): void {
    this.faq.removeAt(index);
  }

  // --- preview strings

  /** What the result would read as, with the same fallbacks the API applies. */
  previewTitle(): string {
    const meta = (this.form.get('meta_title')!.value as string).trim();
    if (meta) return meta;

    const title = (this.form.get('title')!.value as string).trim();
    return title ? `${title} | ${environment.appName}` : '';
  }

  previewDescription(): string {
    const meta = (this.form.get('meta_description')!.value as string).trim();
    return meta || (this.form.get('excerpt')!.value as string).trim();
  }

  previewUrl(): string {
    const canonical = (this.form.get('canonical_url')!.value as string).trim();
    return canonical || `${environment.appUrl}/blog/${this.form.get('slug')!.value || ''}`;
  }

  /** Over the limit is a warning, never a block — the post still publishes. */
  over(value: string, limit: number): boolean {
    return value.trim().length > limit;
  }

  // --- save

  /**
   * The primary button follows the Status select rather than overriding it —
   * otherwise a post set to "Scheduled" could only ever be saved as a draft or
   * published on the spot, and the date beside it would never mean anything.
   */
  primaryLabel(): string {
    if (this.saving()) return 'Saving…';

    const status = this.form.get('status')!.value as string;
    if (status === 'scheduled') return 'Schedule';
    if (status === 'published') return this.postId() ? 'Update' : 'Publish';
    return 'Publish';
  }

  /**
   * `asDraft` is the "Save draft" button, which does override the select.
   * Without it the selected status stands, except that a post still marked
   * draft is promoted — that is what the primary button says it will do.
   */
  async save(asDraft = false): Promise<void> {
    if (asDraft) this.form.get('status')!.setValue('draft');
    else if (this.form.get('status')!.value === 'draft') this.form.get('status')!.setValue('published');

    const body = this.form.get('body')!.value as RichTextValue;

    if (this.form.invalid || isRichTextEmpty(body)) {
      this.form.markAllAsTouched();
      this.toast.warning('The title, the summary and the article itself are all required.');
      return;
    }

    if (this.slugTaken()) {
      this.toast.warning('That slug is already in use.');
      return;
    }

    const status = this.form.get('status')!.value as string;

    // The API rejects this, but a scheduled post with no date is a mistake
    // worth naming here rather than as a validation error.
    if (status === 'scheduled' && !this.form.get('published_at')!.value) {
      this.toast.warning('A scheduled post needs a date to appear on.');
      return;
    }

    // Going public is the one moment a missing social card is worth stopping
    // for — a scheduled post included, since nobody will be watching when it
    // goes up.
    if (status !== 'draft' && !this.ogImage()) {
      const proceed = await this.modal.confirm({
        title: 'Publish without a social card?',
        message: 'Every share of this post will use the site’s generic blog image. Generating one takes a moment.',
        confirmLabel: 'Publish anyway',
      });
      if (!proceed) return;
    }

    this.saving.set(true);
    const id = this.postId();
    const payload = this.toPayload(body);

    const call = id
      ? this.request.putRequest<AdminPost>(`admin/blog/posts/${id}`, payload)
      : this.request.postRequest<AdminPost>('admin/blog/posts', payload);

    call.subscribe({
      next: res => {
        this.saving.set(false);
        this.toast.success(id ? 'Post saved.' : 'Post created.');
        if (id) {
          this.patch(res.data);
        } else {
          this.router.navigate(['/admin/blog', res.data.id]);
        }
      },
      error: () => this.saving.set(false),
    });
  }

  private toPayload(body: RichTextValue): Record<string, unknown> {
    const value = this.form.getRawValue();

    return {
      title: value.title,
      slug: value.slug || null,
      excerpt: value.excerpt,
      content_html: body.html,
      content_json: body.json,

      status: value.status,
      published_at: value.published_at || null,
      category_id: value.category_id,
      tags: (value.tags as string)
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean),

      featured_image_id: this.featuredImage()?.id ?? null,
      og_image_id: this.ogImage()?.id ?? null,

      meta_title: value.meta_title || null,
      meta_description: value.meta_description || null,
      focus_keyword: value.focus_keyword || null,
      canonical_url: value.canonical_url || null,
      robots: value.noindex ? 'noindex, nofollow' : 'index, follow',
      og_title: value.og_title || null,
      og_description: value.og_description || null,
      twitter_card: 'summary_large_image',

      key_takeaways: (value.key_takeaways as string[]).map(t => t.trim()).filter(Boolean),
      faq: (value.faq as { question: string; answer: string }[])
        .filter(entry => entry.question.trim() && entry.answer.trim()),
    };
  }
}
