import { Router } from 'express';
import { SubscriberController } from '../../controllers/subscriber.controller';

const router = Router();

router.post('/', SubscriberController.create);
router.get('/pipelines/:pipelineId/subscribers', SubscriberController.listByPipeline);
router.delete('/:id', SubscriberController.remove);

export default router;