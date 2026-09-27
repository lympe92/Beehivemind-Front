import { describe, expect, it } from 'vitest';
import { formatContent } from './chat-message';

describe('formatContent', () => {
  it('renders bullet lines as a list, not as italics', () => {
    const html = formatContent('What to do:\n* Emergency fondant feeding\n* Close the entrance\nThen check again.');
    expect(html).toBe(
      '<p>What to do:</p><ul><li>Emergency fondant feeding</li><li>Close the entrance</li></ul><p>Then check again.</p>'
    );
    expect(html).not.toContain('<em>');
  });

  it('renders a numbered list in order and keeps inline emphasis', () => {
    const html = formatContent('1. **Feed** fondant\n2. Check *stores* again\n\nMy view: wait.');
    expect(html).toBe(
      '<ol><li><strong>Feed</strong> fondant</li><li>Check <em>stores</em> again</li></ol><p>My view: wait.</p>'
    );
  });

  it('keeps single line breaks inside a paragraph and escapes html', () => {
    expect(formatContent('a <b>\nb')).toBe('<p>a &lt;b&gt;<br>b</p>');
    expect(formatContent('use `x`')).toBe('<p>use <code>x</code></p>');
  });

  it('does not read a multiplication sign or a lone star as emphasis', () => {
    expect(formatContent('3 * 4 * 5')).toBe('<p>3 * 4 * 5</p>');
    expect(formatContent('* only a bullet')).toBe('<ul><li>only a bullet</li></ul>');
  });
});
