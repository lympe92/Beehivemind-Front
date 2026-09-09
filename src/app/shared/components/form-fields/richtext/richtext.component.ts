import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  inject,
  Injector,
  Input,
  OnDestroy,
  Output,
  PLATFORM_ID,
  signal,
  ViewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SAFormControlNameDirective } from '../../../../core/directives/dynamic-field.directive';
import { ErrorsComponent } from '../errors/errors.component';
import { EMPTY_RICH_TEXT, RichTextValue } from './richtext.model';

/** The formatting the article body is allowed to carry. */
type Mark = 'bold' | 'italic' | 'code' | 'link';
type Block = 'h2' | 'h3' | 'bulletList' | 'orderedList' | 'blockquote' | 'codeBlock';

/**
 * The article body editor.
 *
 * Two things shape it. First, the output is a *document*, not styled text:
 * the schema is limited to the tags `HtmlSanitizer` accepts on the server and
 * the `.prose` measure renders, and headings start at H2 because the article
 * title is the page's only H1. Second, it must not exist during the server
 * render — TipTap reaches for `document` while constructing — so the library is
 * imported dynamically behind a platform check and the field renders as a plain
 * bordered box until the browser takes over.
 *
 * Images are not uploaded here. The component asks (`imageRequested`) and
 * whoever hosts it answers with `insertImage()`, so the upload flow, its
 * validation and its alt-text rule live in one place per feature.
 */
