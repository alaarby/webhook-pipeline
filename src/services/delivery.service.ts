import axios from 'axios';
import { db } from '../db/client';
import { deliveryAttempts } from '../db/schema';

export class DeliveryService {
  async deliver(jobId: string, processedData: any, subscribers: any[] = []) {
    
    const targets = subscribers || [];

    const deliveryPromises = targets.map(async (sub) => {
      try {
        const response = await axios.post(sub.targetUrl, processedData, { timeout: 5000 });
        
        await this.logAttempt(jobId, sub.id, 'success', response.status);
        console.log(`✅ Delivered to ${sub.targetUrl}`);
        
      } catch (error: any) {
        const statusCode = error.response?.status || 500;
        await this.logAttempt(jobId, sub?.id, 'failed', statusCode);
        console.error(`❌ Failed to ${sub?.targetUrl}: ${error.message}`);
      }
    });

    await Promise.allSettled(deliveryPromises);
  }

  private async logAttempt(jobId: string, subscriberId: string, status: string, code: number) {
    if (!subscriberId) return;

    await db.insert(deliveryAttempts).values({
      jobId,
      subscriberId,
      status,
      responseCode: code,
    });
  }
}