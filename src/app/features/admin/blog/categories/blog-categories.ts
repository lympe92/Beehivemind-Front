import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RequestService } from '../../../../core/services/request.service';
import { ModalService } from '../../../../core/modal/modal.service';
import { ColumnDef, DataTableComponent } from '../../../../shared/components/ui/data-table/data-table';
import { CardComponent } from '../../../../shared/components/ui/card/card';
import { AppErrorComponent } from '../../../../shared/components/ui/app-error/app-error';
import { FormModalComponent } from '../../../../shared/components/ui/modal/form-modal/form-modal';
import { DynamicField } from '../../../../core/models/form.model';
import { syncValidators } from '../../../../shared/components/ui/form/validators.config';
import { AdminBlogCategory } from '../blog.types';

interface CategoryFormValue {
  name: string;
  slug: string;
  description: string;
  meta_title: string;
  meta_description: string;
  sort_order: number | string;
}

/**
 * Blog categories.
 *
 * Each one is a public archive page (`/blog/category/:slug`), which is why the
 * form asks for a meta title and description rather than only a name: the
 * archive has to describe itself to a search engine, and "Treatments" alone
 * does not.
 */
@Component({
  selector: 'app-admin-blog-categories',
  standalone: true,
  imports: [RouterLink, DataTableComponent, CardComponent, AppErrorComponent],
  templateUrl: './blog-categories.html',
})
export class BlogCategoriesComponent implements OnInit {
  private request = inject(RequestService);
  private modal   = inject(ModalService);

  categories = signal<AdminBlogCategory[]>([]);
  loading    = signal(true);
  error      = signal<string | null>(null);

  readonly columns: ColumnDef[] = [
    { key: 'name', label: 'Name' },
    { key: 'slug', label: 'Slug' },
    { key: 'post_count', label: 'Posts', width: '90px' },
    { key: 'sort_order', label: 'Order', width: '90px' },
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.request.getRequest<AdminBlogCategory[]>('admin/blog/categories').subscribe({
      next: res => {
        this.categories.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('The category list did not load.');
        this.loading.set(false);
      },
    });
  }

  private fields(row: AdminBlogCategory | null): DynamicField[] {
    return [
      {
        name: 'name', type: 'text', label: 'Name', size: 'half',
        placeholder: 'e.g. Treatments', value: row?.name ?? '',
        syncValidators: [syncValidators.required(), syncValidators.maxLength(80)],
      },
      {
        // Left blank, the API derives one. Typing one after the archive has
        // been linked to changes a live URL.
        name: 'slug', type: 'text', label: 'Slug (optional)', size: 'half',
        placeholder: 'Derived from the name', value: row?.slug ?? '',
      },
      {
        name: 'description', type: 'textarea', label: 'Description', size: 'full',
        placeholder: 'One line, shown under the heading on the archive page.',
        value: row?.description ?? '',
        syncValidators: [syncValidators.maxLength(500)],
      },
      {
        name: 'meta_title', type: 'text', label: 'Meta title', size: 'full',
        placeholder: 'Falls back to the name', value: row?.meta_title ?? '',
        syncValidators: [syncValidators.maxLength(120)],
      },
      {
        name: 'meta_description', type: 'textarea', label: 'Meta description', size: 'full',
        placeholder: 'Falls back to the description', value: row?.meta_description ?? '',
        syncValidators: [syncValidators.maxLength(300)],
      },
      {
        name: 'sort_order', type: 'number', label: 'Order', size: 'half',
        placeholder: 'Lower comes first', value: row?.sort_order ?? 0,
        syncValidators: [syncValidators.rangeNumber({ min: 0, max: 999 })],
      },
    ];
  }

  private toPayload(value: CategoryFormValue): Record<string, unknown> {
    return {
      name: value.name,
      slug: value.slug || null,
      description: value.description || null,
      meta_title: value.meta_title || null,
      meta_description: value.meta_description || null,
      sort_order: Number(value.sort_order) || 0,
    };
  }

  async openCreate(): Promise<void> {
    const result = await this.modal.open<CategoryFormValue>(FormModalComponent, {
      type: 'center',
      data: { title: 'New category', fields: this.fields(null), submitLabel: 'Create', cancelLabel: 'Cancel' },
    });
    if (!result) return;

    this.request.postRequest('admin/blog/categories', this.toPayload(result)).subscribe({
      next: () => this.load(),
    });
  }

  async openEdit(category: AdminBlogCategory): Promise<void> {
    const result = await this.modal.open<CategoryFormValue>(FormModalComponent, {
      type: 'center',
      data: { title: 'Edit category', fields: this.fields(category), submitLabel: 'Save', cancelLabel: 'Cancel' },
    });
    if (!result) return;

    this.request.putRequest(`admin/blog/categories/${category.id}`, this.toPayload(result)).subscribe({
      next: () => this.load(),
    });
  }

  async remove(category: AdminBlogCategory): Promise<void> {
    const count = category.post_count ?? 0;
    const plural = count === 1 ? '' : 's';
    const confirmed = await this.modal.confirm({
      title: 'Delete this category?',
      message: count
        ? `${count} post${plural} will be left uncategorised. They stay published, but /blog/category/${category.slug} starts returning 404.`
        : `Nothing is filed under ${category.name}.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!confirmed) return;

    this.request.deleteRequest(`admin/blog/categories/${category.id}`).subscribe({
      next: () => this.load(),
    });
  }
}
