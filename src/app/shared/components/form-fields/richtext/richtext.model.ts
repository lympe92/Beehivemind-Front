/**
 * What the editor writes into its form control.
 *
 * Both halves are persisted: `html` is what a reader (and a crawler) sees,
 * `json` is the editor document, so re-opening a post restores exactly what was
 * saved. Parsing the HTML back would lose anything the schema allows but the
 * serialiser flattens.
 */
export interface RichTextValue {
  html: string;
  json: unknown | null;
}

export const EMPTY_RICH_TEXT: RichTextValue = { html: '', json: null };

/** TipTap serialises an empty document as this; it is not real content. */
export function isRichTextEmpty(value: RichTextValue | null | undefined): boolean {
  const html = (value?.html ?? '').trim();
  return html === '' || html === '<p></p>';
}