@Component({
  selector: 'app-form-richtext',
  standalone: true,
  templateUrl: './richtext.component.html',
  styleUrl: './richtext.component.scss',
  hostDirectives: [
    {
      directive: SAFormControlNameDirective,
      inputs: ['formControlName'],
    },
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextComponent),
      multi: true,
    },
  ],
  imports: [ErrorsComponent],
})
export class RichTextComponent implements AfterViewInit, OnDestroy, ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = 'Write the article…';
  @Input() displayErrors = true;

  /** The toolbar's image button. Answer it by calling `insertImage()`. */
  @Output() imageRequested = new EventEmitter<void>();

  @ViewChild('host') private host!: ElementRef<HTMLDivElement>;

  private injector = inject(Injector);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** `Editor` from @tiptap/core, untyped here so the import stays dynamic. */
  private editor: any = null;
  private pending: RichTextValue = EMPTY_RICH_TEXT;

  protected disabled = false;
  protected readonly ready = signal(false);
  /** Which marks and blocks are active at the cursor, for the toolbar. */
  protected readonly active = signal<Record<string, boolean>>({});
  protected readonly canUndo = signal(false);
  protected readonly canRedo = signal(false);

  private _saFormControlName?: SAFormControlNameDirective | null;

  get saFormControlName(): SAFormControlNameDirective | null {
    if (this._saFormControlName === undefined) {
      this._saFormControlName = this.injector.get(SAFormControlNameDirective, null);
    }
    return this._saFormControlName;
  }

  /** Same shape as every other field: the label carries the asterisk. */
  get isRequired(): boolean {
    const control = this.saFormControlName?.control;
    if (!control?.validator) return false;
    return control.validator(new FormControl(''))?.['required'] !== undefined;
  }

  onChange: (value: unknown) => void = () => {};
  onTouched: () => void = () => {};

  async ngAfterViewInit(): Promise<void> {
    if (!this.isBrowser) return;

    const [{ Editor }, { default: StarterKit }, { default: Link }, { default: Image }, { default: Placeholder }] =
      await Promise.all([
        import('@tiptap/core'),
        import('@tiptap/starter-kit'),
        import('@tiptap/extension-link'),
        import('@tiptap/extension-image'),
        import('@tiptap/extension-placeholder'),
      ]);

    this.editor = new Editor({
      element: this.host.nativeElement,
      editable: !this.disabled,
      extensions: [
        // H1 belongs to the page, not to the body.
        StarterKit.configure({ heading: { levels: [2, 3] } }),
        Link.configure({
          openOnClick: false,
          autolink: true,
          // Anything else is stripped server-side anyway; refusing it here
          // means the editor never shows a link that will not survive saving.
          protocols: ['http', 'https', 'mailto', 'tel'],
        }),
        Image.configure({ allowBase64: false }),
        Placeholder.configure({ placeholder: this.placeholder }),
      ],
      content: this.pending.json ?? this.pending.html ?? '',
      onUpdate: () => this.emit(),
      onSelectionUpdate: () => this.readState(),
      onTransaction: () => this.readState(),
      onBlur: () => this.onTouched(),
    });

    this.ready.set(true);
    this.readState();
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }

  // --- ControlValueAccessor

  writeValue(value: unknown): void {
    const next = this.normalise(value);

    if (!this.editor) {
      // Arrives before the dynamic import resolves on almost every edit.
      this.pending = next;
      return;
    }

    if (this.editor.getHTML() === next.html) return;

    // `false` — a programmatic write is not the user typing, and emitting here
    // would mark a freshly loaded form dirty.
    this.editor.commands.setContent(next.json ?? next.html, false);
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.editor?.setEditable(!isDisabled);
  }

  // --- toolbar

  protected toggleMark(mark: Mark): void {
    if (mark === 'link') {
      this.toggleLink();
      return;
    }

    const chain = this.editor?.chain().focus();
    if (mark === 'bold') chain?.toggleBold().run();
    if (mark === 'italic') chain?.toggleItalic().run();
    if (mark === 'code') chain?.toggleCode().run();
  }

  protected toggleBlock(block: Block): void {
    const chain = this.editor?.chain().focus();
    if (block === 'h2') chain?.toggleHeading({ level: 2 }).run();
    if (block === 'h3') chain?.toggleHeading({ level: 3 }).run();
    if (block === 'bulletList') chain?.toggleBulletList().run();
    if (block === 'orderedList') chain?.toggleOrderedList().run();
    if (block === 'blockquote') chain?.toggleBlockquote().run();
    if (block === 'codeBlock') chain?.toggleCodeBlock().run();
  }

  protected undo(): void {
    this.editor?.chain().focus().undo().run();
  }

  protected redo(): void {
    this.editor?.chain().focus().redo().run();
  }

  /** The escape hatch for pasted markup that came in wearing something odd. */
  protected clearFormatting(): void {
    this.editor?.chain().focus().unsetAllMarks().clearNodes().run();
  }

  protected requestImage(): void {
    this.imageRequested.emit();
  }

  /** Called by the host once its upload has finished. */
  insertImage(src: string, alt: string): void {
    this.editor?.chain().focus().setImage({ src, alt }).run();
  }

  focus(): void {
    this.editor?.chain().focus().run();
  }

  private toggleLink(): void {
    if (this.editor?.isActive('link')) {
      this.editor.chain().focus().unsetLink().run();
      return;
    }

    // A prompt, deliberately: a link dialog is a modal, and a modal opened from
    // inside a modal (the editor is used in one) fights the CDK overlay stack.
    const href = window.prompt('Link address', 'https://')?.trim();
    if (!href) return;

    this.editor?.chain().focus().extendMarkRange('link').setLink({ href }).run();
  }

  private readState(): void {
    if (!this.editor) return;

    this.active.set({
      bold: this.editor.isActive('bold'),
      italic: this.editor.isActive('italic'),
      code: this.editor.isActive('code'),
      link: this.editor.isActive('link'),
      h2: this.editor.isActive('heading', { level: 2 }),
      h3: this.editor.isActive('heading', { level: 3 }),
      bulletList: this.editor.isActive('bulletList'),
      orderedList: this.editor.isActive('orderedList'),
      blockquote: this.editor.isActive('blockquote'),
      codeBlock: this.editor.isActive('codeBlock'),
    });

    this.canUndo.set(this.editor.can().undo());
    this.canRedo.set(this.editor.can().redo());
  }

  private emit(): void {
    const html = this.editor.getHTML();
    this.onChange({ html: html === '<p></p>' ? '' : html, json: this.editor.getJSON() });
  }

  /** Tolerates a plain HTML string, so a legacy value still opens. */
  private normalise(value: unknown): RichTextValue {
    if (typeof value === 'string') return { html: value, json: null };
    const v = value as Partial<RichTextValue> | null | undefined;
    return { html: v?.html ?? '', json: v?.json ?? null };
  }
}
