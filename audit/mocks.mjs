/* API mocks for the audit run. The backend is not running, so every call to
   localhost:8000/api is answered here with the snake_case shape each service's
   fromApi() expects. Values are illustrative. */

const APIARIES = [
  { id: 1, name: 'Kalamos North', hives_number: 34, latitude: 38.2731, longitude: 23.8542, location: 'Kalamos, Attica', date_established: '2021-03-14', last_visited: '2026-08-28' },
  { id: 2, name: 'Parnitha Ridge', hives_number: 22, latitude: 38.1594, longitude: 23.7285, location: 'Parnitha, Attica', date_established: '2022-05-02', last_visited: '2026-08-19' },
  { id: 3, name: 'Evia Coast', hives_number: 18, latitude: 38.5122, longitude: 23.6301, location: 'Nea Artaki, Evia', date_established: '2024-04-11', last_visited: null },
];

const BEEHIVES = [
  { id: 11, uuid: 'bhm-a41f8c2e-11', name: 'Beehive 11', apiary_id: 1, queen: { year: 2024 } },
  { id: 12, uuid: 'bhm-a41f8c2e-12', name: 'Beehive 12', apiary_id: 1, queen: { year: 2024 } },
  { id: 13, uuid: 'bhm-a41f8c2e-13', name: 'Beehive 13', apiary_id: 1, queen: { year: 2025 } },
  { id: 14, uuid: 'bhm-a41f8c2e-14', name: 'Beehive 14', apiary_id: 1, queen: null },
  { id: 21, uuid: 'bhm-7d90b155-01', name: 'Beehive 1', apiary_id: 2, queen: { year: 2023 } },
  { id: 22, uuid: 'bhm-7d90b155-02', name: 'Beehive 2', apiary_id: 2, queen: { year: 2023 } },
];

const INSPECTIONS = [
  { id: 501, beehive_id: 11, date: '2026-08-28', frame_space: 10, population: 7, pollen: 2, honey: 6, opened_brood: 3, closed_brood: 3, varroa: 1, american_foulbrood: 0, european_foulbrood: 0, nosema: 0, queen_exists: 1, queen_cells: 0, queen_year: 2024 },
  { id: 502, beehive_id: 12, date: '2026-08-28', frame_space: 10, population: 6, pollen: 2, honey: 5, opened_brood: 2, closed_brood: 3, varroa: 0, american_foulbrood: 0, european_foulbrood: 0, nosema: 0, queen_exists: 1, queen_cells: 0, queen_year: 2024 },
  { id: 503, beehive_id: 13, date: '2026-08-27', frame_space: 8, population: 4, pollen: 1, honey: 2, opened_brood: 2, closed_brood: 1, varroa: 1, american_foulbrood: 0, european_foulbrood: 1, nosema: 0, queen_exists: 0, queen_cells: 1, queen_year: null },
  { id: 504, beehive_id: 14, date: '2026-08-27', frame_space: 8, population: 3, pollen: 1, honey: 1, opened_brood: 1, closed_brood: 1, varroa: 0, american_foulbrood: 0, european_foulbrood: 0, nosema: 1, queen_exists: 1, queen_cells: 0, queen_year: 2025 },
  { id: 505, beehive_id: 11, date: '2026-09-04', frame_space: 10, population: 7, pollen: 2, honey: 6, opened_brood: 3, closed_brood: 3, varroa: 0, american_foulbrood: 0, european_foulbrood: 0, nosema: 0, queen_exists: 1, queen_cells: 0, queen_year: 2024 },
  { id: 506, beehive_id: 12, date: '2026-09-08', frame_space: 10, population: 6, pollen: 2, honey: 5, opened_brood: 2, closed_brood: 3, varroa: 0, american_foulbrood: 0, european_foulbrood: 0, nosema: 0, queen_exists: 1, queen_cells: 0, queen_year: 2024 },
];

const AVG = ['2026-03-01', '2026-04-01', '2026-05-01', '2026-06-01', '2026-07-01', '2026-08-01'].map((date, i) => ({
  date, population: 4 + i * 0.6, frame_space: 8 + (i > 2 ? 2 : 0), pollen: 2 + (i % 3) * 0.5, honey: 1.2 + i, opened_brood: 3 + (i % 2), closed_brood: 2.4 + i * 0.3,
}));

