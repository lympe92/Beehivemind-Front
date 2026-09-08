import { Component, computed, signal } from '@angular/core';
import { PageIntroComponent } from '../../../shared/components/info-sections/page-intro/page-intro';
import { PostListComponent } from '../../../shared/components/info-sections/post-list/post-list';
import { CtaBannerComponent } from '../../../shared/components/cta-sections/cta-banner/cta-banner';
import { CtaBannerConfig, PageIntroConfig } from '../public-page.model';
import { POSTS } from './posts.data';

interface BlogPageConfig {
  intro: PageIntroConfig;
  ctaBanner: CtaBannerConfig;
}

/**
 * The blog index. The category chips filter the list the page already has —
 * no route, no fetch. "All" first, then the tags in the order the posts
 * declare them, so the row does not reshuffle as posts are added.
 */
@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [PageIntroComponent, PostListComponent, CtaBannerComponent],
  templateUrl: './blog.html',
})
export class BlogComponent {
  readonly page: BlogPageConfig = {
    intro: {
      eyebrow: 'Blog',
      title: 'Notes on keeping bees with better records',
      lead: 'What the data from thousands of inspections tells us, and how to use the app well.',
    },
    ctaBanner: {
      title: 'Start keeping better records',
      description: 'Create an account, add your apiaries, and record your next inspection by voice.',
      cta: { label: 'Get Started', routerLink: '/auth/register', variant: 'outline' },
    },
  };

  readonly tags = ['All', ...POSTS.reduce<string[]>(
    (acc, post) => (post.tag && !acc.includes(post.tag) ? [...acc, post.tag] : acc),
    [],
  )];

  readonly activeTag = signal('All');

  readonly visible = computed(() =>
    this.activeTag() === 'All' ? POSTS : POSTS.filter(post => post.tag === this.activeTag()),
  );
}
