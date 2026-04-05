export interface CurrentUser {
  id: string;
  username: string;
  displayName: string;
  departmentId?: string | null;
  roleCodes: string[];
  permissions: string[];
}

export interface LoginResponse {
  accessToken: string;
  user: CurrentUser;
}

