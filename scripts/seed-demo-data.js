#!/usr/bin/env node
/**
 * Idempotent demo-data seed for Donut Nook.
 *
 * - Does not delete existing records.
 * - Fills missing menu descriptions and images, trims stray whitespace,
 *   and upserts drinks, current specials, and clearly fake demo customers.
 * - Leaves About, store address/hours, and any non-demo customers untouched.
 *
 * Run against MongoDB (preferred):
 *   MONGODB_URI="mongodb+srv://..." node scripts/seed-demo-data.js
 *
 * Or via the live API (menu description/image updates require the menu
 * controller changes from this repo to already be deployed):
 *   API_BASE=https://backend-donut-nook.onrender.com \
 *   SEED_TOKEN="<admin jwt>" \
 *   SEED_USER_ID="<admin user ObjectId>" \
 *   node scripts/seed-demo-data.js
 *
 * Never pass or log real customer PII. Demo customers use @example.com only.
 */
require('dotenv').config();
const mongoose = require('mongoose');

const Menu = require('../models/Menu');
const Special = require('../models/Special');
const Customer = require('../models/Customer');

const API_BASE = (process.env.API_BASE || '').replace(/\/$/, '');
const SEED_TOKEN = process.env.SEED_TOKEN || '';
const SEED_USER_ID = process.env.SEED_USER_ID || '';

const IMG = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

const MENU_DETAILS = {
  '200': {
    name: 'Glazed Donuts',
    description: 'Our classic yeast donut with a warm, shiny glaze. Soft, sweet, and baked fresh all day.',
    imageUrl: IMG('photo-1551024601-bec78aea704b'),
  },
  '400': {
    name: 'Apple / Blueberry Fritter',
    description: 'A crispy, cinnamon-dusted fritter packed with apples or blueberries and finished with a light glaze.',
    imageUrl: IMG('photo-1596560548464-f47aa4e2e3a0'),
  },
  '402': {
    name: 'Jelly Roll',
    description: 'A pillowy roll filled with bright fruit jelly and topped with a dusting of sugar.',
    imageUrl: IMG('photo-1551024506-0bccd828d307'),
  },
  '403': {
    name: 'BearClaw',
    description: 'A flaky almond bear claw with a sweet filling and toasted sliced almonds on top.',
    imageUrl: IMG('photo-1616541823729-00ca0d486068'),
  },
  '404': {
    name: 'Choco Square',
    description: 'A rich chocolate-frosted square donut for the serious chocolate lover.',
    imageUrl: IMG('photo-1527515637462-cff94eecc1ac'),
  },
  '405': {
    name: 'Bacon and Maple',
    description: 'A maple-glazed donut topped with crispy bacon. Sweet, salty, and a morning favorite.',
    imageUrl: IMG('photo-1486427944299-d1955d23e34d'),
  },
  '406': {
    name: 'Butterfinger & Oreo Donut',
    description: 'A loaded donut finished with crushed Butterfinger and Oreo crumbs over chocolate frosting.',
    imageUrl: IMG('photo-1612240498936-65f5101365d2'),
  },
  '407': {
    name: 'Pancakes',
    description: 'A short stack of golden buttermilk pancakes, served hot and ready for butter and syrup.',
    imageUrl: IMG('photo-1528207776546-365bb710ee93'),
  },
  '408': {
    name: 'Filled Donuts',
    description: 'Soft donuts filled with Bavarian cream or fruit filling and finished with a sugar coat or glaze.',
    imageUrl: IMG('photo-1626082927389-6cd097cdc6ec'),
  },
  '409': {
    name: 'Chocolate Bars',
    description: 'A classic bar donut dipped in smooth chocolate icing.',
    imageUrl: IMG('photo-1559715745-e1b33a271c8f'),
  },
  '410': {
    name: 'Maple Bars',
    description: 'A long bar donut topped with creamy maple icing.',
    imageUrl: IMG('photo-1635431270240-62b25c8084d4'),
  },
  '411': {
    name: 'Buttermilk Bars',
    description: 'Old-fashioned buttermilk bars with a crackly glaze and a tender crumb.',
    imageUrl: IMG('photo-1562941091-7c0c0c0c8d4a'),
  },
  '412': {
    name: 'Cinnamon Twists',
    description: 'Twisted dough rolled in cinnamon sugar. Crisp on the edges, soft in the middle.',
    imageUrl: IMG('photo-1509365465985-89d35f0b0c5d'),
  },
  '413': {
    name: 'Chocolate Twists',
    description: 'A twisted donut finished with chocolate icing.',
    imageUrl: IMG('photo-1606313564200-e75d5e30476c'),
  },
  '414': {
    name: 'Maple Twists',
    description: 'A twisted donut topped with maple icing.',
    imageUrl: IMG('photo-1499636136210-6f4ee915583e'),
  },
  '415': {
    name: 'Glazed Twists',
    description: 'A simple glazed twist, light and sweet.',
    imageUrl: IMG('photo-1551024601-bec78aea704b'),
  },
  '416': {
    name: 'Custard Bar Roll',
    description: 'A bar roll filled with vanilla custard and finished with a light icing.',
    imageUrl: IMG('photo-1519681393784-d120267933ba'),
  },
  '418': {
    name: 'PB Square Roll',
    description: 'A square roll with a peanut-butter filling and a sweet glaze.',
    imageUrl: IMG('photo-1599490659213-e2b9527bd087'),
  },
  '419': {
    name: 'Tiger Tail',
    description: 'A striped tiger-tail twist with a cinnamon-sugar crunch.',
    imageUrl: IMG('photo-1576618148400-f54bed99fcfd'),
  },
  '420': {
    name: 'Cinnamon Roll',
    description: 'A swirl of cinnamon dough baked soft and topped with vanilla icing.',
    imageUrl: IMG('photo-1509365465985-89d35f0b0c5d'),
  },
};

