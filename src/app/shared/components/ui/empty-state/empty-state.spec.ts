import { TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';
import { EmptyStateComponent } from './empty-state';

function render(inputs: Record<string, unknown>) {
  const fixture = TestBed.createComponent(EmptyStateComponent);
  for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('EmptyStateComponent', () => {
  const base = { icon: 'inspection', heading: 'No inspections yet', text: 'An inspection is what you saw.' };

  it('draws the icon, the heading and the sentence inside its own card', () => {
    const { el } = render(base);

    expect(el.querySelector('.card > .card__body.empty-state')).not.toBeNull();
    expect(el.querySelector('h2')?.textContent?.trim()).toBe('No inspections yet');
    expect(el.querySelector('p')?.textContent?.trim()).toBe('An inspection is what you saw.');
    const path = el.querySelector('.empty-state__icon svg path');
    expect(path?.namespaceURI).toBe('http://www.w3.org/2000/svg');
  });

  it('has no button without a label', () => {
    const { el } = render(base);
    expect(el.querySelector('button')).toBeNull();
  });

  it('emits when its button is pressed', () => {
    const { fixture, el } = render({ ...base, buttonLabel: 'Add inspection' });
    let clicks = 0;
    fixture.componentInstance.buttonClick.subscribe(() => clicks++);

    const button = el.querySelector('button.app-btn--primary') as HTMLButtonElement;
    expect(button.textContent?.trim()).toBe('Add inspection');
    button.click();
    expect(clicks).toBe(1);
  });

  it('leaves the card out when it sits inside one', () => {
    const { el } = render({ ...base, framed: false, icon: 'category' });
    expect(el.querySelector('.card')).toBeNull();
    expect(el.querySelector('.empty-state')).not.toBeNull();
    expect(el.querySelector('[data-icon="category"] svg circle')).not.toBeNull();
  });
});
