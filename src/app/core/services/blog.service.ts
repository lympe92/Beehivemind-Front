import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestService } from './request.service';
import { ApiResponse } from '../models/api-response.model';
import { ArticleModel, BlogCategoryModel } from '../models/article.model';

/**
 * The public blog's data layer.
 *
 * No store: the marketing zone has none, and it does not need one. These calls
 * run during the server render, and `provideClientHydration()`'s transfer cache
 * carries the result into the browser, so the page is server-rendered and the
 * client does not fetch it a second time.
 *
 * No `fromApi()` mapper either — unusually for this repo. The article shape is
 * the one thing the frontend does not own: `SeoService` and the sitemap both
 * read the API's own field names, so renaming them here would only create two
 * spellings of the same document.
 */
@Injectable({ providedIn: 'root' })
export class BlogService {
  private request = inject(RequestService);

  getPosts(params: { category?: string; tag?: string; perPage?: number } = {}): Observable<ApiResponse<ArticleModel[]>> {
    const query = new URLSearchParams();
    if (params.category) query.set('category', params.category);
    if (params.tag) query.set('tag', params.tag);
    query.set('per_page', String(params.perPage ?? 100));

    return this.request.getRequest<ArticleModel[]>(`blog/posts?${query.toString()}`);
  }

  getPost(slug: string): Observable<ApiResponse<ArticleModel>> {
    return this.request.getRequest<ArticleModel>(`blog/posts/${encodeURIComponent(slug)}`);
  }

  getCategories(): Observable<ApiResponse<BlogCategoryModel[]>> {
    return this.request.getRequest<BlogCategoryModel[]>('blog/categories');
  }
}
