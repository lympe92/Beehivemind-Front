import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter, startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PublicFooterComponent } from '../footer/public-footer/public-footer';
import { PublicHeaderComponent } from '../header/public-header/public-header';
import { SeoService } from '../../core/services/seo.service';
import { SEO_CONFIG } from '../../core/services/seo.config';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, PublicFooterComponent, PublicHeaderComponent],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.scss',
})
export class PublicLayoutComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly seoService = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      startWith(null),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      debugger
      const seoKey = this.activatedRoute.firstChild?.snapshot.data?.['seoKey'];
      if (seoKey && SEO_CONFIG[seoKey]) {
        this.seoService.applySEO(SEO_CONFIG[seoKey]);
      }
    });
  }
}