const DRINKS = [
  {
    itemId: '100',
    name: 'Brewed Coffee',
    description: 'Freshly brewed house coffee, regular or decaf. The perfect partner for a warm donut.',
    category: 'Drinks',
    imageUrl: IMG('photo-1511920170033-f8396924c348'),
    price: 2.25,
  },
  {
    itemId: '101',
    name: 'Hot Chocolate',
    description: 'Rich cocoa topped with whipped cream. A cozy sip for chilly mornings.',
    category: 'Drinks',
    imageUrl: IMG('photo-1542990253-0d0f5be5f0ed'),
    price: 2.5,
  },
  {
    itemId: '102',
    name: 'Orange Juice',
    description: 'Chilled orange juice, served by the cup.',
    category: 'Drinks',
    imageUrl: IMG('photo-1600271886742-f049cd451bba'),
    price: 2.0,
  },
  {
    itemId: '103',
    name: 'Chocolate Milk',
    description: 'Cold chocolate milk for kids and the young at heart.',
    category: 'Drinks',
    imageUrl: IMG('photo-1553787434-45f1d591ad26'),
    price: 2.0,
  },
];

const SPECIALS = [
  {
    specialId: 2001,
    title: 'BOGO Bars & Twists',
    message: 'Buy one bar or twist, get a second bar or twist free. A classic Nook deal, all week long.',
    itemIds: [409, 410, 411, 412, 413, 414, 415],
    startDate: new Date('2026-11-01T00:00:00.000Z'),
    endDate: new Date('2027-06-30T23:59:59.000Z'),
  },
  {
    specialId: 2002,
    title: 'Dozen Deal',
    message: 'Mix a dozen glazed, filled, or specialty donuts and save. Perfect for the office or a weekend treat.',
    itemIds: [200, 406, 408, 402, 404, 405],
    startDate: new Date('2026-11-01T00:00:00.000Z'),
    endDate: new Date('2027-06-30T23:59:59.000Z'),
  },
  {
    specialId: 2003,
    title: 'Coffee & Donut Combo',
    message: 'Pair any donut with a cup of house coffee for $3.99. The easiest way to start the day.',
    itemIds: [100, 200],
    startDate: new Date('2026-11-01T00:00:00.000Z'),
    endDate: new Date('2027-06-30T23:59:59.000Z'),
  },
  {
    specialId: 2004,
    title: 'Weekend Fritter Bundle',
    message: 'Saturday and Sunday only: grab three apple or blueberry fritters and get a drip coffee on the house.',
    itemIds: [400, 100],
    startDate: new Date('2026-11-01T00:00:00.000Z'),
    endDate: new Date('2027-06-30T23:59:59.000Z'),
  },
];

