import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  PLATFORM_ID,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ExportFormat } from '../../../../core/services/export.service';

/** The menu's labels, as the API names the formats. */
export function exportFormat(label: string): ExportFormat {
  return label === 'Excel' ? 'xlsx' : 'csv';
}

/**
 * The menu's note for a filtered records table: what the file will hold, in
 * the user's terms — "Kalamos North · Beehive 13 · 128 rows".
 */
export function exportScope(
  apiaries: { id: number; name: string }[],
  beehives: { id: number; name: string }[],
  apiaryId: number,
  beehiveId: number,
  rows: number,
): string {
  const where = apiaryId ? apiaries.find(a => a.id === apiaryId)?.name ?? 'Apiary' : 'All apiaries';
  const which = beehiveId ? ` · Beehive ${beehives.find(b => b.id === beehiveId)?.name ?? ''}`.trimEnd() : '';
  return `${where}${which} · ${rows} row${rows === 1 ? '' : 's'}`;
}

/**
 * Export for the table you are already looking at: the filter is the scope, so
 * the menu asks for a format and nothing else — and `note` says what the scope
 * is ("Kalamos North · 128 rows"), which is the whole reason this is a menu
 * rather than a bare button.
 *
 * ```html
 * <app-filter-bar …>
 *   <app-export-menu [note]="exportNote()" (export)="export($event)" />
 * </app-filter-bar>
 * ```
 * In a card toolbar with no filter bar (Financial's costs), use
 * `chrome="bare" size="sm"`.
 *
 * Ghost, never primary: the records pages already have an orange "+ Add
 * Record". The panel is `position: fixed`, measured from the trigger, because
 * a card's `overflow: hidden` clips anything absolute; it flips above when
 * there is no room below. Escape and a click elsewhere close it, and the page
 * keeps scrolling — a list of choices is a popover, not a dialog.
 * Styles: `.fb__export`, `.pop__*` in styles/components/app/app.css.
 */
@Component({
  selector: 'app-export-menu',
  standalone: true,
  templateUrl: './export-menu.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // In the bar the host itself is the group: it is the flex item, so it is the
  // element .fb__group--end has to reach to take the right end.
  host: {
    '[class.fb__group]': "chrome() === 'filter'",
    '[class.fb__group--end]': "chrome() === 'filter'",
  },
})
export class ExportMenuComponent {
  private host      = inject<ElementRef<HTMLElement>>(ElementRef);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Structural label above the trigger in `filter` chrome. */
  readonly label        = input('Export');
  /** Defaults to "Download" in the bar (the label already says EXPORT), "Export" alone. */
  readonly triggerLabel = input('');
  readonly formats      = input<string[]>(['CSV', 'Excel']);
  readonly note         = input('');
  readonly chrome       = input<'filter' | 'bare'>('filter');
  readonly size         = input<'sm' | 'md'>('md');
  readonly disabled     = input(false);

  /** The chosen format, as labelled. */
  readonly export = output<string>();

  protected readonly open = signal(false);
  protected readonly position = signal<{ top: number; left: number } | null>(null);
  protected readonly text = computed(() => this.triggerLabel() || (this.chrome() === 'filter' ? 'Download' : 'Export'));

  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel   = viewChild<ElementRef<HTMLDivElement>>('panel');

  constructor() {
    inject(DestroyRef).onDestroy(() => this.detach());
  }

  toggle(): void {
    this.open() ? this.close() : this.show();
  }

  choose(format: string): void {
    this.close();
    this.export.emit(format);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) {
      this.close();
      this.trigger()?.nativeElement.focus();
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  onPointerDown(event: PointerEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  private show(): void {
    if (!this.isBrowser) return;
    this.position.set(null);
    this.open.set(true);
    // Measured once the panel exists, so its own width and height are known.
    requestAnimationFrame(() => this.place());
    window.addEventListener('scroll', this.place, true);
    window.addEventListener('resize', this.place);
  }

  private close(): void {
    this.open.set(false);
    this.detach();
  }

  private detach(): void {
    if (!this.isBrowser) return;
    window.removeEventListener('scroll', this.place, true);
    window.removeEventListener('resize', this.place);
  }

  private place = (): void => {
    const anchor = this.trigger()?.nativeElement.getBoundingClientRect();
    const panel  = this.panel()?.nativeElement;
    if (!anchor || !panel) return;

    const height = panel.offsetHeight;
    const width  = panel.offsetWidth;
    const below  = window.innerHeight - anchor.bottom - 8;
    const up     = height > below && anchor.top > below;

    this.position.set({
      top: up ? anchor.top - height - 6 : anchor.bottom + 6,
      left: Math.max(8, anchor.right - width),
    });
  };
}