const FEEDING = [
  { id: 71, beehive_id: 11, date: '2026-08-20', feeding_type: 'syrup', food_type: 'Syrup 1:1', food_quantity: 2, unit: 'L' },
  { id: 72, beehive_id: 12, date: '2026-08-20', feeding_type: 'syrup', food_type: 'Syrup 1:1', food_quantity: 2, unit: 'L' },
  { id: 73, beehive_id: 13, date: '2026-08-20', feeding_type: 'patty', food_type: 'Pollen patty', food_quantity: 1, unit: 'kg' },
];

const HARVEST = [
  { id: 91, beehive_id: 11, date: '2026-07-18', honey_type: 'Thyme', honey_description: 'Very dense', food_quantity: 18.5, unit: 'kg' },
  { id: 92, beehive_id: 12, date: '2026-07-18', honey_type: 'Thyme', honey_description: '', food_quantity: 14, unit: 'kg' },
  { id: 93, beehive_id: 21, date: '2026-07-25', honey_type: 'Pine', honey_description: 'Late flow', food_quantity: 9.5, unit: 'kg' },
];

const TREATMENT_TYPES = [
  { id: 1, name: 'Oxalic drip', disease: 'Varroa', product: 'Oxalic acid 3.2%', dose: '5 ml / frame', is_recurring: false, notes: 'Broodless period only.' },
  { id: 2, name: 'Formic strips', disease: 'Varroa', product: 'Formic acid 65%', dose: '1 strip', is_recurring: true, repetitions: 2, interval_days: 7, notes: 'Do not apply above 30°C.' },
  { id: 3, name: 'Fumagillin', disease: 'Nosema', product: 'Fumagillin B', dose: 'in syrup', is_recurring: false, notes: '' },
];

const TREATMENT_SESSIONS = [
  {
    id: 900, treatment_type_id: 2, apiary_id: 1, start_date: '2026-08-10', notes: 'Started after the thyme harvest.',
    treatment_type: TREATMENT_TYPES[1], beehive_ids: [11, 12, 13],
    instances: [
      { id: 1, treatment_session_id: 900, scheduled_date: '2026-08-10', actual_date: '2026-08-10', status: 'done', notes: '' },
      { id: 2, treatment_session_id: 900, scheduled_date: '2026-08-17', actual_date: '2026-08-18', status: 'done', notes: 'One day late, rain.' },
      { id: 3, treatment_session_id: 900, scheduled_date: '2026-09-24', actual_date: null, status: 'planned', notes: '' },
    ],
  },
  {
    id: 901, treatment_type_id: 1, apiary_id: 2, start_date: '2026-08-02', notes: '',
    treatment_type: TREATMENT_TYPES[0], beehive_ids: [21, 22],
    instances: [
      { id: 4, treatment_session_id: 901, scheduled_date: '2026-08-02', actual_date: '2026-08-02', status: 'done', notes: '' },
      { id: 5, treatment_session_id: 901, scheduled_date: '2026-08-09', actual_date: null, status: 'skipped', notes: '' },
    ],
  },
];

const COST_CATEGORIES = [
  { id: 1, name: 'Honey sales', description: 'Retail and wholesale', type: 'income' },
  { id: 2, name: 'Jars', description: 'Glass, lids, labels', type: 'outcome' },
  { id: 3, name: 'Feeding', description: 'Syrup and patties', type: 'outcome' },
  { id: 4, name: 'Tools', description: 'Equipment and repairs', type: 'outcome' },
];

const COSTS = [
  { id: 301, category_id: 1, category_name: 'Honey sales', date: '2026-07-30', name: 'Farmers market', amount: 1240 },
  { id: 302, category_id: 2, category_name: 'Jars', date: '2026-07-12', name: '500 × 450g jars', amount: 385 },
  { id: 303, category_id: 3, category_name: 'Feeding', date: '2026-08-20', name: 'Autumn syrup', amount: 210 },
  { id: 304, category_id: 4, category_name: 'Tools', date: '2026-06-04', name: 'Extractor service', amount: 160 },
];

