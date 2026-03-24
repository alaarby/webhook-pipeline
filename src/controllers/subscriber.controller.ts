import { Request, Response } from 'express';
import { SubscriberService } from '../services/subscriber.service';

const service = new SubscriberService();

export class SubscriberController {
  static async create(req: Request, res: Response) {
    try {
      const { pipelineId, targetUrl } = req.body;
      const subscriber = await service.addSubscriber(pipelineId, targetUrl);
      res.status(201).json(subscriber);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
  static async listByPipeline(req: Request, res: Response) {
  try {
    const data = await service.getSubscribersByPipeline(req.params.pipelineId as string);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
  static async remove(req: Request, res: Response) {
    try {
      await service.removeSubscriber(req.params.id as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }
}