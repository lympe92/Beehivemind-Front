import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { POSTS } from '../blog/posts.data';
import { Post } from '../../../shared/components/info-sections/post-list/post-list.model';

/**
 * One post, by slug. The header, hero image and body share the 68ch `.prose`
 * measure; the artwork never upscales past its natural width.
 */
@Component({
  selector: 'app-blog-article',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './blog-article.html',
})
export class BlogArticleComponent {
  private route = inject(ActivatedRoute);
  private titleService = inject(Title);

  private slug = toSignal(this.route.paramMap.pipe(map(p => p.get('slug') ?? '')), { initialValue: '' });

  readonly post = computed<Post | undefined>(() => {
    const post = POSTS.find(p => p.slug === this.slug());
    if (post) this.titleService.setTitle(`${post.title} | BeehiveMind`);
    return post;
  });
}
