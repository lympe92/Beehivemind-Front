import type { TutorialId } from '../onboarding/tutorials';

/**
 * "How this page works": what the top bar's help button shows for the page in
 * front of the user. Every word of it is data in this file; the panel
 * (`shared/components/ui/modal/page-help-modal/`) only draws an entry, and a
 * route names its entry in `data: { help: … }` (`features/user/user.routes.ts`).
 * A route with no entry has no button.
 */
export interface PageHelp {
  /** The page's name, as the sidebar says it. */
  title: string;
  /** What the page is for, in a sentence or two. */
  about: string;
  /** Optional. A direct file URL the browser can play; the panel is text only without it. */
  video?: PageHelpVideo;
  /** Optional blocks between the introduction and the actions, for what a page needs explained beyond its buttons. */
  notes?: PageHelpNote[];
  /** One line per thing the page lets you do, named as its control is. */
  actions: PageHelpAction[];
  /** The "Getting started" tutorial that walks through this page, if there is one. */
  tutorial?: TutorialId;
}

export interface PageHelpVideo {
  src: string;
  /** Said under the player and to a screen reader. */
  title: string;
  poster?: string;
}

export interface PageHelpNote {
  heading: string;
  text: string;
}

export interface PageHelpAction {
  /** The control's own words: "+ Add", "Edit", "Delete". */
  label: string;
  text: string;
  /** It removes something for good: the label is drawn in the danger colour. */
  danger?: boolean;
}

const page = <T extends Record<string, PageHelp>>(entries: T): T => entries;

/**
 * A page's recording: `src/assets/help/<id>.mp4` and its poster, both written by
 * `audit/help-videos.mjs` from the scene of the same id. The title says what it shows.
 */
const tour = (id: string, title: string): PageHelpVideo => ({ src: `/assets/help/${id}.mp4`, poster: `/assets/help/${id}.jpg`, title });

