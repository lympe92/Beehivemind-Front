/* The scenes of the "How this page works" videos, one per PAGE_HELP entry
   (core/help/page-help.ts), keyed by the same id. A scene is the page it opens,
   what it does there with the director (`v`: say, point, click, type, choose,
   date, scroll, wait, el, field, inside), and, when it saves something,
   `write`: where the new row goes so the page lists it (the API is mocked). */

const D = '.cdk-overlay-container';
const TODAY = '2026-11-19';
const READ = 3200;

const row = (v, text) => v.el('.dt__table tbody tr', text, { has: true });
const dialogButton = (v, text) => v.el(`${D} button`, text);
const next = (rows) => Math.max(0, ...rows.map((r) => r.id)) + 1;

/** Edit and Delete, shown on one row without changing anything. */
async function editAndDelete(v, rowText, { edit, del }) {
  const r = await row(v, rowText);
  await v.say(edit);
  await v.point(await v.inside(r, 'button', 'Edit'));
  await v.wait(READ);
  await v.say(del);
  await v.point(await v.inside(r, 'button', 'Delete'));
  await v.wait(READ + 600);
}

async function filterAndExport(v) {
  await v.say('The filter narrows the table to one apiary, then one hive.');
  await v.choose('app-filter-bar select', 'Kalamos North');
  await v.wait(2400);
  await v.say('"Download" exports what the filter shows.');
  await v.point(await v.el('app-export-menu button'));
  await v.wait(2800);
}

