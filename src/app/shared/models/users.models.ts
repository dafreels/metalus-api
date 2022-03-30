export interface User {
  id: string;
  username: string;
  password: string;
  displayName: string;
  role: Role;
  defaultProjectId: string;
  projects: Project[];
  version?: number;
}

export enum Role {
  admin,
  developer
}

export interface Project {
  id: string;
  displayName: string;
  preloadedLibraries?: string[];
}

export interface ChangePassword {
  id: string;
  password: string;
  newPassword: string;
  verifyNewPassword: string;
}

export interface UserResponse {
  users: User[];
}

export interface UsageReportResponse {
  report: UsageReport;
}

export interface UsageReport {
  applicationsCount: number;
  pipelinesCount: number;
  packageObjectsCount: number;
  stepsCount: number;
  executionTemplatesCount: number;
  jobsCount: number;
  providersCount: number;
}
