import { db } from '../db/client';
import { subscribers } from '../db/schema';
import { eq } from 'drizzle-orm';

export class SubscriberRepository {
  async create(data: { pipelineId: string; targetUrl: string }) {
    return await db.insert(subscribers).values(data).returning();
  }

  async findByPipelineId(pipelineId: string) {
    return await db.query.subscribers.findMany({
      where: eq(subscribers.pipelineId, pipelineId),
    });
  }
  
  async delete(id: string) {
    return await db.delete(subscribers).where(eq(subscribers.id, id)).returning();
  }
}