import { OnboardingSeenKey, OnboardingSummary } from '../models/onboarding.model';

/**
 * The "Getting started" curriculum (brief ONBOARDING-2026-11-16, section 5;
 * Onboarding design, frame 2j): seven tutorials in the owner's order, and the
 * one pure function that turns the API's summary into what the hub shows.
 * The words are the brief's. A step's "done" reads only the summary, so work
 * done on the phone or by a team member ticks it the same as work done here.
 */

export type TutorialId = 'apiary' | 'feeding' | 'treatments' | 'inspection' | 'harvest' | 'costs' | 'around';

/** Where a step's button goes; `add` and friends are the pages' deep links (core/onboarding/deep-link.ts). */
export interface StepLink {
  path: string;
  queryParams?: Record<string, string | number>;
}

/** Something a step cannot start without (frame 2i). The button opens the tutorial that supplies it. */
export interface StepNeed {
  met: (s: OnboardingSummary) => boolean;
  heading: string;
  text: string;
  /** The waiting step's line, in place of its own. */
  waits: string;
  opens: TutorialId;
}

export interface StepDef {
  id: string;
  title: string;
  /** All the step says, while it is the current one. */
  text: string;
  /** Its first sentence, while it is later (frame 2e). */
  short: string;
  button: string;
  link: StepLink;
  done: (s: OnboardingSummary) => boolean;
  /** The button opens a form dialog: while it is open the guide is one line (frame 2g). */
  form?: boolean;
  /** That line's words, when not "Fill in the form and save". */
  hint?: string;
  /** Pressing the button is what ticks it ("seen: opened from this step"). */
  marksSeen?: OnboardingSeenKey;
  needs?: StepNeed;
  /** The team's owner only: an editor's tutorial has one step fewer. */
  ownerOnly?: boolean;
  /** Shown, never counted, and only where `optionalShown` says so. */
  optional?: boolean;
}

export interface TutorialDef {
  id: TutorialId;
  title: string;
  afterwards: string;
  closing: string;
  steps: StepDef[];
  /** The phone-app recommendation above the steps (frame 2f). Not a step, never ticked. */
  phoneApp?: boolean;
}

export const FORM_HINT = 'Fill in the form and save';

const hasApiary = (s: OnboardingSummary) => s.apiaries > 0;
const hasHive   = (s: OnboardingSummary) => s.beehives > 0;
const seen = (key: OnboardingSeenKey) => (s: OnboardingSummary) => s.progress.seen.includes(key);

const needsApiary = (record: string): StepNeed => ({
  met: hasApiary,
  heading: 'Add an apiary first',
  text: `A ${record} belongs to an apiary or to one hive in it, and you have no apiary yet.`,
  waits: 'Waits for the apiary.',
  opens: 'apiary',
});

const needsHive = (text: string): StepNeed => ({
  met: hasHive,
  heading: 'Add a hive first',
  text,
  waits: 'Waits for the hive.',
  opens: 'apiary',
});

