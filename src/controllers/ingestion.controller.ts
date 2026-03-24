import { Request, Response } from 'express';
import { PipelineRepository } from '../repositories/pipeline.repository';
import { addJobToQueue } from '../queue/job.queue';

const repo = new PipelineRepository();

export class IngestionController {
  static async handleWebhook(req: Request, res: Response) {
    try {
      const { sourcePath } = req.params;

      const pipeline = (req as any).pipeline;
      if (!pipeline) {
        return res.status(404).json({ error: 'Pipeline not found' });
      }

      const dbJob = await repo.createJob({
        pipelineId: pipeline.id,
        payload: req.body,
      });

      await addJobToQueue({
        jobId: dbJob.id,
        pipelineId: pipeline.id,
        payload: req.body,
        actionType: pipeline.actionType,
        subscribers: pipeline.subscribers,
      });

      res.status(202).json({
        message: 'Accepted',
        jobId: dbJob.id,
      });

    } catch (error: any) {
      console.error('Ingestion Error:', error);
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  }
}