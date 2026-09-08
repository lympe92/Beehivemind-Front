import { CtaLink } from '../../ui/link-button/link-button.model';

export interface PricingTier {
  name: string;
  /** A price as written, including the currency: "€0", "€9", "Talk to us". */
  price: string;
  /** "forever", "/ month". Omit on a tier with no period. */
  period?: string;
  /** Marks the common choice: a 2px ink edge and a flag. At most one tier. */
  featured?: boolean;
  /** Who the tier is for, in one sentence. Read before the list. */
  forWhom: string;
  /** What this tier lifts. Four to five lines. */
  includes: string[];
  cta: CtaLink;
}