const AGENDA = [
  { type: 'treatment', title: 'Formic strips — dose 3', subtitle: 'Kalamos North · 3 hives', scheduled_date: '2026-08-24', is_overdue: true, entity_type: 'treatment_instance', entity_id: 3, session_id: 900, apiary_id: 1 },
  { type: 'inspection', title: 'Inspect hives 11–18', subtitle: 'Kalamos North', scheduled_date: '2026-09-08', is_overdue: false, entity_type: 'inspection', entity_id: 77, apiary_id: 1 },
  { type: 'inspection', title: 'Move Evia hives to thyme', subtitle: 'Evia Coast', scheduled_date: '2026-09-15', is_overdue: false, entity_type: 'inspection', entity_id: 78, apiary_id: 3 },
];

const PROFILE = { id: 10, name: 'Nikos', surname: 'Lymperis', email: 'nikos@beehivemind.org', role: 'user', country: 'Greece', unit: 'kg', show_hints: true, two_factor_enabled: false, has_password: true };

const NOTIFICATIONS = {
  success: true,
  unread_count: 2,
  data: [
    { id: 1, type: 'treatment', title: 'Varroa treatment due', message: 'Kalamos North · 6 hives in the autumn oxalic session', entity_type: 'treatment_instance', entity_id: 3, is_read: false, created_at: '2026-09-04T08:00:00Z' },
    { id: 2, type: 'inspection', title: 'Inspection overdue', message: 'Beehive 13 has not been inspected in 21 days', entity_type: 'beehive', entity_id: 13, is_read: false, created_at: '2026-09-03T17:30:00Z' },
    { id: 4, type: 'harvest', title: 'Harvest recorded', message: '18.4 kg thyme honey from Evia Coast', entity_type: 'harvest', entity_id: 91, is_read: true, created_at: '2026-09-01T14:45:00Z' },
  ],
};

const CONVERSATIONS = [
  { id: 1, beehive_id: null, title: 'Population since July', status: 'active', last_message_at: '2026-09-06T10:12:00Z', created_at: '2026-09-06T10:00:00Z' },
  { id: 2, beehive_id: null, title: 'When to treat for varroa', status: 'active', last_message_at: '2026-09-02T18:40:00Z', created_at: '2026-09-02T18:30:00Z' },
];

const CONVERSATION_1 = {
  ...CONVERSATIONS[0],
  messages: [
    { id: 1, conversation_id: 1, role: 'user', content: 'Which hives lost population since July?', tool_calls: null, tool_name: null, metadata: null, created_at: '2026-09-06T10:00:00Z' },
    { id: 2, conversation_id: 1, role: 'assistant', content: 'Two: **Beehive 13** at Kalamos North dropped from 6 to 4 frames of bees, and Beehive 14 from 4 to 3. Both had a detection in the last inspection — European foulbrood and Nosema respectively.', tool_calls: null, tool_name: null, metadata: null, created_at: '2026-09-06T10:12:00Z' },
  ],
};

const WEATHER = (() => {
  const today = new Date();
  const iso = (d, h) => {
    const x = new Date(d); x.setUTCHours(h, 0, 0, 0); return x.toISOString();
  };
  const hourly = Array.from({ length: 12 }, (_, i) => ({
    time: iso(today, 6 + i),
    values: { temperature: 18 + i, humidity: 70 - i * 2, windSpeed: 6 + i, windGust: 12 + i, windDirection: 315, precipitationProbability: (i * 7) % 90, precipitationIntensity: i > 7 ? 1.2 : 0, uvIndex: 5, cloudCover: 30 + i * 4, pressureSurfaceLevel: 1014, weatherCode: i > 7 ? 4001 : 1101 },
  }));
  const daily = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() + i);
    return { time: iso(d, 0), values: { temperatureMin: 15 + i, temperatureMax: 26 + (i % 3), precipitationProbability: (i * 13) % 90, precipitationAccumulationAvg: i === 3 ? 4.6 : 0, weatherCode: i === 3 ? 4001 : 1100, windSpeedMax: 18 + i, sunriseTime: iso(d, 4), sunsetTime: iso(d, 17) } };
  });
  return { timelines: { hourly, daily } };
})();

const ADMIN_STATS = { users: { total: 1284, active: 1163, suspended: 47, banned: 74, new_this_month: 96, by_plan: { free: 902, pro: 341, enterprise: 41 } }, employees: 9, apiaries: 2417, beehives: 18963, records: 264018 };

