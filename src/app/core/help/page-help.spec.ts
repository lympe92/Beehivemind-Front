import { describe, it, expect } from 'vitest';
import { Route } from '@angular/router';
import { userRoutes } from '../../features/user/user.routes';
import { TUTORIALS } from '../onboarding/tutorials';
import { PAGE_HELP, pageHelp } from './page-help';

/** Every `data.help` the user zone's routes name. */
function namedHelp(routes: Route[]): unknown[] {
  return routes.flatMap(r => [...(r.data?.['help'] !== undefined ? [r.data['help']] : []), ...namedHelp(r.children ?? [])]);
}

describe('PAGE_HELP', () => {
  const entries = Object.entries(PAGE_HELP);

  it('gives every entry a title, an introduction and at least one action, each named once', () => {
    for (const [id, help] of entries) {
      expect(help.title.trim(), id).not.toBe('');
      expect(help.about.trim(), id).not.toBe('');
      expect(help.actions.length, id).toBeGreaterThan(0);
      const labels = help.actions.map(a => a.label);
      expect(new Set(labels).size, id).toBe(labels.length);
      for (const action of help.actions) expect(action.text.trim(), `${id} · ${action.label}`).not.toBe('');
    }
  });

  it('names a video by its own id, the file the recorder writes for that page', () => {
    for (const [id, help] of entries) {
      if (!help.video) continue;
      expect(help.video.src, id).toBe(`/assets/help/${id}.mp4`);
      expect(help.video.poster, id).toBe(`/assets/help/${id}.jpg`);
      expect(help.video.title.trim(), id).not.toBe('');
    }
  });

  it('points only at tutorials the guide has', () => {
    const tutorials = TUTORIALS.map(t => t.id);
    for (const [id, help] of entries) {
      if (help.tutorial) expect(tutorials, id).toContain(help.tutorial);
    }
  });

  it('is named by a route for every entry, and every route names an entry that exists', () => {
    const named = namedHelp(userRoutes);
    for (const id of named) expect(pageHelp(id), String(id)).not.toBeNull();
    expect([...new Set(named)].sort()).toEqual(Object.keys(PAGE_HELP).sort());
  });

  it('answers null for a name it does not know', () => {
    expect(pageHelp('nothing')).toBeNull();
    expect(pageHelp(undefined)).toBeNull();
    expect(pageHelp('toString')).toBeNull();
  });
});
