/**
 * The section config shapes every public page is composed from. A page is a
 * typed config object and a wiring template — one key per section, in page
 * order — and it writes no CSS. Item shapes are the shared component types;
 * a call to action is always one `CtaLink` object.
 */
import { ImageConfig } from '../../shared/components/ui/image/image.model';
import { CtaLink } from '../../shared/components/ui/link-button/link-button.model';
import { RibbonMode } from '../../shared/components/info-sections/ribbon/ribbon';
import { InfoColumnsMode } from '../../shared/components/info-sections/info-columns/info-columns';
import { InfoColumnItem } from '../../shared/components/info-sections/info-columns/info-columns.model';
import { AccordionItem } from '../../shared/components/cta-sections/split-accordion/split-accordion.model';
import { FeatureRowItem } from '../../shared/components/cta-sections/features-row/features-row.model';
import { SplitListItem } from '../../shared/components/cta-sections/split-list/split-list.model';
import { FeatureItem } from '../../shared/components/cta-sections/features-list-cta/features-list-cta.model';
import { StoreLink } from '../../shared/components/cta-sections/application-download/application-download.model';
import { TextColumn } from '../../shared/components/info-sections/text-columns/text-columns.model';
import { SplitContentStep } from '../../shared/components/info-sections/split-content/split-content.model';
import { PricingTier } from '../../shared/components/cta-sections/pricing-tiers/pricing-tiers.model';

export interface HeroConfig {
  title: string;
  subtitle: string;
  image: ImageConfig;
  primaryCta: CtaLink;
  secondaryCta: CtaLink;
  /** HeroLeftContent only: three short facts under the actions. */
  proof?: string[];
}

export interface RibbonConfig {
  mode: RibbonMode;
  quote: string;
  author?: string;
}

export interface SplitAccordionConfig {
  title: string;
  image: ImageConfig;
  items: AccordionItem[];
}

export interface FeaturesRowConfig {
  items: FeatureRowItem[];
  cta: CtaLink;
}

export interface SplitListConfig {
  title: string;
  image: ImageConfig;
  items: SplitListItem[];
  cta: CtaLink;
}

export interface SplitContentConfig {
  title: string;
  description: string;
  image: ImageConfig;
  steps?: SplitContentStep[];
}

export interface TextCenterColumnConfig {
  title: string;
  subtitle: string;
  image: ImageConfig;
}

export interface FeaturesListCtaConfig {
  title: string;
  items: FeatureItem[];
  ctaHref: string;
  ctaLabel: string;
}

export interface ApplicationDownloadConfig {
  title: string;
  subtitle: string;
  logo: ImageConfig;
  storeLinks: StoreLink[];
}

export interface InfoColumnsConfig {
  mode?: InfoColumnsMode;
  title: string;
  items: InfoColumnItem[];
}

export interface CtaBannerConfig {
  title: string;
  description?: string;
  cta: CtaLink;
  /** A second, quieter link — the product pages point it at their blog category. */
  secondary?: CtaLink;
}

export interface PageIntroConfig {
  eyebrow?: string;
  title: string;
  lead?: string;
}

export interface PricingConfig {
  title: string;
  note?: string;
  tiers: PricingTier[];
}

export type TextColumnsConfig = TextColumn[];