const ADMIN_USERS = [
  { id: 1, name: 'Nikos', surname: 'Lymperis', email: 'nikos@beehivemind.gr', status: 'active', plan: 'pro', email_verified: true, created_at: '2024-03-11T09:20:00Z' },
  { id: 2, name: 'Eleni', surname: 'Vasiliou', email: 'eleni.v@example.com', status: 'active', plan: 'free', email_verified: true, created_at: '2025-01-08T14:02:00Z' },
  { id: 3, name: 'Giorgos', surname: 'Petrou', email: 'g.petrou@example.com', status: 'suspended', plan: 'pro', email_verified: true, created_at: '2024-11-27T08:45:00Z' },
  { id: 4, name: 'Maria', surname: 'Antoniou', email: 'maria.a@example.com', status: 'active', plan: 'enterprise', email_verified: false, created_at: '2026-02-19T11:31:00Z' },
  { id: 5, name: 'Dimitris', surname: 'Kalogeras', email: 'dk@example.com', status: 'banned', plan: 'free', email_verified: true, created_at: '2023-07-02T16:10:00Z' },
];

const ADMIN_EMPLOYEES = [
  { id: 1, name: 'Anna', surname: 'Ioannou', email: 'anna@beehivemind.org', role: 'superadmin', created_at: '2023-01-16T10:00:00Z' },
  { id: 2, name: 'Petros', surname: 'Rallis', email: 'petros@beehivemind.org', role: 'admin', created_at: '2024-05-04T10:00:00Z' },
  { id: 3, name: 'Katerina', surname: 'Sideri', email: 'katerina@beehivemind.org', role: 'moderator', created_at: '2025-02-11T10:00:00Z' },
];

const ADMIN_COUPONS = [
  { id: 1, code: 'SUMMER20', type: 'percentage', value: '20', value_unit: null, used_count: 143, max_uses: 500, expires_at: '2026-09-30T23:59:00Z', is_active: true, is_usable: true, created_at: '2026-06-01T00:00:00Z' },
  { id: 2, code: 'FIRSTHIVE', type: 'free_period', value: '3', value_unit: 'months', used_count: 812, max_uses: null, expires_at: null, is_active: true, is_usable: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 3, code: 'SPRING10', type: 'percentage', value: '10', value_unit: null, used_count: 500, max_uses: 500, expires_at: '2026-05-31T23:59:00Z', is_active: true, is_usable: false, created_at: '2026-03-01T00:00:00Z' },
];

const RAW_COUNTS = { users: 1284, employees: 9, apiaries: 2417, beehives: 18963, queens: 4021, 'beehive-groups': 312, records: 264018, costs: 12604, 'cost-categories': 88, coupons: 18, tokens: 3122 };

const RAW_USERS = ADMIN_USERS.map(u => ({ ...u, role: 'user', country: 'Greece', unit: 'kg' }));

const PENDING_AI = [
  { message_id: 12, conversation_id: 1, user_question: 'Which hives lost population since July?', ai_response: 'Two: Beehive 13 at Kalamos North dropped from 6 to 4 frames of bees, and Beehive 14 from 4 to 3. Both had a detection in the last inspection.', tool_calls: null, created_at: '2026-09-06T10:12:00Z' },
  { message_id: 15, conversation_id: 2, user_question: 'When should I treat my hives for Varroa?', ai_response: 'Your last mite counts were taken on 28 August. With the thyme flow finished, a formic course now and an oxalic drip in the broodless window is the usual sequence.', tool_calls: null, created_at: '2026-09-02T18:40:00Z' },
];

/* --- blog ---------------------------------------------------------------
   The public pages and the console both read these. The SEO block is finished
   server-side in production, so it is finished here too — the audit checks the
   rendered head, not the fields it was built from. */

const SITE = 'http://localhost:4301';

const BLOG_CATEGORIES = [
  { id: 1, name: 'Inspections', slug: 'inspections', description: 'Reading a colony, and what the numbers you write down are worth later.', meta_title: 'Beehive inspections | BeehiveMind blog', meta_description: 'How to read a colony and what the readings you record are worth weeks later.', sort_order: 0, post_count: 1 },
  { id: 2, name: 'The app', slug: 'the-app', description: 'How BeehiveMind is built, and why it works the way it does.', meta_title: null, meta_description: null, sort_order: 1, post_count: 1 },
  { id: 3, name: 'Treatments', slug: 'treatments', description: 'Varroa, courses, intervals and the doses that get missed.', meta_title: null, meta_description: null, sort_order: 2, post_count: 1 },
];

