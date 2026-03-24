// src/db/seed.ts
import { db } from './client';
import { apiKeys } from './schema';
import { randomBytes } from 'crypto';

async function seed() {
  const newKey = `ak_${randomBytes(24).toString('hex')}`;
  await db.insert(apiKeys).values({ key: newKey, name: 'Initial Admin Key' });
  console.log(`✅ Created API Key: ${newKey}`);
  process.exit(0);
}

seed();