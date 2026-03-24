import { JobRepository } from '../repositories/job.repository';

const repo = new JobRepository();

export class JobService {
  async getJobStatus(jobId: string) {
    const job = await repo.findById(jobId);
    if (!job) throw new Error('Job not found');
    return job;
  }

  async getPipelineHistory(pipelineId: string) {
    return await repo.findByPipelineId(pipelineId);
  }
}