const blogPost = (id, slug, title, excerpt, category, published, html, takeaways = [], faq = []) => ({
  id, title, slug, excerpt,
  content: html,
  featured_image: null,
  author: { id: 1, name: 'Anna Ioannou' },
  category,
  tags: [category.name],
  reading_minutes: 5,
  key_takeaways: takeaways,
  faq,
  published_at: published,
  updated_at: published,
  seo: {
    canonical_url: `${SITE}/blog/${slug}`,
    focus_keyword: category.name.toLowerCase(),
    meta_title: `${title} | BeehiveMind`,
    meta_description: excerpt,
    og_title: title,
    og_description: excerpt,
    og_type: 'article',
    robots: 'index, follow',
    twitter_card: 'summary_large_image',
    twitter_title: title,
    twitter_description: excerpt,
    image_url: `${SITE}/assets/images/og-blog.jpg`,
  },
});

const BLOG_POSTS = [
  blogPost(1, 'reading-closed-brood', 'What closed brood tells you three weeks early',
    'Recording capped brood separately from eggs is the single most useful thing you can do in an inspection.',
    BLOG_CATEGORIES[0], '2026-08-28T09:00:00Z',
    '<p>A frame of capped brood is a promise. The bees inside it will emerge in roughly twelve days, and they will start foraging about a week after that.</p><h2>Reading the pair together</h2><p>High open brood with low closed brood usually means the queen has only recently come into her stride.</p><ul><li>Count frames, not cells.</li><li>Record the two figures separately.</li></ul>',
    ['Capped brood forecasts the workforce three weeks out.', 'Open and closed brood are two readings, not one.'],
    [{ question: 'How often should I inspect?', answer: 'Every seven to ten days through the build-up, less once the flow is on.' }]),
  blogPost(2, 'hands-free-inspections', 'Why we built the app to be used without looking at it',
    'Every second spent tapping a phone over an open hive is a second the bees are getting warmer.',
    BLOG_CATEGORIES[1], '2026-08-12T09:00:00Z',
    '<p>An inspection is a two-handed job.</p><h2>The checklist problem</h2><p>The traditional answer is a paper checklist and a pencil in your veil.</p>'),
  blogPost(3, 'treatment-schedules', 'Recurring treatments, and the doses people forget',
    'A formic acid course is three applications a week apart. The third is the one that gets missed.',
    BLOG_CATEGORIES[2], '2026-07-30T09:00:00Z',
    '<p>Most varroa treatments are not a single event.</p><h2>Scheduling the whole course at once</h2><p>Day 0, day 7, day 14.</p>'),
];

const ADMIN_BLOG_POSTS = BLOG_POSTS.map((p, i) => ({
  id: p.id,
  title: p.title,
  slug: p.slug,
  excerpt: p.excerpt,
  content_html: p.content,
  content_json: null,
  status: i === 2 ? 'draft' : 'published',
  is_live: i !== 2,
  published_at: i === 2 ? null : p.published_at,
  reading_minutes: p.reading_minutes,
  category_id: p.category.id,
  category_name: p.category.name,
  tags: p.tags,
  author_name: 'Anna Ioannou',
  featured_image: null,
  og_image: null,
  meta_title: null,
  meta_description: null,
  focus_keyword: null,
  canonical_url: null,
  robots: 'index, follow',
  og_title: null,
  og_description: null,
  twitter_card: 'summary_large_image',
  faq: p.faq,
  key_takeaways: p.key_takeaways,
  created_at: p.published_at ?? '2026-07-01T09:00:00Z',
  updated_at: p.updated_at,
}));

const ok = (data, meta) => ({ success: true, code: 200, message: 'OK', data, ...(meta ? { meta } : {}) });
const page = (items) => ok(items, { page: 1, per_page: 25, total: items.length, total_pages: 1 });

