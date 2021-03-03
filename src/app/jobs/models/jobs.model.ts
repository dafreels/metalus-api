import {Provider} from "./providers.model";

export interface Job {
  id: string;
  name: string;
  applicationId: string;
  applicationName: string;
  providerId: string;
  projectId: string;
  providerInformation: object;
  status?: string;
  jobType?: string;
  startTime?: number;
  endTime?: number;
  executionDuration?: number;
}

export enum JobStatus {
  RUNNING,
  FAILED,
  CANCELLED,
  COMPLETE,
}

export enum JobType {
  BATCH,
  STREAMING
}

export interface ProviderJob {
  job: Job;
  provider: Provider;
}

export interface JobsResponse {
  jobs: Job[]
}

export interface JobResponse {
  job: Job
}
