import { randomUUID } from 'crypto';

export type JobStatus = 'processing' | 'completed' | 'error';

export interface Job {
  id: string;
  status: JobStatus;
  filename?: string;
  filePath?: string;
  error?: string;
  createdAt: number;
}

// In-memory store for jobs.
// NOTE: For a multi-server setup, replace this with a Redis instance.
const jobs = new Map<string, Job>();

export function createJob(): Job {
  const id = randomUUID();
  const job: Job = {
    id,
    status: 'processing',
    createdAt: Date.now(),
  };
  jobs.set(id, job);
  return job;
}

export function updateJob(id: string, updates: Partial<Job>): Job | undefined {
  const job = jobs.get(id);
  if (job) {
    const updated = { ...job, ...updates };
    jobs.set(id, updated);
    return updated;
  }
  return undefined;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function deleteJob(id: string): void {
  jobs.delete(id);
}

// Auto-cleanup stale jobs that are older than 30 minutes
setInterval(() => {
  const now = Date.now();
  jobs.forEach((job, id) => {
    if (now - job.createdAt > 30 * 60 * 1000) {
      jobs.delete(id);
    }
  });
}, 5 * 60 * 1000);
