export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  departmentId?: string | null;
  roleCodes: string[];
  permissions: string[];
}

