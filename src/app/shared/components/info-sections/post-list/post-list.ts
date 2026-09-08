import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Post } from './post-list.model';

/**
 * The blog index: hairline-separated rows, artwork left, copy right. Not cards
 * — a shadowed box would be the first on the whole site. When `tags` has more
 * than one entry a chip row filters the list; the chips are labels in the
 * structural voice, and the selected one is an ink fill.
 * Usage: `<section app-post-list [posts]="…" [tags]="…" [activeTag]="…" (filter)="…"></section>`.
 */
@Component({
  selector: 'section[app-post-list]',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './post-list.html',
  host: { class: 'container' },
})
export class PostListComponent {
  posts = input<Post[]>([]);
  tags = input<string[]>([]);
  activeTag = input<string>('All');

  readonly filter = output<string>();
}