export const TUTORIALS: readonly TutorialDef[] = [
  {
    id: 'apiary',
    title: 'Apiary and hive',
    afterwards: 'Keep every record under the place and the hive it belongs to.',
    closing: 'The apiary and its hive are in place. Every record from here on is kept under them.',
    steps: [
      {
        id: 'apiary.add',
        title: 'Add an apiary',
        text: 'An apiary is the place where your hives stand. Give it a name and click the map to mark where it is.',
        short: 'An apiary is the place where your hives stand.',
        button: 'Add apiary',
        link: { path: '/user/apiary', queryParams: { add: 1 } },
        done: hasApiary,
        form: true,
        // The Add apiary dialog creates nothing on Free when asked for more than one hive.
        hint: 'Name it, click the map, and enter 1 hive',
      },
      {
        id: 'apiary.hive',
        title: 'Add a hive',
        text: 'A hive is one colony. It has a number, not a name, and the app gives it the next one in its apiary.',
        short: 'A hive is one colony.',
        button: 'Add a hive',
        link: { path: '/user/beehives', queryParams: { add: 1 } },
        done: hasHive,
      },
    ],
  },
  {
    id: 'feeding',
    title: 'Feeding',
    afterwards: 'See what each apiary was fed, how much and when.',
    closing: 'Feeding lists every record by date. The filter at the top narrows it to one apiary or one hive.',
    steps: [
      {
        id: 'feeding.add',
        title: 'Record a feeding',
        text: 'A feeding is what you gave on one day: the kind of food and the quantity per hive. It goes to one hive, or to the whole apiary.',
        short: 'A feeding is what you gave on one day: the kind of food and the quantity per hive.',
        button: 'Add feeding',
        link: { path: '/user/feeding', queryParams: { add: 1 } },
        done: s => s.feedings > 0,
        form: true,
        needs: needsApiary('feeding record'),
      },
    ],
  },
  {
    id: 'treatments',
    title: 'Treatments',
    afterwards: 'Plan a treatment once and follow every dose until it is given.',
    closing: 'Treatment Sessions shows each session, its doses and how many are done.',
    steps: [
      {
        id: 'treatments.type',
        title: 'Describe the treatment',
        text: 'A treatment type is the treatment written down once: its name, the disease, the product and the dose. A recurring one also holds the days between doses and how many times it repeats.',
        short: 'A treatment type is the treatment written down once: its name, the disease, the product and the dose.',
        button: 'Add treatment type',
        link: { path: '/user/treatments', queryParams: { add: 'type' } },
        done: s => s.treatmentTypes > 0,
        form: true,
      },
      {
        id: 'treatments.session',
        title: 'Apply it to your hives',
        text: 'A session is that type applied to the hives you tick, from a start date. One dose is scheduled for each date the type calls for.',
        short: 'A session is that type applied to the hives you tick, from a start date.',
        button: 'Apply treatment',
        link: { path: '/user/treatments', queryParams: { add: 'session' } },
        done: s => s.treatmentSessions > 0,
        form: true,
        needs: needsHive('A session is applied to hives, and you have none yet.'),
      },
      {
        id: 'treatments.dose',
        title: 'Tick a dose when it is given',
        text: 'Every dose still to give is on the To-Do list with its date, and a late one is marked. Tick it there once the hives are treated.',
        short: 'Every dose still to give is on the To-Do list with its date.',
        button: 'Open To-Do',
        link: { path: '/user/todo/list' },
        done: s => s.treatmentDosesDone > 0,
      },
    ],
  },
  {
    id: 'inspection',
    title: 'Inspection and diagnosis',
    afterwards: 'Record what you saw in a hive and read what it needs.',
    closing: 'Every inspection is read the same way. Hives that need you are listed on the dashboard.',
    phoneApp: true,
    steps: [
      {
        id: 'inspection.add',
        title: 'Record an inspection',
        text: 'An inspection is what you saw in one hive on one visit: frames, population, honey, pollen, brood, the queen and any sign of disease. The form on the website takes the same readings by hand.',
        short: 'An inspection is what you saw in one hive on one visit: frames, population, honey, pollen, brood, the queen and any sign of disease.',
        button: 'Add inspection',
        link: { path: '/user/inspections', queryParams: { add: 1 } },
        done: s => s.inspections > 0,
        form: true,
        needs: needsHive('An inspection belongs to a hive, and you have none yet.'),
      },
      {
        id: 'inspection.diagnosis',
        title: 'Open its diagnosis',
        text: 'The inspection is read by rules the moment it is saved. The Status badge on its row opens the reading: the risks, what to do, what to avoid and why.',
        short: 'The inspection is read by rules the moment it is saved.',
        button: 'Open the diagnosis',
        link: { path: '/user/inspections', queryParams: { diagnosis: 'latest' } },
        done: seen('diagnosis'),
      },
    ],
  },
  {
    id: 'harvest',
    title: 'Harvest',
    afterwards: 'See what each apiary gave, by product and date.',
    closing: 'Harvest lists every record by date, and Export downloads what the filter shows.',
    steps: [
      {
        id: 'harvest.add',
        title: 'Record a harvest',
        text: 'A harvest is what you took on one day: honey, pollen, royal jelly or propolis, and the total quantity. It goes to one hive, or to the whole apiary. The phone app records a harvest by voice as well.',
        short: 'A harvest is what you took on one day: honey, pollen, royal jelly or propolis, and the total quantity.',
        button: 'Add harvest',
        link: { path: '/user/harvest', queryParams: { add: 1 } },
        done: s => s.harvests > 0,
        form: true,
        needs: needsApiary('harvest record'),
      },
    ],
  },
  {
    id: 'costs',
    title: 'Costs',
    afterwards: 'Follow what the bees cost and what they bring in, month by month.',
    closing: 'The charts on Financials are drawn from these entries.',
    steps: [
      {
        id: 'costs.category',
        title: 'Add a category',
        text: 'A category groups entries and marks them as income or outgoing. Every entry goes under one.',
        short: 'A category groups entries and marks them as income or outgoing.',
        button: 'Add category',
        link: { path: '/user/financial', queryParams: { add: 'category' } },
        done: s => s.costCategories > 0,
        form: true,
      },
      {
        id: 'costs.cost',
        title: 'Add a cost',
        text: 'An entry is a date, a name, a category and an amount. Money coming in is entered the same way, under an income category.',
        short: 'An entry is a date, a name, a category and an amount.',
        button: 'Add cost',
        link: { path: '/user/financial', queryParams: { add: 'cost' } },
        done: s => s.costs > 0,
        form: true,
      },
    ],
  },
  {
    id: 'around',
    title: 'Around the app',
    afterwards: 'Know where to look each day, and how to share your data or take it out.',
    // The brief's closing line for this one is the all-done state (2c), which
    // replaces the finished view once the other six are done too.
    closing: '',
    steps: [
      {
        id: 'around.dashboard',
        title: 'Read the dashboard',
        text: 'Hives needing attention lists every hive whose latest diagnosis is serious. The charts under it follow your inspections over time.',
        short: 'Hives needing attention lists every hive whose latest diagnosis is serious.',
        button: 'Open the dashboard',
        link: { path: '/user/dashboard' },
        done: seen('dashboard'),
        marksSeen: 'dashboard',
      },
      {
        id: 'around.calendar',
        title: 'See the calendar',
        text: 'The calendar shows your inspections on the days they were made. It sits beside the To-Do list in the sidebar.',
        short: 'The calendar shows your inspections on the days they were made.',
        button: 'Open the calendar',
        link: { path: '/user/todo/calendar' },
        done: seen('calendar'),
        marksSeen: 'calendar',
      },
      {
        id: 'around.export',
        title: 'Export your records',
        text: 'Inspections, Feeding, Harvest and Costs each have an Export button for what the filter shows. Your data, on Profile, downloads the whole account.',
        short: 'Inspections, Feeding, Harvest and Costs each have an Export button for what the filter shows.',
        button: 'Open Your data',
        link: { path: '/user/profile', queryParams: { show: 'data' } },
        done: seen('export'),
      },
      {
        id: 'around.team',
        title: 'Invite a team member',
        text: 'The data belongs to your team. A person you invite by email gets their own account and can view and edit everything except the plan and billing.',
        short: 'The data belongs to your team.',
        button: 'Invite member',
        link: { path: '/user/profile', queryParams: { add: 'invite' } },
        done: s => s.teamMembers + s.pendingInvitations > 0 || s.progress.seen.includes('team'),
        form: true,
        marksSeen: 'team',
        ownerOnly: true,
      },
      {
        id: 'around.assistant',
        title: 'Ask the assistant',
        text: 'It explains a diagnosis with that hive’s data in front of it, and never produces one.',
        short: 'It explains a diagnosis with that hive’s data in front of it, and never produces one.',
        button: 'Open the assistant',
        link: { path: '/user/ai-chat' },
        done: () => false,
        optional: true,
      },
    ],
  },
];

