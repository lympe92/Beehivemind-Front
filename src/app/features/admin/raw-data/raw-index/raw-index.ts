import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RequestService } from '../../../../core/services/request.service';
import { RAW_MODELS } from '../raw-data.models';

@Component({
  selector: 'app-raw-index',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './raw-index.html',
  styleUrl: './raw-index.scss',
})
export class RawIndexComponent implements OnInit {
  private request = inject(RequestService);

  counts = signal<Record<string, number>>({});
  models = Object.entries(RAW_MODELS).map(([key, cfg]) => ({ key, label: cfg.label }));

  ngOnInit(): void {
    this.request.getRequest<Record<string, number>>('admin/raw/counts').subscribe({
      next: (res) => this.counts.set(res.data),
    });
  }

  getCount(key: string): number {
    return this.counts()[key] ?? 0;
  }
}
