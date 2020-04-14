export interface User {
  id: string;
  username: string;
  password: string;
  displayName: string;
  role: Role;
  defaultProjectId: string;
  projects: Project[];
}

export enum Role {
  admin,
  developer
}

export interface Project {
  id: string;
  displayName: string;
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
