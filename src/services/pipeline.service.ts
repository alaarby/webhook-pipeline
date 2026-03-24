import { randomBytes, randomUUID } from 'crypto'; // استخدام المكتبة المدمجة
import { PipelineRepository } from '../repositories/pipeline.repository';

const repo = new PipelineRepository();

export class PipelineService {
  async registerNewPipeline(name: string, actionType: string) {
   
    const uniqueSuffix = randomBytes(6).toString('hex');
    const sourcePath = `wh_${uniqueSuffix}`; 
    
    const signingSecret = randomBytes(32).toString('hex');

    const [pipeline] = await repo.create({
      name,
      actionType,
      sourcePath,
      signingSecret 
    });
    
    return pipeline;
  }

  async getAllPipelines() {
    return await repo.findAll();
  }

  async getPipelineById(id: string) {
    const pipeline = await repo.findById(id);
    if (!pipeline) throw new Error('Pipeline not found');
    return pipeline;
  }

  async updatePipeline(id: string, data: { name?: string; actionType?: string }) {
    const [updated] = await repo.update(id, data);
    if (!updated) throw new Error('Pipeline not found or update failed');
    return updated;
  }

  async deletePipeline(id: string) {
    const [deleted] = await repo.delete(id);
    if (!deleted) throw new Error('Pipeline not found');
    return deleted;
  }
}