import { SubscriberRepository } from '../repositories/subscriber.repository';

const repo = new SubscriberRepository();

export class SubscriberService {
  async addSubscriber(pipelineId: string, targetUrl: string) {
    return await repo.create({ pipelineId, targetUrl });
  }
  async getSubscribersByPipeline(pipelineId: string) {
  return await repo.findByPipelineId(pipelineId);
}
  async removeSubscriber(id: string) {
    const [deleted] = await repo.delete(id);
    if (!deleted) throw new Error('Subscriber not found');
    return deleted;
  }
}