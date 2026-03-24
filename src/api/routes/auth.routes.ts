import { Router } from 'express';
import { randomBytes } from 'crypto';
import { db } from '../../db/client';
import { apiKeys } from '../../db/schema';

const router = Router();

router.post('/keys', async (req, res) => {
  try {
    const { name, adminSecret } = req.body;

    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized: Invalid Admin Secret' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Key name is required' });
    }

    const key = `ak_${randomBytes(24).toString('hex')}`;
    
    const [newKey] = await db.insert(apiKeys).values({
      key,
      name,
      isActive: true
    }).returning();

    res.status(201).json({ 
      message: 'API Key generated successfully. Save it now, it won\'t be shown again!',
      name: newKey.name,
      apiKey: newKey.key 
    });
  } catch (error) {
    console.error('Key Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate API key' });
  }
});

export default router;