import { db } from '../db/client';
import { jobs, deliveryAttempts } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export class JobRepository {
  async findById(id: string) {
    return await db.query.jobs.findFirst({
      where: eq(jobs.id, id),
      with: {
        attempts: true, 
      }
    });
  }

  async findByPipelineId(pipelineId: string) {
    return await db.query.jobs.findMany({
      where: eq(jobs.pipelineId, pipelineId),
      orderBy: [desc(jobs.createdAt)],
      limit: 50 
    });
  }
}