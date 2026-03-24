import { Request, Response } from 'express';
import { JobService } from '../services/job.service';

const service = new JobService();

export class JobController {
  static async getStatus(req: Request, res: Response) {
    try {
      const status = await service.getJobStatus(req.params.id as string);
      res.json(status);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  static async getHistory(req: Request, res: Response) {
    try {
      const history = await service.getPipelineHistory(req.params.pipelineId as string);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  }
}