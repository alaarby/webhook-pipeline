import { Router } from 'express';
import { PipelineController } from '../../controllers/pipelines.controller';

export const pipelinesRouter = Router();

pipelinesRouter.get('/',     PipelineController.list);
pipelinesRouter.get('/:id',  PipelineController.getOne);
pipelinesRouter.post('/',    PipelineController.create);
pipelinesRouter.patch('/:id', PipelineController.update);
pipelinesRouter.delete('/:id', PipelineController.remove);