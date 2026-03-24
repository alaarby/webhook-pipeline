import { Request, Response, NextFunction } from 'express';
import { db } from '../db/client';
import { apiKeys } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const requireApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({ error: 'API Key is missing' });
    }

    const [foundKey] = await db.select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.key, apiKey),
          eq(apiKeys.isActive, true)
        )
      )
      .limit(1);

    if (!foundKey) {
      return res.status(403).json({ error: 'Invalid or inactive API Key' });
    }

    (req as any).apiKey = foundKey;
    next();
  } catch (err) {
    console.error('Auth Error:', err);
    res.status(500).json({ error: 'Database connection error' });
  }
};