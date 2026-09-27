import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AiMessage } from '../../../../core/models/ai-chat.model';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Bold, italic and code inside one line. The line's list marker is gone by now. */
function formatInline(line: string): string {
  return line
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic: a starred run that touches its stars on both sides, so
    // "3 * 4 * 5" stays arithmetic.
    .replace(/(^|[^*\w])\*(\S(?:[^*\n]*?\S)?)\*(?=[^*\w]|$)/g, '$1<em>$2</em>')
    .replace(/`([^`]+?)`/g, '<code>$1</code>');
}

const BULLET  = /^\s*[-*•]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

/**
 * The little markdown the assistant emits: paragraphs, `-`/`*` bullets and
 * numbered lists (its list of the app's actions), bold, italic and code.
 * Lists are read line by line before the inline pass, so a `* item` is a
 * bullet and never the start of an italic run — the model's bullet lists used
 * to come out as one long italic sentence.
 */
export function formatContent(content: string): string {
  const lines = escapeHtml(content.replace(/\r\n?/g, '\n')).split('\n');
  const out: string[] = [];
  let paragraph: string[] = [];
  let list: { tag: 'ul' | 'ol'; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length) out.push(`<p>${paragraph.map(formatInline).join('<br>')}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (list) out.push(`<${list.tag}>${list.items.map(i => `<li>${formatInline(i)}</li>`).join('')}</${list.tag}>`);
    list = null;
  };

  for (const line of lines) {
    const bullet   = line.match(BULLET);
    const numbered = line.match(NUMBERED);
    const tag: 'ul' | 'ol' | null = bullet ? 'ul' : numbered ? 'ol' : null;

    if (tag) {
      flushParagraph();
      if (list && list.tag !== tag) flushList();
      list ??= { tag, items: [] };
      list.items.push((bullet ?? numbered)![1]);
    } else if (line.trim() === '') {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();

  return out.join('');
}

@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './chat-message.html',
  styleUrl: './chat-message.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatMessageComponent {
  message = input.required<AiMessage>();

  formattedContent = computed(() => formatContent(this.message().content));
  isUser = computed(() => this.message().role === 'user');
}
