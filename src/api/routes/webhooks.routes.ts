import { Router } from 'express';
import { IngestionController } from '../../controllers/ingestion.controller';
import { verifyWebhookSignature } from '../../middleware/verify-signature';

export const webhooksRouter = Router();

webhooksRouter.post('/:pipelineId', verifyWebhookSignature, IngestionController.handleWebhook);