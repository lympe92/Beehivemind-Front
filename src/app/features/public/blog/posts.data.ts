import { Post } from '../../../shared/components/info-sections/post-list/post-list.model';

/**
 * The blog's content. No content model exists anywhere in the repo, so this is
 * the shape a CMS would map onto. The four posts are illustrative: the
 * subjects come from what the product actually does, but a beekeeper should
 * write the real ones.
 */
export const POSTS: Post[] = [
  {
    slug: 'reading-closed-brood',
    title: 'What closed brood tells you three weeks early',
    excerpt:
      'Recording capped brood separately from eggs is the single most useful thing you can do in an inspection. Here is the arithmetic behind why.',
    date: '28 August 2026',
    tag: 'Inspections',
    readingTime: '6 min read',
    image: { src: 'assets/img/comb.webp', alt: 'Comb', width: 548, height: 542 },
    body: [
      { type: 'p', text: "A frame of capped brood is a promise. The bees inside it will emerge in roughly twelve days, and they will start foraging about a week after that. Count the capped frames and you know, with less guesswork than any other reading, what the hive's workforce looks like at the end of the month." },
      { type: 'p', text: 'This is why Beehivemind records open and closed brood as two separate figures rather than one. Eggs and uncapped larvae tell you what the queen is doing right now. Capped brood tells you what the colony will be able to do later. Collapsing them into a single “brood” number throws away the timing, and the timing is the part you can act on.' },
      { type: 'h2', text: 'Reading the pair together' },
      { type: 'p', text: 'High open brood with low closed brood usually means the queen has only recently come into her stride — a new queen, or one recovering from a dearth. The hive will look thin for another fortnight and then improve on its own.' },
      { type: 'p', text: 'The reverse — plenty of capped brood and almost no eggs — is the reading worth stopping for. It means laying has dropped off. Sometimes that is seasonal. Sometimes the queen has failed, and you have about two weeks of emerging bees to notice before the population starts falling.' },
      { type: 'h2', text: 'Why the app asks for frames, not cells' },
      { type: 'p', text: 'Every quantity in Beehivemind is relative to a whole frame, including the halves you round to. Counting cells is more precise and nobody does it twice. Counting frames is a judgement you can make with a frame in your hands and a phone in your pocket, and it stays consistent across a season — which is what makes the chart worth reading at the end of it.' },
    ],
  },
  {
    slug: 'hands-free-inspections',
    title: 'Why we built the app to be used without looking at it',
    excerpt:
      'Every second spent tapping a phone over an open hive is a second the bees are getting warmer and you are getting stung. The interface is the problem.',
    date: '12 August 2026',
    tag: 'The app',
    readingTime: '4 min read',
    image: { src: 'assets/img/bee4.webp', alt: 'Bee', width: 512, height: 358 },
    body: [
      { type: 'p', text: 'An inspection is a two-handed job. You are holding a frame that weighs two kilos, wearing gloves, and standing over thirty thousand insects that would rather you left. Any records system that needs a finger on a screen has already lost.' },
      { type: 'h2', text: 'The checklist problem' },
      { type: 'p', text: 'The traditional answer is a paper checklist and a pencil in your veil. It works, and it produces a stack of sheets nobody transcribes. The digital answer has usually been the same checklist on a screen, which is worse: it takes longer, and you cannot do it in gloves.' },
      { type: 'p', text: 'So the app does not have a checklist. It has ten phrases. You learn them in an afternoon and then the phone stays in your pocket while you work, confirming each reading with a beep so you know it landed without looking.' },
      { type: 'h2', text: 'Offline, on purpose' },
      { type: 'p', text: 'Recognition runs on the device. Apiaries are in places without signal — that is usually why they are good apiaries — and a records system that needs a connection to record is a records system that fails on the days you most need it. The inspection uploads later, when the phone finds a network on the drive home.' },
    ],
  },
  {
    slug: 'treatment-schedules',
    title: 'Recurring treatments, and the doses people forget',
    excerpt:
      'A formic acid course is three applications a week apart. The third is the one that gets missed, and missing it is worse than never starting.',
    date: '30 July 2026',
    tag: 'Treatments',
    readingTime: '5 min read',
    image: { src: 'assets/img/hive.webp', alt: 'Hive', width: 417, height: 417 },
    body: [
      { type: 'p', text: 'Most varroa treatments are not a single event. They are a course: an application, an interval, another application, and often a third. The interval exists because the mites you are trying to reach are protected inside capped brood on the day you treat, and only emerge later.' },
      { type: 'p', text: 'Which means a half-finished course does something worse than nothing. It knocks back the mites that were exposed, leaves the ones that were not, and gives the survivors a thinner field to breed in.' },
      { type: 'h2', text: 'Scheduling the whole course at once' },
      { type: 'p', text: 'When you create a recurring treatment type in Beehivemind you give it an interval and a number of repetitions, and the app shows you the schedule it will generate before you commit: day 0, day 7, day 14. Applying that type to an apiary creates every dose as its own dated item, each one either pending, done, or explicitly skipped.' },
      { type: 'p', text: 'The point is not the record. The point is that on the fourteenth day there is something on your to-do list, attached to a specific apiary, that says the third dose is due — and that when you mark it done, the date it actually happened is stored next to the date it was meant to.' },
    ],
  },
  {
    slug: 'financial-per-hive',
    title: 'Cost per hive is the number that changes decisions',
    excerpt:
      'Most beekeepers know their total spend and their total income. Very few know which apiary is carrying the others.',
    date: '9 July 2026',
    tag: 'Financial',
    readingTime: '5 min read',
    image: { src: 'assets/img/jar.webp', alt: 'Jar', width: 417, height: 417 },
    body: [
      { type: 'p', text: 'A beekeeping business usually knows two numbers well: what came in this year, and what went out. Both are annual, both are aggregate, and neither tells you what to do differently next season.' },
      { type: 'h2', text: 'Categories are the whole trick' },
      { type: 'p', text: 'The useful version of the same data is spend by category against yield by apiary. Jars, feeding, tools and transport separated out; harvest recorded per hive. Once those two exist you can see that one apiary produced forty per cent of the honey on a quarter of the feed, and that another has cost you money for two years running.' },
      { type: 'p', text: 'That is a decision — move the hives, change the location, or stop keeping bees there. It is not visible in an annual total, and it takes about a minute a week to record.' },
    ],
  },
];