export const SCENES = {
  dashboard: {
    path: '/user/dashboard',
    async run(v) {
      await v.say('The dashboard: the hives that need you, and what your inspections recorded.', 3600);
      await v.say('"Hives needing attention" lists every hive with a serious diagnosis.');
      await v.point('[aria-label="Open the diagnosis of Beehive 14"]');
      await v.wait(2800);
      await v.say('Press one for its risks, what to do, what to avoid and why.');
      await v.click('[aria-label="Open the diagnosis of Beehive 14"]');
      await v.wait(5200);
      await v.click(await dialogButton(v, 'Close'));
      await v.say('The filter narrows the list and every chart to one apiary, then one hive.');
      await v.choose('app-filter-bar select', 'Kalamos North');
      await v.wait(2800);
      await v.say('The charts are drawn from your inspections.');
      await v.scroll(420);
      await v.wait(2600);
      await v.scroll(1100);
      await v.wait(2600);
    },
  },

  todoList: {
    path: '/user/todo/list',
    write(method, route, body, list) {
      // A ticked dose is done: it leaves the open list.
      const id = Number(route.split('/')[1]);
      const agenda = list('agenda');
      const i = agenda.findIndex((a) => a.entity_type === 'treatment_instance' && a.entity_id === id);
      if (i >= 0) agenda.splice(i, 1);
      return { id, status: 'done' };
    },
    async run(v) {
      await v.say('The To-Do list: what is scheduled and what is late, in date order.', 3600);
      await v.say('A date that has passed stays red until the dose is ticked.');
      await v.point('.todo-row__date--overdue');
      await v.wait(READ);
      await v.say('Tick a dose on the day you give it.');
      await v.click('.todo-row__check');
      await v.wait(READ);
      await v.say('New entries come from the treatments you apply: one for each dose.', 4000);
    },
  },

  calendar: {
    path: '/user/todo/calendar',
    async run(v) {
      await v.say('The calendar: your inspections on the days they were made.', 3400);
      await v.say('The arrows move through time. "Today" brings you back.');
      const previous = await v.named('Previous');
      await v.click(previous);
      await v.wait(700);
      await v.click(previous);
      await v.wait(2600);
      await v.say('"Month", "Week" and "Day" change how much time is on screen.');
      await v.click(await v.el('button', 'Week'));
      await v.wait(2400);
      await v.click(await v.el('button', 'Month'));
      await v.wait(1400);
      await v.say('Each entry is one hive\'s inspection. Press it to open Inspections.');
      await v.click(await v.el('.cal-event'));
      await v.wait(3400);
    },
  },

  apiaries: {
    path: '/user/apiary',
    write(method, route, body, list) {
      if (method !== 'POST') return {};
      const created = { id: next(list('apiaries')), last_visited: null, ...body };
      list('apiaries').push(created);
      return created;
    },
    async run(v) {
      await v.say('Apiaries: every place where your hives stand.', READ);
      await v.say('"+ Add" opens the form for a new apiary.');
      await v.click(await v.el('button', '+ Add'));
      await v.wait(1500);
      await v.say('Give it a name and say how many hives stand there.');
      await v.type(await v.field('Name', D), 'Hillside yard');
      await v.type(await v.field('Hives', D), '6');
      await v.wait(1200);
      await v.say('Press its spot on the map, and write the place in words if you like.');
      await v.el(`${D} google-map .gm-style`, null, { timeout: 20000 });
      await v.wait(1200);
      await v.click(await v.el(`${D} .apiary-form__map`), { dx: 0.47, dy: 0.42 });
      await v.wait(1200);
      await v.type(await v.field('Location', D), 'Thebes, Boeotia');
      await v.wait(1400);
      await v.say('Save. The apiary is listed, and its hives are created with it.');
      await v.click(await dialogButton(v, 'Add'));
      const added = await row(v, 'Hillside yard');
      await v.wait(READ);
      await v.say('"Edit" changes the name, the place, the date or the position.');
      await v.click(await v.inside(added, 'button', 'Edit'));
      await v.wait(READ);
      await v.click(await dialogButton(v, 'Cancel'));
      await v.wait(700);
      await v.say('"Delete" removes the apiary with every hive and record in it. It cannot be undone.');
      await v.click(await v.inside(await row(v, 'Hillside yard'), 'button', 'Delete'));
      await v.wait(4000);
      await v.click(await dialogButton(v, 'Cancel'));
      await v.wait(700);
      await v.say('Press a name to open that apiary\'s own page.');
      await v.click(await v.el('.dt__table a.app-link', 'Kalamos North'));
      await v.wait(3800);
    },
  },

  apiaryCards: {
    path: '/user/apiary/details',
    async run(v) {
      await v.say('Apiaries Details: the same apiaries as the list, one card each.', 3600);
      await v.say('A card shows where the apiary is, when you last visited, and its open to-dos.');
      await v.point(await v.el('.app-badge, [class*="badge"]', '2 pending to-dos', { has: true }));
      await v.wait(3600);
      await v.say('"+ Add Apiary" opens the same form as the list: name, hives and position.');
      await v.point(await v.el('button', '+ Add Apiary'));
      await v.wait(READ);
      await v.say('"Edit" changes the name, the place, the date or the position.');
      await v.point(await v.el('button', 'Edit'));
      await v.wait(READ);
      await v.say('"Delete" removes the apiary with every hive and record in it. It cannot be undone.');
      await v.point(await v.el('button', 'Delete'));
      await v.wait(3800);
    },
  },

  apiaryMap: {
    path: '/user/apiary/map',
    async run(v) {
      await v.el('.gm-style', null, { timeout: 20000 });
      await v.wait(1500);
      await v.say('The map: every apiary that has a position.', 3400);
      await v.say('Each pin is one apiary.');
      for (const name of ['Evia Coast', 'Kalamos North', 'Parnitha Ridge']) {
        await v.point(await v.el(`[role="button"][aria-label="${name}"], [title="${name}"]`));
        await v.wait(900);
      }
      await v.wait(900);
      await v.say('An apiary gets its position in its Add or Edit form, by pressing the spot on the map there.', 4600);
      await v.say('If one is missing here, it has no position yet. Edit it from Apiaries.', 4200);
    },
  },

  apiaryView: {
    path: '/user/apiary/1',
    async run(v) {
      await v.say('One apiary\'s page: the weather there, its hives and its open to-dos.', 3800);
      await v.say('"Today\'s hourly" opens the forecast hour by hour.');
      await v.click(await v.el('button', 'Today\'s hourly', { has: true }));
      await v.wait(READ);
      await v.say('"Hive status": each hive\'s latest diagnosis, its last inspection and its main risk.');
      const first = await row(v, 'Survival');
      await v.point(first);
      await v.wait(READ);
      await v.say('Press a row for the full reading.');
      await v.click(first);
      await v.wait(4600);
      await v.click(await dialogButton(v, 'Close'));
      await v.say('Further down: the latest inspections and the treatments applied here.');
      await v.scroll(900);
      await v.wait(3600);
      await v.scroll(0);
      await v.say('"Edit" changes the apiary\'s name, place, date or position.');
      await v.point(await v.el('button', 'Edit'));
      await v.wait(READ);
    },
  },

  beehives: {
    path: '/user/beehives',
    write(method, route, body, list) {
      if (method !== 'POST' || route !== 'beehives') return {};
      const hives = list('beehives');
      const last = Math.max(0, ...hives.filter((h) => h.apiary_id === body.apiary_id).map((h) => h.number));
      const created = Array.from({ length: Number(body.hives_number) || 0 }, (_, i) => ({ id: next(hives) + i, uuid: `bhm-new-${i}`, number: last + 1 + i, apiary_id: body.apiary_id, queen: null }));
      hives.push(...created);
      return created;
    },
    async run(v) {
      await v.say('Beehives: every hive, by apiary. A hive has a number, not a name.', 3800);
      await v.say('To add hives, choose their apiary in the filter first.');
      await v.choose('app-filter-bar select', 'Kalamos North');
      await v.wait(2200);
      await v.say('Enter how many to add. They are created at once, numbered after the last one.');
      await v.type('#bh-count', '2');
      await v.click(await v.el('button', 'Create'));
      await v.wait(3600);
      const first = await row(v, 'Beehive 11');
      await v.say('"QR" shows the hive\'s code, which you can download as a picture.');
      await v.click(await v.inside(first, 'button', 'QR'));
      await v.wait(3600);
      await v.click(await dialogButton(v, 'Close'));
      await v.say('"Edit" changes the hive\'s number. One already used in the apiary is refused.');
      await v.point(await v.inside(await row(v, 'Beehive 11'), 'button', 'Edit'));
      await v.wait(3600);
      await v.say('"Delete" removes the hive with all its records, and asks what happened to its queen.');
      await v.click(await v.inside(await row(v, 'Beehive 11'), 'button', 'Delete'));
      await v.wait(4600);
      await v.click(await dialogButton(v, 'Cancel'));
      await v.wait(600);
    },
  },

  treatments: {
    path: '/user/treatments',
    write(method, route, body, list) {
      if (method !== 'POST' || route !== 'treatment-types') return {};
      const created = { is_recurring: false, notes: '', ...body, id: next(list('treatment-types')) };
      list('treatment-types').push(created);
      return created;
    },
    async run(v) {
      await v.say('Treatments: write a treatment down once, then apply it as often as you need.', 3800);
      await v.say('"+ New Type": a name, the disease, the product and the dose.');
      await v.click(await v.el('button', '+ New Type'));
      await v.wait(900);
      await v.type(await v.field('Name', D), 'Thymol gel');
      await v.choose(await v.field('Disease', D), 'Varroa');
      await v.type(await v.field('Product', D), 'Thymol 25%');
      await v.type(await v.field('Dose', D), '1 tray');
      await v.say('A recurring type also holds the days between doses and how often it repeats.');
      await v.point(await v.el(`${D} button, ${D} label`, 'Recurring treatment', { has: true }));
      await v.wait(3600);
      await v.say('Save, and the type has its own card.');
      await v.click(await dialogButton(v, 'Create'));
      const card = await v.el('.app-tile, [class*="tile"]', 'Thymol gel', { has: true });
      await v.wait(2600);
      await v.say('"Apply Treatment" starts a session: this type, the hives you tick and a start date.');
      await v.click(await v.inside(card, 'button', 'Apply Treatment'));
      await v.wait(4200);
      await v.say('One dose is scheduled for each date the type calls for, and each appears on the To-Do list.', 4600);
      await v.click(await dialogButton(v, 'Cancel'));
      await v.wait(600);
      await v.say('"Edit" changes the type. "Delete" removes it with every session started from it.');
      await v.point(await v.el('button', 'Delete'));
      await v.wait(4000);
    },
  },

  treatmentSessions: {
    path: '/user/treatments/details',
    write(method, route, body, list) {
      if (method !== 'POST' || route !== 'treatment-sessions') return {};
      const sessions = list('treatment-sessions');
      const type = list('treatment-types').find((t) => t.id === Number(body.treatment_type_id));
      const id = next(sessions);
      const created = {
        id, notes: '', ...body, treatment_type: type,
        apiary_id: body.apiary_id ?? list('beehives').find((h) => h.id === body.beehive_ids?.[0])?.apiary_id ?? 2,
        instances: [{ id: 50, treatment_session_id: id, scheduled_date: body.start_date, actual_date: null, status: 'planned', notes: '' }],
      };
      sessions.unshift(created);
      return created;
    },
    async run(v) {
      await v.say('Treatment sessions: each one is a type applied to a set of hives from a start date.', 3800);
      await v.say('A session lists its doses and how many of them are done.');
      await v.point(await v.el('span, div', '2/3 done', { has: true, nth: await count(v, '2/3 done', 'span, div') - 1 }));
      await v.wait(3600);
      await v.say('"+ Apply Treatment": the type, the start date and the hives.');
      await v.click(await v.el('button', '+ Apply Treatment'));
      await v.wait(900);
      await v.choose(await v.field('Treatment type', D), 'Fumagillin');
      await v.date(await v.field('Start date', D), TODAY);
      await v.choose(await v.field('Apiary', D), 'Parnitha Ridge');
      await v.wait(2200);
      await v.say('Save. The session is listed with its doses, and each dose appears on the To-Do list.');
      await v.click(await dialogButton(v, 'Apply treatment'));
      await v.wait(4400);
      await v.say('A dose is ticked on the To-Do list, on the day you give it. The count here follows.', 4200);
      await v.say('"Delete" removes the session and its doses, from here and from the To-Do list.');
      await v.point(await v.el('button', 'Delete'));
      await v.wait(4000);
    },
  },

  inspections: {
    path: '/user/inspections',
    write(method, route, body, list) {
      if (method !== 'POST') return {};
      const rows = list('inspections');
      const created = { ...rows[0], added_by: undefined, ...body, id: next(rows) };
      rows.unshift(created);
      // The rules read it at once: a healthy reading, so the new row has its Status.
      const readings = list('diagnosis/records');
      const healthy = readings.find((d) => d.level === 'ok');
      const hive = list('beehives').find((h) => h.id === created.beehive_id);
      readings.push({ ...healthy, id: next(readings), record_id: created.id, date: created.date, beehive: { id: hive.id, number: hive.number, apiary_id: hive.apiary_id } });
      return created;
    },
    async run(v) {
      await v.say('Inspections: what you saw in one hive on one visit.', 3400);
      await v.say('"+ Add Record": one hive, one date, and what you counted.');
      await v.click(await v.el('button', '+ Add Record'));
      await v.wait(900);
      await v.choose(await v.field('Apiary', D), 'Kalamos North');
      await v.choose(await v.field('Beehive', D), '12');
      await v.date(await v.field('Date', D), TODAY);
      for (const [label, value] of [['Frames', '10'], ['Population', '7'], ['Pollen', '2'], ['Honey', '5'], ['Egg', '3'], ['Closed Brood', '3']]) {
        await v.type(await v.field(label, D), value);
      }
      await v.say('The switches record the queen and any sign of disease.');
      await v.point(await v.el(`${D} button, ${D} label`, 'Queen Seen', { has: true }));
      await v.wait(3000);
      await v.say('Save. Each inspection is read by rules at once, and that reading is its Status.');
      await v.click(await dialogButton(v, 'Save'));
      await v.wait(3800);
      await v.say('Press a Status badge for the risks, what to do, what to avoid and why.');
      await v.click(await v.inside(await row(v, 'Survival'), 'button', 'Open the diagnosis of this inspection'));
      await v.wait(5200);
      await v.click(await dialogButton(v, 'Close'));
      await editAndDelete(v, 'Survival', {
        edit: '"Edit" corrects a reading. The diagnosis is read again.',
        del: '"Delete" removes the inspection and its diagnosis. It cannot be undone.',
      });
      await filterAndExport(v);
    },
  },

  feeding: {
    path: '/user/feeding',
    write(method, route, body, list) {
      if (method !== 'POST') return {};
      const rows = list('feeding');
      const apiary = Number(route.split('/')[2]);
      const hives = apiary ? list('beehives').filter((h) => h.apiary_id === apiary).map((h) => h.id) : [body.beehive_id];
      const created = hives.map((beehive_id, i) => ({ ...body, beehive_id, id: next(rows) + i }));
      rows.unshift(...created);
      return created;
    },
    async run(v) {
      await v.say('Feeding: what you gave on one day, the kind of food and the quantity per hive.', 3800);
      await v.say('"+ Add Record": the apiary, the date, the food and the quantity per hive.');
      await v.click(await v.el('button', '+ Add Record'));
      await v.wait(900);
      await v.choose(await v.field('Apiary', D), 'Kalamos North');
      await v.date(await v.field('Date', D), TODAY);
      await v.choose(await v.field('Feeding Type', D), 'Stimulation');
      await v.choose(await v.field('Food Type', D), 'Sugar Syrup');
      await v.type(await v.field('Qty / Beehive', D), '2');
      await v.choose(await v.field('Unit', D), 'Lt');
      await v.say('Leave the hive on "All beehives" to record it for the whole apiary.');
      await v.point(await v.field('Beehive', D));
      await v.wait(3400);
      await v.say('Save. Every hive of the apiary gets its own record.');
      await v.click(await dialogButton(v, 'Save'));
      await v.wait(4200);
      await editAndDelete(v, '#11', {
        edit: '"Edit" corrects a record.',
        del: '"Delete" removes it. It cannot be undone.',
      });
      await filterAndExport(v);
    },
  },

  harvest: {
    path: '/user/harvest',
    write(method, route, body, list) {
      if (method !== 'POST') return {};
      const rows = list('harvest');
      const apiary = Number(route.split('/')[2]);
      const hives = apiary ? list('beehives').filter((h) => h.apiary_id === apiary).map((h) => h.id) : [body.beehive_id];
      const created = hives.map((beehive_id, i) => ({ ...body, beehive_id, food_quantity: body.food_quantity / hives.length, id: next(rows) + i }));
      rows.unshift(...created);
      return created;
    },
    async run(v) {
      await v.say('Harvest: what you took on one day, the product and the total quantity.', 3800);
      await v.say('"+ Add Record": the apiary, the date, the product and the total quantity.');
      await v.click(await v.el('button', '+ Add Record'));
      await v.wait(900);
      await v.choose(await v.field('Apiary', D), 'Kalamos North');
      await v.date(await v.field('Date', D), TODAY);
      await v.choose(await v.field('Type', D), 'Honey');
      await v.type(await v.field('Description (honey only)', D), 'Thyme');
      await v.type(await v.field('Total Quantity', D), '48');
      await v.choose(await v.field('Unit', D), 'Kg');
      await v.say('Leave the hive on "All beehives" to record it for the whole apiary.');
      await v.point(await v.field('Beehive', D));
      await v.wait(3400);
      await v.say('Save. The total is shared out among the hives of the apiary.');
      await v.click(await dialogButton(v, 'Save'));
      await v.wait(4200);
      await editAndDelete(v, '#11', {
        edit: '"Edit" corrects a record.',
        del: '"Delete" removes it. It cannot be undone.',
      });
      await filterAndExport(v);
    },
  },

  financial: {
    path: '/user/financial',
    write(method, route, body, list) {
      if (method !== 'POST') return {};
      if (route === 'cost-categories') {
        const created = { description: '', ...body, id: next(list('cost-categories')) };
        list('cost-categories').push(created);
        return created;
      }
      if (route === 'costs') {
        const category = list('cost-categories').find((c) => c.id === Number(body.cost_category_id ?? body.category_id));
        const created = { ...body, category_name: category?.name, id: next(list('costs')) };
        list('costs').unshift(created);
        return created;
      }
      return {};
    },
    async run(v) {
      await v.say('Financials: what the bees cost and what they bring in.', 3400);
      await v.say('Start with a category: a name, and whether it is income or outgoing.');
      await v.click(await v.el('button', '+ Add', { nth: 0 }));
      await v.wait(900);
      await v.type(await v.field('Name', D), 'Queens');
      await v.choose(await v.field('Type', D), 'Outgoing');
      await v.wait(1400);
      await v.click(await dialogButton(v, 'Save'));
      await v.wait(2600);
      await v.say('Then the entries: a date, a name, a category and an amount.');
      await v.click(await v.el('button', '+ Add', { nth: 1 }));
      await v.wait(900);
      await costForm(v);
      await v.click(await dialogButton(v, 'Save'));
      await v.wait(3200);
      await v.say('Money coming in is entered the same way, under an income category.', 3800);
      await v.say('"Export" downloads the entries.');
      await v.point(await v.el('app-export-menu button'));
      await v.wait(2600);
      await v.say('The charts follow your entries: by month, for the year, and by category.');
      await v.scroll(520);
      await v.wait(3000);
      await v.scroll(1200);
      await v.wait(3000);
      await v.scroll(0);
      await v.say('Deleting a category removes every entry under it.');
      await v.point(await v.inside(await row(v, 'Tools'), 'button', 'Delete'));
      await v.wait(3600);
    },
  },

  profile: {
    path: '/user/profile',
    async run(v) {
      await v.say('Profile: your details, how you sign in, your team, your plan and your data.', 3800);
      await v.say('Your country sets the season your hive advice follows.');
      await v.point('#prof-country');
      await v.wait(READ);
      await v.say('Security: change the password, or turn on two-step sign-in.');
      await v.point(await v.el('button', 'Enable 2FA'));
      await v.wait(READ);
      await v.say('Team members: invite someone by email. They get their own account in your team.');
      await v.click(await v.el('button', 'Invite member'));
      await v.wait(3800);
      await v.click(await dialogButton(v, 'Cancel'));
      await v.say('A member can view and edit everything except the plan and billing.');
      await v.point(await v.el('button', 'Invite member'));
      await v.wait(3600);
      await v.say('"Your data" downloads the account\'s records: choose the sections, the dates and the format.');
      await v.point(await v.el('#your-data button', 'Export'));
      await v.wait(4000);
      await v.scroll(99999);
      await v.say('"Delete account" removes the team, its members\' accounts and every record. It cannot be undone.', 0, { top: true });
      await v.point(await v.el('button', 'Delete account'));
      await v.wait(4400);
    },
  },
};

/** How many visible elements carry `text` (to take the innermost: the last). */
async function count(v, text, selector = 'app-card') {
  return v.page.evaluate((s, t) => [...document.querySelectorAll(s)].filter((e) => e.getBoundingClientRect().width && e.textContent.replace(/\s+/g, ' ').trim().includes(t)).length, selector, text);
}

async function costForm(v) {
  await v.date(await v.field('Date', D), TODAY);
  await v.type(await v.field('Name', D), 'Two mated queens');
  await v.choose(await v.field('Category', D), 'Queens');
  await v.type(await v.field('Amount', D), '70');
  await v.wait(1400);
}
