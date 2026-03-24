import express from 'express';
import { pipelinesRouter } from './api/routes/pipelines.routes';
import { webhooksRouter } from './api/routes/webhooks.routes';
import { apiKeysRouter } from './api/routes/api-keys.routes';
import { apiLimiter, webhookLimiter } from './middleware/rateLimiter';
import { requireApiKey } from './middleware/auth.middleware';
import { verifyWebhookSignature } from './middleware/verify-signature'; 
import { IngestionController } from './controllers/ingestion.controller';
import jobsRouter from './api/routes/jobs.routes';
import authRouter from './api/routes/auth.routes';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.post(
    '/wh/:sourcePath', 
    webhookLimiter, 
    verifyWebhookSignature, 
    IngestionController.handleWebhook
  );

  
  app.use('/api-keys', apiLimiter, apiKeysRouter);
  app.use('/api/auth', authRouter);
  app.use('/pipelines', apiLimiter, requireApiKey, pipelinesRouter);
  
  app.use('/jobs', apiLimiter, requireApiKey, jobsRouter);
  
  app.use('/webhooks', apiLimiter, requireApiKey, webhooksRouter); 

  return app;
}