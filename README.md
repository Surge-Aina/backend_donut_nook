# Donut Nook Backend

Express + MongoDB API for the Donut Nook demo shop.

## Scripts

- `npm start` — start the server (default port 5100)
- `npm test` — run Jest tests
- `npm run seed:demo` — load idempotent sample data (see below)

## Seed demo data

`scripts/seed-demo-data.js` fills the live catalog so the site looks complete. It is idempotent and **does not delete existing records**. It:

- Adds descriptions and images to existing menu items when those fields are empty, and trims stray whitespace on names/categories
- Upserts a small Drinks section (coffee, hot chocolate, juice, chocolate milk) if those items are missing
- Upserts current sample specials (specialId 2001–2004)
- Upserts clearly fake demo customers at `@example.com` only

It does not change About copy, store address or hours, or any customer who is not one of the `@example.com` demo accounts.

### Against MongoDB (preferred)

```bash
MONGODB_URI="your-mongodb-uri" npm run seed:demo
```

### Against the live API

Use this when you have an admin JWT but not the database URI. Menu description and image updates only persist if the menu controller in this repo has already been deployed.

```bash
API_BASE=https://backend-donut-nook.onrender.com SEED_TOKEN="admin-jwt" SEED_USER_ID="admin-user-object-id" npm run seed:demo
```

Never commit or print `MONGODB_URI`, `SEED_TOKEN`, or other secrets.
