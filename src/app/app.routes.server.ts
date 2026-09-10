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
  { path: 'pricing',            renderMode: RenderMode.Prerender },
  { path: 'about',              renderMode: RenderMode.Prerender },
  { path: 'contact',            renderMode: RenderMode.Prerender },
  { path: 'privacy',            renderMode: RenderMode.Prerender },
  { path: 'terms',              renderMode: RenderMode.Prerender },
  { path: 'delete-account',     renderMode: RenderMode.Prerender },

  // The blog index and the category archives list what the console has
  // published, so neither can be prerendered: a build-time copy would stop
  // showing new posts the moment one went up between deploys.
  { path: 'blog',                 renderMode: RenderMode.Server },
  { path: 'blog/category/:slug',  renderMode: RenderMode.Server },

  // Blog articles — rendered per request, never prerendered. The posts are
  // moving to a console, so the set of valid slugs is not known at build time:
  // prerendering them would 404 every article published after a deploy.
  //
  // That means this route cannot carry a static `status`, since a real slug and
  // an invented one share it. BlogArticleComponent marks the missing case at
  // render time — and the API being unreachable as a third — and server.ts
  // turns that into the status. See RENDER_STATUS_MARKER.
  { path: 'blog/:slug', renderMode: RenderMode.Server },

  // The old marketing URL. It is a router redirect, so it needs a redirect
  // status: without this it falls to the catch-all below and Angular rejects
  // the build ("404 is not a valid redirect response code"). 301, so the link
  // equity from the old CTAs moves to /contact.
  { path: 'pages/contact-us', renderMode: RenderMode.Server, status: 301 },

  // Signed-in zones — client-side only, and emphatically not 404s.
  { path: 'auth/**',  renderMode: RenderMode.Client },
  { path: 'user/**',  renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },

  // Everything else really is missing. Rendered (so the visitor gets the real
  // 404 page) and served with the status a crawler needs to see.
  { path: '**', renderMode: RenderMode.Server, status: 404 },
];
