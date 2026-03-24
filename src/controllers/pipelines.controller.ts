import { Request, Response } from 'express';
import { PipelineService } from '../services/pipeline.service';

const service = new PipelineService();

export class PipelineController {
  static async create(req: Request, res: Response) {
    try {
      const { name, actionType } = req.body;
      
      if (!name || !actionType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const pipeline = await service.registerNewPipeline(name, actionType);
      res.status(201).json(pipeline);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async list(req: Request, res: Response) {
    const data = await service.getAllPipelines();
    res.json(data);
  }
  static async getOne(req: Request, res: Response) {
    try {
      const pipeline = await service.getPipelineById(req.params.id as string);
      res.json(pipeline);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const pipeline = await service.updatePipeline(req.params.id as string, req.body);
      res.json(pipeline);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      await service.deletePipeline(req.params.id as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }
}