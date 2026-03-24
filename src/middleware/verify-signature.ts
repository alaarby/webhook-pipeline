import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { PipelineRepository } from '../repositories/pipeline.repository';

const repo = new PipelineRepository();

export const verifyWebhookSignature = async (req: Request, res: Response, next: NextFunction) => {
  const { sourcePath } = req.params;
  const signature = req.headers['x-webhook-signature'] as string;

  if (!signature) {
    console.log(`[Auth] Signature missing for path: ${sourcePath}`);
    return res.status(401).json({ error: 'Signature missing' });
  }

  try {
    const pipeline = await repo.findBySourcePath(sourcePath as string);

    if (!pipeline) {
      console.log(`[Auth] Pipeline not found: ${sourcePath}`);
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    const payload = JSON.stringify(req.body);
    const secret = pipeline.signingSecret;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const actualBuffer = Buffer.from(signature, 'utf8');

    if (
      expectedBuffer.length !== actualBuffer.length || 
      !crypto.timingSafeEqual(expectedBuffer, actualBuffer)
    ) {
      console.log(`[Security] Invalid signature attempt on ${sourcePath}`);
      return res.status(401).json({ error: 'Invalid signature' });
    }

    (req as any).pipeline = pipeline;

    console.log(`[Security] Signature verified for pipeline: ${pipeline.name}`);
    next();
  } catch (err) {
    console.error('🔥 Signature Verification System Error:', err);
    return res.status(500).json({ error: 'Internal server error during verification' });
  }
};