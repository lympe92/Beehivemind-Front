import { describe, it, expect } from 'vitest';
import { OnboardingSeenKey, OnboardingSummary } from '../models/onboarding.model';
import { guideView, GuideContext, stepCount, TutorialId, TUTORIALS } from './tutorials';

function summary(over: Partial<OnboardingSummary> = {}, seen: OnboardingSeenKey[] = []): OnboardingSummary {
  return {
    apiaries: 0, beehives: 0, inspections: 0, feedings: 0, harvests: 0,
    treatmentTypes: 0, treatmentSessions: 0, treatmentDosesDone: 0,
    costs: 0, costCategories: 0, teamMembers: 0, pendingInvitations: 0,
    onboarding: 'active',
    progress: { seen, panel: 'open' },
    ...over,
  };
}

const owner: GuideContext = { isEditor: false, assistant: false };
const editor: GuideContext = { isEditor: true, assistant: false };

const tutorial = (s: OnboardingSummary, id: TutorialId, ctx = owner) =>
  guideView(s, ctx).tutorials.find(t => t.def.id === id)!;
const statuses = (s: OnboardingSummary, id: TutorialId, ctx = owner) =>
  tutorial(s, id, ctx).steps.map(x => x.status);

/** Everything an owner can do, done. */
const everything = summary({
  apiaries: 1, beehives: 1, inspections: 1, feedings: 1, harvests: 1,
  treatmentTypes: 1, treatmentSessions: 1, treatmentDosesDone: 1,
  costs: 1, costCategories: 1, pendingInvitations: 1,
}, ['diagnosis', 'dashboard', 'calendar', 'export']);

describe('the curriculum', () => {
  it('keeps the owner’s order and the brief’s step counts', () => {
    expect(TUTORIALS.map(t => t.id)).toEqual(['apiary', 'feeding', 'treatments', 'inspection', 'harvest', 'costs', 'around']);
    const g = guideView(summary(), owner);
    expect(g.tutorials.map(t => t.total)).toEqual([2, 1, 3, 2, 1, 2, 4]);
    // Fifteen counted steps for an owner.
    expect(g.tutorials.reduce((n, t) => n + t.total, 0)).toBe(15);
  });

  it('says "1 step" and "3 steps"', () => {
    expect(stepCount(1)).toBe('1 step');
    expect(stepCount(3)).toBe('3 steps');
  });
});

describe('Apiary and hive', () => {
  it('starts on the apiary, the hive later', () => {
    expect(statuses(summary(), 'apiary')).toEqual(['current', 'later']);
    expect(tutorial(summary(), 'apiary').status).toBe('not-started');
  });

  it('moves on to the hive once there is an apiary', () => {
    const t = tutorial(summary({ apiaries: 1 }), 'apiary');
    expect(t.steps.map(x => x.status)).toEqual(['done', 'current']);
    expect(t.status).toBe('in-progress');
    expect(t.doneCount).toBe(1);
  });

  it('arrives done from the wizard: one apiary, one hive', () => {
    expect(tutorial(summary({ apiaries: 1, beehives: 1 }), 'apiary').status).toBe('done');
  });

  it('is never blocked: the apiary is the first thing', () => {
    expect(tutorial(summary(), 'apiary').blockedBy).toBeNull();
  });
});

describe('Feeding and Harvest', () => {
  it.each(['feeding', 'harvest'] as const)('%s waits for an apiary', (id) => {
    const t = tutorial(summary(), id);
    expect(t.blockedBy?.heading).toBe('Add an apiary first');
    expect(t.blockedBy?.opens).toBe('apiary');
    expect(t.current?.status).toBe('current');
  });

  it('names its own record in the missing state', () => {
    expect(tutorial(summary(), 'feeding').blockedBy?.text)
      .toBe('A feeding record belongs to an apiary or to one hive in it, and you have no apiary yet.');
    expect(tutorial(summary(), 'harvest').blockedBy?.text)
      .toBe('A harvest record belongs to an apiary or to one hive in it, and you have no apiary yet.');
  });

  it('opens once there is an apiary, and ticks on a record', () => {
    expect(tutorial(summary({ apiaries: 1 }), 'feeding').blockedBy).toBeNull();
    expect(tutorial(summary({ apiaries: 1, feedings: 2 }), 'feeding').status).toBe('done');
    expect(tutorial(summary({ apiaries: 1, harvests: 1 }), 'harvest').status).toBe('done');
  });
});

describe('Treatments', () => {
  it('describes the type first, with no hive needed for it', () => {
    const t = tutorial(summary(), 'treatments');
    expect(t.steps.map(x => x.status)).toEqual(['current', 'later', 'later']);
    expect(t.blockedBy).toBeNull();
  });

  it('needs a hive from step 2 on', () => {
    const t = tutorial(summary({ treatmentTypes: 1 }), 'treatments');
    expect(t.current?.number).toBe(2);
    expect(t.blockedBy?.heading).toBe('Add a hive first');
    expect(t.blockedBy?.text).toBe('A session is applied to hives, and you have none yet.');
  });

  it('applies, then waits for a dose to be ticked', () => {
    const s = summary({ beehives: 1, treatmentTypes: 1, treatmentSessions: 1 });
    expect(statuses(s, 'treatments')).toEqual(['done', 'done', 'current']);
    expect(tutorial(s, 'treatments').status).toBe('in-progress');
    expect(tutorial({ ...s, treatmentDosesDone: 1 }, 'treatments').status).toBe('done');
  });
});

