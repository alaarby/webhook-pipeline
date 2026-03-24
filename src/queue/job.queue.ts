import { Queue, ConnectionOptions } from 'bullmq';

const connectionOptions: ConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

export const webhookQueue = new Queue('webhook-tasks', { 
  connection: connectionOptions 
});

export const addJobToQueue = async (data: any) => {
  await webhookQueue.add('process-webhook', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  });
};