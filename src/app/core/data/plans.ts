import { PricingTier } from '../../shared/components/cta-sections/pricing-tiers/pricing-tiers.model';

/**
 * The plans as the public pages show them — the owner's pricing of
 * 2026-10-15: one hive free, up to fifty for €5 a month, more than fifty for
 * €10. /pricing and the home page's band both read this, so a price changes
 * in one place; so do `SOFTWARE_APPLICATION.offers` (seo.config.ts), the
 * llms.txt lines in server.ts, Terms §3, and on the API config/billing.php.
 *
 * Every plan has every feature: what a plan buys is hives. A first paid
 * plan starts with a 7-day free trial (config/billing.php `trial_days`).
 */
export const PLAN_TIERS: PricingTier[] = [
  {
    name: 'Free',
    price: '€0',
    period: 'forever',
    forWhom: 'One hive, to try it on your own bees.',
    includes: ['1 hive', 'Every feature, voice included', 'Offline recording', 'Your data exportable at any time'],
    cta: { label: 'Create an account', routerLink: '/auth/register' },
  },
  {
    name: 'Pro',
    price: '€5',
    period: '/ month',
    featured: true,
    forWhom: 'The working beekeeper, up to fifty hives.',
    includes: ['7 days free to start', 'Up to 50 hives, in any number of apiaries', 'Treatment schedules and reminders', 'Costs and income per hive', 'Weather per apiary', 'QR labels for every hive'],
    cta: { label: 'Start with Pro', routerLink: '/auth/register' },
  },
  {
    name: 'Pro Unlimited',
    price: '€10',
    period: '/ month',
    forWhom: 'Larger operations, more than fifty hives.',
    includes: ['7 days free to start', 'No hive limit', 'Everything in Pro'],
    cta: { label: 'Start with Pro Unlimited', routerLink: '/auth/register' },
  },
];

/**
 * Shown above the plans while everything is free for everyone (the admin
 * console's switch, read from GET billing/plans in the browser).
 */
export const FREE_FOR_ALL_NOTE =
  'Right now everything is free for everyone: every feature, no hive limit, nothing to pay. The plans below apply once paid plans start.';
