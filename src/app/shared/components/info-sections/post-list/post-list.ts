import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Post, PostChip } from './post-list.model';

/**
 * The blog index: hairline-separated rows, artwork left, copy right. Not cards
 * — a shadowed box would be the first on the whole site. When `chips` has more
 * than one entry a row of category links sits above the list; the chips are
 * labels in the structural voice, and the current one is an ink fill.
 *
 * The chips navigate rather than filter, because each category is a page of its
 * own that a search engine can rank.
 *
 * Usage: `<section app-post-list [posts]="…" [chips]="…"></section>`.
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
  chips = input<PostChip[]>([]);
  emptyMessage = input<string>('No posts in this category yet.');
}
