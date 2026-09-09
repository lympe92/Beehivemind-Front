import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RequestService } from '../../../../core/services/request.service';
import { ModalService } from '../../../../core/modal/modal.service';
import { ColumnDef, DataTableComponent, TablePagination } from '../../../../shared/components/ui/data-table/data-table';
import { CardComponent } from '../../../../shared/components/ui/card/card';
import { AppErrorComponent } from '../../../../shared/components/ui/app-error/app-error';
import { AdminBlogCategory, AdminPost } from '../blog.types';
import { environment } from '../../../../../environments/environment';

/**
 * The blog's desk: everything written, published or not, newest work first.
 *
 * Admin-zone pattern — direct `RequestService`, local signals, server-side
 * pagination, no store. Editing is a page rather than a modal (an article does
 * not fit in one), so the row's primary action is a router link.
 */
@Component({
  selector: 'app-admin-blog-posts',
  standalone: true,
  imports: [SlicePipe, FormsModule, RouterLink, DataTableComponent, CardComponent, AppErrorComponent],
  templateUrl: './blog-posts.html',
})
export class BlogPostsComponent implements OnInit {
  private request = inject(RequestService);
  private modal   = inject(ModalService);
  private router  = inject(Router);

  posts      = signal<AdminPost[]>([]);
  categories = signal<AdminBlogCategory[]>([]);
  loading    = signal(true);
  error      = signal<string | null>(null);
  page       = signal(1);
  totalPages = signal(1);
  total      = signal(0);

  search = '';
  statusFilter = '';
  categoryFilter = '';

  readonly columns: ColumnDef[] = [
    { key: 'title', label: 'Title' },
    { key: 'category_name', label: 'Category', width: '160px' },
    { key: 'status', label: 'Status', width: '130px' },
    { key: 'published_at', label: 'Published', width: '130px' },
    { key: 'updated_at', label: 'Updated', width: '130px' },
  ];

  readonly tablePagination = computed<TablePagination>(() => ({
    page: this.page(),
    totalPages: this.totalPages(),
    total: this.total(),
  }));

  ngOnInit(): void {
    this.loadCategories();
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    const query = new URLSearchParams({ page: String(this.page()) });
    if (this.search) query.set('search', this.search);
    if (this.statusFilter) query.set('status', this.statusFilter);
    if (this.categoryFilter) query.set('category_id', this.categoryFilter);

    this.request.getRequest<AdminPost[]>(`admin/blog/posts?${query.toString()}`).subscribe({
      next: res => {
        this.posts.set(res.data ?? []);
        this.totalPages.set(res.meta?.total_pages ?? 1);
        this.total.set(res.meta?.total ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('The post list did not load.');
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

  applyFilters(): void {
    this.page.set(1);
    this.load();
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  create(): void {
    this.router.navigate(['/admin/blog/new']);
  }

  /** Where the post lives (or will live) on the public site. */
  publicUrl(post: AdminPost): string {
    return `${environment.appUrl}/blog/${post.slug}`;
  }

  statusLabel(post: AdminPost): string {
    if (post.status === 'published') return post.is_live ? 'Live' : 'Publishing';
    if (post.status === 'scheduled') return 'Scheduled';
    return 'Draft';
  }

  statusClass(post: AdminPost): string {
    if (post.status === 'published' && post.is_live) return 'app-badge--active';
    if (post.status === 'scheduled') return 'app-badge--recurring';
    return 'app-badge--neutral';
  }

  togglePublish(post: AdminPost): void {
    const action = post.status === 'published' ? 'unpublish' : 'publish';
    this.request.postRequest(`admin/blog/posts/${post.id}/${action}`, {}).subscribe({
      next: () => this.load(),
    });
  }

  async remove(post: AdminPost): Promise<void> {
    const confirmed = await this.modal.confirm({
      title: 'Delete this post?',
      message: post.status === 'published'
        ? `/blog/${post.slug} is live. Deleting it makes that address return 404, and any link pointing at it stops working.`
        : `“${post.title}” has not been published. Deleting it removes the draft.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!confirmed) return;

    this.request.deleteRequest(`admin/blog/posts/${post.id}`).subscribe({
      next: () => this.load(),
    });
  }
}
