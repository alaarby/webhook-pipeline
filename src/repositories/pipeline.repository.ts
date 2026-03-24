import { db } from '../db/client';
import { jobs, pipelines, subscribers } from '../db/schema';
import { eq } from 'drizzle-orm';

export class PipelineRepository {
  async create(data: any) {
    return await db.insert(pipelines).values(data).returning();
  }

  async findAll() {
    return await db.query.pipelines.findMany({
      with: { subscribers: true }
    });
  }
  async findById(id: string) {
    return await db.query.pipelines.findFirst({
      where: eq(pipelines.id, id),
      with: { subscribers: true }
    });
  }
  async findBySourcePath(sourcePath: string) {
    const [result] = await db
      .select()
      .from(pipelines)
      .where(eq(pipelines.sourcePath, sourcePath))
      .limit(1);
    
    return result || null;
  }
  async update(id: string, data: Partial<typeof pipelines.$inferInsert>) {
    return await db.update(pipelines)
      .set(data)
      .where(eq(pipelines.id, id))
      .returning();
  }

  async delete(id: string) {
    return await db.delete(pipelines)
      .where(eq(pipelines.id, id))
      .returning();
  }
  async createJob(data: { pipelineId: string; payload: any }) {
  const [newJob] = await db.insert(jobs).values({
    pipelineId: data.pipelineId,
    payload: data.payload,
    status: 'pending', 
  }).returning();
  
  return newJob;
}
}