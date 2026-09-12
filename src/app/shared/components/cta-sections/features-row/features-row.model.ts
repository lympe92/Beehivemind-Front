export interface FeatureRowItem {
  title: string;
  description: string;
  /** Optional link under the copy — same shape as `AccordionItem`'s. */
  linkHref?: string;
  linkLabel?: string;
}
