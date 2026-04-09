import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Static public pages — prerendered at build time
  { path: '',                   renderMode: RenderMode.Prerender },
  { path: 'features',           renderMode: RenderMode.Prerender },
  { path: 'app',                renderMode: RenderMode.Prerender },
  { path: 'apiariesandbeehives', renderMode: RenderMode.Prerender },
  { path: 'financial',          renderMode: RenderMode.Prerender },
  { path: 'harvestandfeeding',  renderMode: RenderMode.Prerender },
  { path: 'inspections',        renderMode: RenderMode.Prerender },
  { path: 'help',               renderMode: RenderMode.Prerender },
  { path: 'privacy',            renderMode: RenderMode.Prerender },
  { path: 'blog',               renderMode: RenderMode.Prerender },

  // Blog articles — SSR on demand (content changes dynamically)
  { path: 'blog/:slug',         renderMode: RenderMode.Server },

  // Everything else (user dashboard, admin, auth) — client-side only
  { path: '**',                 renderMode: RenderMode.Client },
];