const DEMO_CUSTOMERS = [
  {
    name: 'Riley Demo',
    email: 'riley.demo@example.com',
    phone: '555-0101',
    dob: new Date('1991-04-12'),
    totalSpent: 46.25,
    loyaltyPoints: 160,
    purchaseHistory: [
      { menuItemId: 200, amount: 3.96, timestamp: new Date('2026-10-12T16:10:00Z') },
      { menuItemId: 410, amount: 1.5, timestamp: new Date('2026-11-02T15:22:00Z') },
      { menuItemId: 100, amount: 2.25, timestamp: new Date('2026-11-02T15:22:00Z') },
    ],
  },
  {
    name: 'Jordan Sample',
    email: 'jordan.sample@example.com',
    phone: '555-0102',
    dob: new Date('1988-09-03'),
    totalSpent: 72.4,
    loyaltyPoints: 240,
    purchaseHistory: [
      { menuItemId: 407, amount: 6.5, timestamp: new Date('2026-09-20T14:05:00Z') },
      { menuItemId: 200, amount: 7.92, timestamp: new Date('2026-10-28T17:40:00Z') },
      { menuItemId: 406, amount: 2.0, timestamp: new Date('2026-11-08T18:15:00Z') },
    ],
  },
  {
    name: 'Casey Patron',
    email: 'casey.patron@example.com',
    phone: '555-0103',
    dob: new Date('1996-01-22'),
    totalSpent: 28.75,
    loyaltyPoints: 90,
    purchaseHistory: [
      { menuItemId: 420, amount: 1.6, timestamp: new Date('2026-11-05T15:48:00Z') },
      { menuItemId: 101, amount: 2.5, timestamp: new Date('2026-11-05T15:48:00Z') },
    ],
  },
  {
    name: 'Avery Guest',
    email: 'avery.guest@example.com',
    phone: '555-0104',
    dob: new Date('1993-07-18'),
    totalSpent: 54.1,
    loyaltyPoints: 180,
    purchaseHistory: [
      { menuItemId: 400, amount: 5.1, timestamp: new Date('2026-10-18T13:20:00Z') },
      { menuItemId: 408, amount: 3.6, timestamp: new Date('2026-11-10T16:05:00Z') },
      { menuItemId: 102, amount: 2.0, timestamp: new Date('2026-11-10T16:05:00Z') },
    ],
  },
];

const summary = { menuUpdated: 0, drinksUpserted: 0, specialsUpserted: 0, customersUpserted: 0 };

function log(...args) {
  const text = args.map(String).join(' ');
  if (/mongodb(\+srv)?:\/\//i.test(text) || /Bearer\s+\S+/i.test(text)) {
    console.log('[seed] (redacted log line)');
    return;
  }
  console.log(...args);
}