describe('Inspection and diagnosis', () => {
  it('waits for a hive', () => {
    const t = tutorial(summary({ apiaries: 1 }), 'inspection');
    expect(t.blockedBy?.text).toBe('An inspection belongs to a hive, and you have none yet.');
    expect(t.def.phoneApp).toBe(true);
  });

  it('records, then opens the diagnosis, which is a seen step', () => {
    const hive = { apiaries: 1, beehives: 1 };
    expect(statuses(summary(hive), 'inspection')).toEqual(['current', 'later']);
    expect(statuses(summary({ ...hive, inspections: 1 }), 'inspection')).toEqual(['done', 'current']);
    expect(tutorial(summary({ ...hive, inspections: 1 }, ['diagnosis']), 'inspection').status).toBe('done');
  });

  it('counts an inspection spoken into the phone app: the summary is the team’s', () => {
    expect(tutorial(summary({ beehives: 1, inspections: 1 }), 'inspection').current?.def.id).toBe('inspection.diagnosis');
  });
});

describe('Costs', () => {
  it('needs nothing first; the cost waits for its category by order', () => {
    expect(statuses(summary(), 'costs')).toEqual(['current', 'later']);
    expect(tutorial(summary(), 'costs').blockedBy).toBeNull();
    expect(statuses(summary({ costCategories: 1 }), 'costs')).toEqual(['done', 'current']);
    expect(tutorial(summary({ costCategories: 1, costs: 1 }), 'costs').status).toBe('done');
  });
});

describe('Around the app', () => {
  it('has four steps for an owner and three for an editor, who cannot invite', () => {
    expect(tutorial(summary(), 'around').total).toBe(4);
    const t = tutorial(summary(), 'around', editor);
    expect(t.total).toBe(3);
    expect(t.steps.some(x => x.def.ownerOnly)).toBe(false);
  });

  it('ticks the team step on an invitation, a member, or the step itself', () => {
    const three: OnboardingSeenKey[] = ['dashboard', 'calendar', 'export'];
    expect(tutorial(summary({}, three), 'around').status).toBe('in-progress');
    expect(tutorial(summary({ pendingInvitations: 1 }, three), 'around').status).toBe('done');
    expect(tutorial(summary({ teamMembers: 1 }, three), 'around').status).toBe('done');
    expect(tutorial(summary({}, [...three, 'team']), 'around').status).toBe('done');
    // An editor is done without it.
    expect(tutorial(summary({}, three), 'around', editor).status).toBe('done');
  });

  it('shows the assistant row only where the assistant is on, and never counts it', () => {
    expect(tutorial(summary(), 'around').steps.some(x => x.status === 'optional')).toBe(false);
    const t = tutorial(summary({}, ['dashboard', 'calendar', 'export', 'team']), 'around', { isEditor: false, assistant: true });
    expect(t.steps.at(-1)?.status).toBe('optional');
    expect(t.total).toBe(4);
    expect(t.status).toBe('done');
  });

  it('ticks dashboard, calendar and export in any order', () => {
    expect(statuses(summary({}, ['calendar']), 'around')).toEqual(['current', 'done', 'later', 'later']);
  });
});

describe('the hub', () => {
  it('suggests Apiary and hive to an empty account, and counts nothing done', () => {
    const g = guideView(summary(), owner);
    expect(g.next?.def.id).toBe('apiary');
    expect(g.doneCount).toBe(0);
    expect(g.total).toBe(7);
    expect(g.allDone).toBe(false);
  });

  it('suggests Feeding after the wizard, as frame 2a shows', () => {
    const g = guideView(summary({ apiaries: 1, beehives: 1 }), owner);
    expect(g.doneCount).toBe(1);
    expect(g.next?.def.id).toBe('feeding');
  });

  it('suggests in the owner’s order, whatever was done out of it', () => {
    const g = guideView(summary({ apiaries: 1, beehives: 1, feedings: 1, costCategories: 1, costs: 1 }), owner);
    expect(g.next?.def.id).toBe('treatments');
  });

  it('skips a blocked tutorial when suggesting', () => {
    // An apiary and no hive: Apiary and hive is still open, so it is next.
    expect(guideView(summary({ apiaries: 1 }), owner).next?.def.id).toBe('apiary');
    // Everything not needing a hive done; Treatments step 2 and Inspection wait for one.
    const s = summary({ apiaries: 1, feedings: 1, harvests: 1, treatmentTypes: 1, costCategories: 1, costs: 1, pendingInvitations: 1 },
      ['dashboard', 'calendar', 'export']);
    expect(guideView(s, owner).next?.def.id).toBe('apiary');
  });

  it('brings back Apiary and hive when the last hive is deleted', () => {
    const g = guideView({ ...everything, beehives: 0 }, owner);
    expect(g.allDone).toBe(false);
    expect(g.next?.def.id).toBe('apiary');
    expect(g.next?.current?.def.id).toBe('apiary.hive');
  });

  it('is all done when every tutorial is, with no suggestion', () => {
    const g = guideView(everything, owner);
    expect(g.allDone).toBe(true);
    expect(g.doneCount).toBe(7);
    expect(g.next).toBeNull();
  });

  it('is all done for an editor without the team step', () => {
    const s = { ...everything, pendingInvitations: 0 };
    expect(guideView(s, owner).allDone).toBe(false);
    expect(guideView(s, editor).allDone).toBe(true);
  });
});