/** Returns the JSON body for an API path (without the /api/ prefix), or null. */
export function mock(method, path) {
  const [route, query = ''] = path.split('?');
  const q = new URLSearchParams(query);

  if (method === 'OPTIONS') return { status: 204, body: null };

  if (route === 'apiaries') return ok(APIARIES);
  if (/^apiaries\/\d+$/.test(route)) return ok(APIARIES.find(a => a.id === Number(route.split('/')[1])) ?? APIARIES[0]);
  if (route === 'beehives') return ok(BEEHIVES);
  if (/^beehives\/apiary\/\d+$/.test(route)) return ok(BEEHIVES.filter(b => b.apiary_id === Number(route.split('/')[2])));
  if (route === 'inspections') return ok(INSPECTIONS);
  if (route === 'inspections/avg' || /^inspections\/apiary\/\d+\/avg$/.test(route)) return ok(AVG);
  if (/^inspections\/apiary\/\d+$/.test(route)) return ok(INSPECTIONS.filter(i => BEEHIVES.find(b => b.id === i.beehive_id)?.apiary_id === Number(route.split('/')[2])));
  if (/^inspections\/beehive\/\d+$/.test(route)) return ok(INSPECTIONS.filter(i => i.beehive_id === Number(route.split('/')[2])));
  if (route.startsWith('feeding')) return ok(FEEDING);
  if (route.startsWith('harvest')) return ok(HARVEST);
  if (route === 'treatment-types') return ok(TREATMENT_TYPES);
  if (route === 'treatment-sessions') return ok(TREATMENT_SESSIONS);
  if (route === 'treatment-instances') return ok(TREATMENT_SESSIONS.flatMap(s => s.instances));
  if (route === 'cost-categories') return ok(COST_CATEGORIES);
  if (route === 'costs') return ok(COSTS);
  if (route === 'costs/stats/monthly') return ok([{ type: 'income', month: 7, amount: 1240 }, { type: 'outcome', month: 6, amount: 160 }, { type: 'outcome', month: 7, amount: 385 }, { type: 'outcome', month: 8, amount: 210 }]);
  if (route === 'costs/stats/yearly') return ok([{ type: 'income', amount: 1240 }, { type: 'outcome', amount: 755 }]);
  if (route === 'costs/stats/by-category/income') return ok([{ category: 'Honey sales', amount: 1240 }]);
  if (route === 'costs/stats/by-category/outcome') return ok([{ category: 'Jars', amount: 385 }, { category: 'Feeding', amount: 210 }, { category: 'Tools', amount: 160 }]);
  if (route === 'agenda') return ok(q.get('apiary_id') ? AGENDA.filter(a => a.apiary_id === Number(q.get('apiary_id'))) : AGENDA);
  if (route === 'user/profile') return ok(PROFILE);
  if (route === 'notifications') return NOTIFICATIONS;
  if (route === 'weather') return ok(WEATHER);
  if (route === 'ai/conversations') return ok(CONVERSATIONS);
  if (/^ai\/conversations\/\d+$/.test(route)) return ok(CONVERSATION_1);
  if (route === 'blog/posts') return page(
    q.get('category') ? BLOG_POSTS.filter(p => p.category.slug === q.get('category')) : BLOG_POSTS,
  );
  if (route === 'blog/categories') return ok(BLOG_CATEGORIES);
  if (route.startsWith('blog/posts/')) {
    const found = BLOG_POSTS.find(p => p.slug === route.split('/')[2]);
    return found ? ok(found) : { status: 404, body: { success: false, message: 'Not found' } };
  }

  if (route === 'admin/blog/posts/slug-available') return ok({ available: true });
  if (route === 'admin/blog/posts') return page(ADMIN_BLOG_POSTS);
  if (/^admin\/blog\/posts\/\d+$/.test(route)) {
    return ok(ADMIN_BLOG_POSTS.find(p => p.id === Number(route.split('/')[3])) ?? ADMIN_BLOG_POSTS[0]);
  }
  if (route === 'admin/blog/categories') return ok(BLOG_CATEGORIES);

  if (route === 'admin/stats') return ok(ADMIN_STATS);
  if (route === 'admin/users') return page(ADMIN_USERS);
  if (route === 'admin/employees') return ok(ADMIN_EMPLOYEES);
  if (route === 'admin/coupons') return ok(ADMIN_COUPONS);
  if (route === 'admin/raw/counts') return ok(RAW_COUNTS);
  if (route === 'admin/raw/users') return ok(RAW_USERS, { page: 1, per_page: 25, total: 1284, total_pages: 52 });
  if (route.startsWith('admin/raw/')) return page([]);
  if (route === 'admin/ai-responses/pending') return page(PENDING_AI);
  return ok([]);
}