export const PAGE_HELP = page({
  dashboard: {
    title: 'Dashboard',
    about: 'The page to open each day. It lists the hives that need you and charts what your inspections recorded over time.',
    video: tour('dashboard', 'The hives that need you, the filter and the charts'),
    actions: [
      { label: 'Hives needing attention', text: 'Every hive whose latest diagnosis is serious. Press one for its risks, what to do, what to avoid and why.' },
      { label: 'Filter', text: 'Apiary, then hive. The list and every chart follow it; with nothing chosen they show the whole account.' },
      { label: 'Charts', text: 'Drawn from your inspections. A chart with nothing recorded yet stays empty.' },
    ],
    tutorial: 'around',
  },

  todoList: {
    title: 'To-Do list',
    about: 'What is scheduled and what is late, in date order. The entries come from the treatments you apply: one for each dose still to give.',
    video: tour('todoList', 'Reading the list and ticking a dose'),
    actions: [
      { label: 'Tick a dose', text: 'Marks it as given. It moves under Done, and the treatment session counts it.' },
      { label: 'A late date', text: 'A dose whose day has passed is shown in red until it is ticked.' },
      { label: 'New entries', text: 'There is nothing to add here. Apply a treatment and its doses appear with their dates.' },
    ],
    tutorial: 'treatments',
  },

  calendar: {
    title: 'Calendar',
    about: 'Your inspections on the days they were made, one entry per hive.',
    video: tour('calendar', 'Moving through the calendar'),
    actions: [
      { label: 'Month, Week, Day', text: 'Changes how much time is on screen.' },
      { label: 'Today and the arrows', text: 'Move through time, or come back to today.' },
      { label: 'An entry', text: 'Opens Inspections.' },
    ],
    tutorial: 'around',
  },

  apiaries: {
    title: 'Apiaries',
    about: 'An apiary is a place where your hives stand. Every hive, inspection, feeding, harvest and treatment belongs to one, so the account starts here.',
    video: tour('apiaries', 'Adding, editing and deleting an apiary'),
    actions: [
      { label: '+ Add', text: 'A name, how many hives stand there and its position, set by pressing the spot on the map. The place in words and the date it was set up are optional. The hives are created with it.' },
      { label: 'Edit', text: 'Changes the name, the place, the date or the position on the map. Hives and records stay as they are. More hives are added from Beehives.' },
      { label: 'Delete', text: 'Removes the apiary with every hive in it, and every inspection, feeding and harvest of those hives. It cannot be undone.', danger: true },
      { label: 'The name', text: 'Opens the apiary\'s own page: the weather there, its hives, the to-dos still open and the status of every hive.' },
    ],
    tutorial: 'apiary',
  },

  apiaryCards: {
    title: 'Apiaries Details',
    about: 'The same apiaries as the table, one card each, with how many to-dos are still open in each one.',
    video: tour('apiaryCards', 'What an apiary card shows'),
    actions: [
      { label: '+ Add Apiary', text: 'A name, how many hives stand there and its position, set by pressing the spot on the map. The place in words and the date are optional.' },
      { label: 'Edit', text: 'Changes the name, the place, the date or the position on the map. Hives and records stay as they are.' },
      { label: 'Delete', text: 'Removes the apiary with every hive in it, and every inspection, feeding and harvest of those hives. It cannot be undone.', danger: true },
    ],
    tutorial: 'apiary',
  },

  apiaryMap: {
    title: 'Map',
    about: 'Every apiary that has a position, on one map. An apiary gets its position in its Add or Edit form, by pressing the spot on the map there.',
    video: tour('apiaryMap', 'Your apiaries on the map'),
    actions: [
      { label: 'An apiary is missing', text: 'It has no position yet. Edit it from Apiaries and place it on the map.' },
    ],
    tutorial: 'apiary',
  },

  apiaryView: {
    title: 'One apiary',
    about: 'Everything about one apiary on one page: the weather there, how many hives it has, the to-dos still open, and how each hive is doing.',
    video: tour('apiaryView', 'One apiary: weather, hive status and treatments'),
    actions: [
      { label: 'Edit', text: 'Changes the apiary\'s name, place, date or position on the map.' },
      { label: 'Hive status', text: 'Every hive with the status of its latest diagnosis, the date it was last inspected and its main risk. Press a row for the full reading.' },
      { label: 'Treatment sessions', text: 'The treatments applied in this apiary. Delete removes a session and its doses from the To-Do list.', danger: true },
    ],
    tutorial: 'apiary',
  },

  beehives: {
    title: 'Beehives',
    about: 'Every hive, by apiary. A hive has a number, not a name; the numbers are unique inside an apiary and new hives take the next ones.',
    video: tour('beehives', 'Adding hives, the QR code, and deleting a hive'),
    actions: [
      { label: 'Create', text: 'Choose an apiary in the filter first. Then enter how many hives to add: they are created at once and numbered after the last one.' },
      { label: 'Edit', text: 'Changes the hive\'s number. A number already used in that apiary is refused.' },
      { label: 'QR', text: 'Shows the hive\'s QR code, which can be downloaded as a picture.' },
      { label: 'Delete', text: 'Removes the hive with every inspection, feeding and harvest recorded on it. If it has a queen you are asked whether she is gone too or moved to another hive. It cannot be undone.', danger: true },
    ],
    tutorial: 'apiary',
  },

  treatments: {
    title: 'Treatments',
    about: 'A treatment type is a treatment written down once: its name, the disease, the product and the dose. You then apply it to hives as often as you need.',
    video: tour('treatments', 'Writing a treatment type and applying it'),
    actions: [
      { label: '+ New Type', text: 'Name, disease and product; the dose and notes are optional. A recurring type also holds the days between doses and how many times it repeats.' },
      { label: 'Apply Treatment', text: 'Starts a session: this type, the hives you tick and a start date. One dose is scheduled for each date the type calls for, and each appears on the To-Do list.' },
      { label: 'Edit', text: 'Changes the type. Sessions already started keep the doses they were given.' },
      { label: 'Delete', text: 'Removes the type and every session started from it, with their doses. It cannot be undone.', danger: true },
    ],
    tutorial: 'treatments',
  },

  treatmentSessions: {
    title: 'Treatment sessions',
    about: 'A session is one treatment type applied to a set of hives from a start date. Each one shows how many of its doses are done.',
    video: tour('treatmentSessions', 'Starting a session and following its doses'),
    actions: [
      { label: '+ Apply Treatment', text: 'Starts a session: a type, the hives and a start date.' },
      { label: 'Doses', text: 'A dose is ticked on the To-Do list, on the day it is given. The count here follows.' },
      { label: 'Delete', text: 'Removes the session and its doses, from here and from the To-Do list. It cannot be undone.', danger: true },
    ],
    tutorial: 'treatments',
  },

  inspections: {
    title: 'Inspections',
    about: 'An inspection is what you saw in one hive on one visit. Each one is read by rules as soon as it is saved, and that reading is its Status.',
    video: tour('inspections', 'Recording an inspection and reading its diagnosis'),
    actions: [
      { label: '+ Add Record', text: 'One hive, one date: frames, population, pollen, honey, eggs, closed brood, the queen and any sign of disease. A hive takes one inspection per day.' },
      { label: 'Status', text: 'The badge on each row is the diagnosis. Press it for the risks, what to do, what to avoid and why.' },
      { label: 'Edit', text: 'Corrects a reading. The hive itself cannot be changed; the diagnosis is read again.' },
      { label: 'Delete', text: 'Removes the inspection and its diagnosis. It cannot be undone.', danger: true },
      { label: 'Filter', text: 'Apiary, then hive. The table and the export both follow it.' },
      { label: 'Export', text: 'Downloads what the filter shows.' },
    ],
    tutorial: 'inspection',
  },

  feeding: {
    title: 'Feeding',
    about: 'A feeding is what you gave on one day: the kind of food and the quantity per hive.',
    video: tour('feeding', 'Recording a feeding for a whole apiary'),
    actions: [
      { label: '+ Add Record', text: 'An apiary, a date, the feeding and food type, the quantity per hive and its unit. Leave the hive on "All beehives" to record it for the whole apiary.' },
      { label: 'Edit', text: 'Corrects the record.' },
      { label: 'Delete', text: 'Removes the record. It cannot be undone.', danger: true },
      { label: 'Filter', text: 'Apiary, then hive. The table and the export both follow it.' },
      { label: 'Export', text: 'Downloads what the filter shows.' },
    ],
    tutorial: 'feeding',
  },

  harvest: {
    title: 'Harvest',
    about: 'A harvest is what you took on one day: honey, pollen, royal jelly or propolis, and the total quantity.',
    video: tour('harvest', 'Recording a harvest'),
    actions: [
      { label: '+ Add Record', text: 'An apiary, a date, the product, the total quantity and its unit. Leave the hive on "All beehives" to record it for the whole apiary. The description is kept for honey only.' },
      { label: 'Edit', text: 'Corrects the record.' },
      { label: 'Delete', text: 'Removes the record. It cannot be undone.', danger: true },
      { label: 'Filter', text: 'Apiary, then hive. The table and the export both follow it.' },
      { label: 'Export', text: 'Downloads what the filter shows.' },
    ],
    tutorial: 'harvest',
  },

  financial: {
    title: 'Financials',
    about: 'What the bees cost and what they bring in. Every entry goes under a category, and the category says whether it is income or outgoing.',
    video: tour('financial', 'Categories, entries and the charts'),
    actions: [
      { label: 'Cost categories', text: 'Add the categories first: a name and whether it is income or outgoing. Deleting a category removes every entry under it.', danger: true },
      { label: 'Costs', text: 'An entry is a date, a name, a category and an amount. Money coming in is entered the same way, under an income category.' },
      { label: 'Charts', text: 'Income and outgoing by month for the last seven months, the year\'s totals, and each side split by category. They are drawn from the entries above.' },
      { label: 'Export', text: 'Downloads the entries.' },
    ],
    tutorial: 'costs',
  },

  profile: {
    title: 'Profile',
    about: 'Your account: your details, how you sign in, who works with you, your plan and your data.',
    video: tour('profile', 'Your details, security, team and data'),
    actions: [
      { label: 'Details', text: 'Your name, country and preferred unit. The country sets the season your hive advice follows.' },
      { label: 'Security', text: 'Change the password, or turn on two-step sign-in with an authenticator app and backup codes.' },
      { label: 'Team members', text: 'Invite someone by email. They get their own account and can view and edit everything except the plan and billing. Only the owner sees this card.' },
      { label: 'Plan', text: 'The plan you are on and how many hives it holds.' },
      { label: 'Your data', text: 'Downloads the account\'s records: choose the sections, the dates and the format. Nothing is removed.' },
      { label: 'Delete account', text: 'An owner deletes the team, its members\' accounts and every record. A team member deletes only their own account. It cannot be undone.', danger: true },
    ],
    tutorial: 'around',
  },
});

export type PageHelpId = keyof typeof PAGE_HELP;

/** The entry a route named, or null for a name this file does not know. */
export function pageHelp(id: unknown): PageHelp | null {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(PAGE_HELP, id) ? PAGE_HELP[id as PageHelpId] : null;
}