export const ALL_DONE_TITLE = 'All seven tutorials are done';
export const ALL_DONE_TEXT = 'You have set up, recorded and read every part of the app once. The tutorials stay under Getting started in the sidebar.';
export const UNKNOWN_DIAGNOSIS_CLOSING = 'No rule matched this inspection, so there is nothing to act on. The next one is read the same way.';

// ── State ──────────────────────────────────────────────────

/** `optional` is the assistant's row: shown, never counted. */
export type StepStatus = 'done' | 'current' | 'later' | 'optional';
export type TutorialStatus = 'done' | 'in-progress' | 'not-started';

export interface StepView {
  def: StepDef;
  /** 1-based among the counted steps; 0 for the optional row. */
  number: number;
  status: StepStatus;
}

export interface TutorialView {
  def: TutorialDef;
  /** Counted steps first, then the optional row when shown. */
  steps: StepView[];
  status: TutorialStatus;
  doneCount: number;
  /** Counted steps for this account (an editor's "Around the app" has 3). */
  total: number;
  current: StepView | null;
  /** The current step's missing prerequisite (frame 2i); null when it can be done now. */
  blockedBy: StepNeed | null;
}

export interface GuideView {
  tutorials: TutorialView[];
  doneCount: number;
  total: number;
  allDone: boolean;
  /** The hub's suggestion: the first tutorial in the owner's order not done and not blocked. */
  next: TutorialView | null;
}

export interface GuideContext {
  /** An invited editor: no owner-only step. */
  isEditor: boolean;
  /** `AiAssistantStatusService.enabled()`: the optional row exists only then. */
  assistant: boolean;
}

export function tutorialView(def: TutorialDef, s: OnboardingSummary, ctx: GuideContext): TutorialView {
  const counted = def.steps.filter(step => !step.optional && !(step.ownerOnly && ctx.isEditor));
  const firstOpen = counted.findIndex(step => !step.done(s));

  const steps: StepView[] = counted.map((step, i) => ({
    def: step,
    number: i + 1,
    status: step.done(s) ? 'done' : i === firstOpen ? 'current' : 'later',
  }));
  if (ctx.assistant) {
    for (const step of def.steps.filter(x => x.optional)) steps.push({ def: step, number: 0, status: 'optional' });
  }

  const doneCount = steps.filter(x => x.status === 'done').length;
  const current = firstOpen === -1 ? null : steps[firstOpen];
  const need = current?.def.needs;

  return {
    def,
    steps,
    status: doneCount === counted.length ? 'done' : doneCount > 0 ? 'in-progress' : 'not-started',
    doneCount,
    total: counted.length,
    current,
    blockedBy: need && !need.met(s) ? need : null,
  };
}

export function guideView(s: OnboardingSummary, ctx: GuideContext): GuideView {
  const tutorials = TUTORIALS.map(def => tutorialView(def, s, ctx));
  const open = tutorials.filter(t => t.status !== 'done');
  const doneCount = tutorials.length - open.length;
  return {
    tutorials,
    doneCount,
    total: tutorials.length,
    allDone: open.length === 0,
    next: open.find(t => !t.blockedBy) ?? open[0] ?? null,
  };
}

/** "1 step", "3 steps". */
export function stepCount(n: number): string {
  return `${n} step${n === 1 ? '' : 's'}`;
}