async function api(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (SEED_TOKEN) headers.Authorization = `Bearer ${SEED_TOKEN}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = data && data.message ? data.message : text.slice(0, 200);
    throw new Error(`${method} ${path} failed: ${res.status} ${msg}`);
  }
  return data;
}

function trimmed(value, fallback) {
  if (typeof value === 'string' && value.trim()) return value.trim();
  return fallback;
}

async function seedMenuMongo() {
  for (const [itemId, details] of Object.entries(MENU_DETAILS)) {
    const item = await Menu.findOne({ itemId });
    if (!item) {
      log(`  skip menu ${itemId} (not in database)`);
      continue;
    }
    const updates = {};
    const cleanName = item.name ? item.name.trim() : details.name;
    const cleanCategory = item.category ? item.category.trim() : item.category;
    if (cleanName !== item.name) updates.name = cleanName;
    if (cleanCategory !== item.category) updates.category = cleanCategory;
    if (!item.description) updates.description = details.description;
    if (!item.imageUrl) updates.imageUrl = details.imageUrl;
    if (Object.keys(updates).length === 0) continue;
    await Menu.updateOne({ itemId }, { $set: updates });
    summary.menuUpdated += 1;
    log(`  updated menu ${itemId} (${cleanName}): ${Object.keys(updates).join(', ')}`);
  }

  for (const drink of DRINKS) {
    const existing = await Menu.findOne({ $or: [{ itemId: drink.itemId }, { name: drink.name }] });
    if (existing) {
      const updates = {};
      if (!existing.description) updates.description = drink.description;
      if (!existing.imageUrl) updates.imageUrl = drink.imageUrl;
      if (existing.category && existing.category.trim() !== existing.category) {
        updates.category = existing.category.trim();
      } else if (!existing.category) {
        updates.category = drink.category;
      }
      if (Object.keys(updates).length) {
        await Menu.updateOne({ _id: existing._id }, { $set: updates });
        summary.drinksUpserted += 1;
        log(`  updated drink ${existing.itemId} (${existing.name})`);
      }
      continue;
    }
    await Menu.create({
      itemId: drink.itemId,
      name: drink.name,
      description: drink.description,
      category: drink.category,
      imageUrl: drink.imageUrl,
      available: true,
      isFavorite: false,
      priceHistory: [{ price: drink.price, timestamp: new Date() }],
    });
    summary.drinksUpserted += 1;
    log(`  created drink ${drink.itemId} (${drink.name})`);
  }
}

async function seedSpecialsMongo(createdBy) {
  const creator = createdBy || new mongoose.Types.ObjectId();
  for (const special of SPECIALS) {
    const existing = await Special.findOne({ specialId: special.specialId });
    if (existing) {
      await Special.updateOne(
        { specialId: special.specialId },
        {
          $set: {
            title: special.title,
            message: special.message,
            itemIds: special.itemIds,
            startDate: special.startDate,
            endDate: special.endDate,
          },
        }
      );
      summary.specialsUpserted += 1;
      log(`  updated special ${special.specialId} (${special.title})`);
    } else {
      await Special.create({ ...special, createdBy: creator });
      summary.specialsUpserted += 1;
      log(`  created special ${special.specialId} (${special.title})`);
    }
  }
}

async function seedCustomersMongo() {
  for (const customer of DEMO_CUSTOMERS) {
    const existing = await Customer.findOne({ email: customer.email });
    if (existing) {
      await Customer.updateOne({ email: customer.email }, { $set: customer });
      summary.customersUpserted += 1;
      log(`  updated demo customer ${customer.email}`);
    } else {
      await Customer.create(customer);
      summary.customersUpserted += 1;
      log(`  created demo customer ${customer.email}`);
    }
  }
}

async function seedMenuApi() {
  const menu = await api('GET', '/menu');
  const byId = new Map((menu || []).map((item) => [String(item.itemId), item]));
  const byName = new Map((menu || []).map((item) => [item.name && item.name.trim(), item]));

  for (const [itemId, details] of Object.entries(MENU_DETAILS)) {
    const item = byId.get(itemId);
    if (!item) {
      log(`  skip menu ${itemId} (not in API)`);
      continue;
    }
    const body = {};
    const cleanName = item.name ? item.name.trim() : details.name;
    const cleanCategory = item.category ? item.category.trim() : item.category;
    if (cleanName !== item.name) body.name = cleanName;
    if (cleanCategory !== item.category) body.category = cleanCategory;
    if (!item.description) body.description = details.description;
    if (!item.imageUrl) body.imageUrl = details.imageUrl;
    if (Object.keys(body).length === 0) continue;
    await api('PATCH', `/menu/${itemId}`, body);
    summary.menuUpdated += 1;
    log(`  updated menu ${itemId} (${cleanName}): ${Object.keys(body).join(', ')}`);
  }

  for (const drink of DRINKS) {
    const existing = byId.get(drink.itemId) || byName.get(drink.name);
    if (existing) {
      const body = {};
      if (!existing.description) body.description = drink.description;
      if (!existing.imageUrl) body.imageUrl = drink.imageUrl;
      if (!existing.category) body.category = drink.category;
      if (Object.keys(body).length) {
        await api('PATCH', `/menu/${existing.itemId}`, body);
        summary.drinksUpserted += 1;
        log(`  updated drink ${existing.itemId} (${existing.name})`);
      }
      continue;
    }
    const created = await api('POST', '/menu', {
      name: drink.name,
      category: 'drink',
      available: true,
      price: drink.price,
      description: drink.description,
      imageUrl: drink.imageUrl,
    });
    const saved = created.savedItem || created;
    if (saved && saved.itemId) {
      await api('PATCH', `/menu/${saved.itemId}`, {
        description: drink.description,
        imageUrl: drink.imageUrl,
        category: drink.category,
      });
    }
    summary.drinksUpserted += 1;
    log(`  created drink (${drink.name})`);
  }
}

async function seedSpecialsApi(createdBy) {
  if (!createdBy) throw new Error('SEED_USER_ID is required to upsert specials via the API');
  const existing = await api('GET', '/specials');
  const byId = new Map((existing || []).map((s) => [Number(s.specialId), s]));
  for (const special of SPECIALS) {
    const current = byId.get(special.specialId);
    const body = {
      title: special.title,
      message: special.message,
      itemIds: special.itemIds,
      startDate: special.startDate,
      endDate: special.endDate,
    };
    if (current) {
      await api('PATCH', `/specials/${current._id}`, body);
      summary.specialsUpserted += 1;
      log(`  updated special ${special.specialId} (${special.title})`);
    } else {
      await api('POST', '/specials', { ...special, ...body, createdBy });
      summary.specialsUpserted += 1;
      log(`  created special ${special.specialId} (${special.title})`);
    }
  }
}

async function seedCustomersApi() {
  for (const customer of DEMO_CUSTOMERS) {
    await api('POST', '/customers', customer);
    summary.customersUpserted += 1;
    log(`  posted demo customer ${customer.email} (create is append-only via API)`);
  }
}

async function main() {
  const useApi = Boolean(API_BASE) && !process.env.MONGODB_URI;
  if (!process.env.MONGODB_URI && !API_BASE) {
    throw new Error('Set MONGODB_URI or API_BASE (plus SEED_TOKEN and SEED_USER_ID for specials)');
  }

  log(`🌱 Seeding Donut Nook demo data via ${process.env.MONGODB_URI ? 'MongoDB' : 'API'}...`);

  if (process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI);
    log('✅ Connected to MongoDB');
    await seedMenuMongo();
    await seedSpecialsMongo(SEED_USER_ID || undefined);
    await seedCustomersMongo();
    await mongoose.disconnect();
  } else {
    await seedMenuApi();
    await seedSpecialsApi(SEED_USER_ID);
    await seedCustomersApi();
  }

  log('✅ Seed complete');
  log(`   menu items updated: ${summary.menuUpdated}`);
  log(`   drinks upserted: ${summary.drinksUpserted}`);
  log(`   specials upserted: ${summary.specialsUpserted}`);
  log(`   demo customers upserted: ${summary.customersUpserted}`);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
