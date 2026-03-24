import { Worker, Job } from 'bullmq';
import { DeliveryService } from './services/delivery.service';
import { eq } from 'drizzle-orm';
import { jobs } from './db/schema';
import { db } from './db/client';

const connectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

const deliveryService = new DeliveryService();


const worker = new Worker('webhook-tasks', async (job: Job) => {
    const { jobId, payload, actionType, subscribers } = job.data;

    await db.update(jobs)
      .set({ status: 'processing', updatedAt: new Date() })
      .where(eq(jobs.id, jobId));

    try {
      const processedData = performAction(payload, actionType);
      
      await deliveryService.deliver(jobId, processedData, subscribers);

      await db.update(jobs)
        .set({ 
          status: 'completed', 
          result: processedData, 
          updatedAt: new Date() 
        })
        .where(eq(jobs.id, jobId));

    } catch (error: any) {
      await db.update(jobs)
        .set({ 
          status: 'failed', 
          error: error.message, 
          updatedAt: new Date() 
        })
        .where(eq(jobs.id, jobId));
        
      throw error;
    }
}, { connection: connectionOptions });


function performAction(payload: any, actionType: string) {
  switch (actionType) {
    case 'TRANSFORM_UPPERCASE':
      return JSON.parse(JSON.stringify(payload).toUpperCase());

    case 'FILTER_SENSITIVE':
      const { password, secret, token, ...cleanData } = payload;
      return cleanData;

    case 'ADD_TIMESTAMP':
      return { ...payload, processedAt: new Date().toISOString() };

    default:
      return payload;
  }
}

worker.on('completed', (job) => {
  console.log(`✅ [Job ${job.id}] All steps finished successfully.`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ [Job ${job?.id}] Permanently failed: ${err.message}`);
});

console.log('👷 Worker is running and waiting for jobs...');