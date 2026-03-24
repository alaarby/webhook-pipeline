import { Router }   from 'express';
import { db }       from '../../db/client';
import { apiKeys  } from '../../db/schema';
import { randomBytes } from 'crypto';

export const apiKeysRouter = Router();

apiKeysRouter.post('/', async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  const key = randomBytes(32).toString('hex');

  const [apiKey] = await db
    .insert(apiKeys)
    .values({ key, name })
    .returning();

  res.status(201).json(apiKey);
});

apiKeysRouter.get('/', async (_req, res) => {
  const keys = await db.select().from(apiKeys);
  res.json(keys);
});