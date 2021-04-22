import {Provider} from "./providers.model";

export interface Job {
  id: string;
  name: string;
  applicationId: string;
  applicationName: string;
  providerId: string;
  projectId: string;
  lastStatus?: string;
  logLevel?: string;
  rooLogLevel?: string;
  customLogLevels?: string;
  useCredentialProvider?: boolean;
  providerInformation: object;
  jobType?: string;
  submitTime?: number;
  startTime?: number;
  endTime?: number;
  executionDuration?: number;
}

export enum JobStatus {
  RUNNING,
  FAILED,
  CANCELLED,
  COMPLETE,
  PENDING,
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
