export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER';

export interface ManagedUser {
  userId: string;
  organizationId: string;
  organizationName: string;
  email: string;
  displayName: string;
  role: UserRole;
  enabled: boolean;
  protectedAdmin: boolean;
  createdAt: string;
}

export interface UpdateUserAccessRequest {
  enabled?: boolean;
  role?: UserRole;
}

export interface UpdateManagedUserRequest { email: string; displayName: string; password?: string; }

export interface ManagedOrganization { organizationId: string; name: string; createdAt: string; }
export interface CreateUserRequest { email: string; displayName: string; password: string; role?: 'ADMIN' | 'USER'; organizationId?: string; }
export interface CreateOrganizationRequest { name: string; adminEmail: string; adminDisplayName: string; adminPassword: string; }
export interface CreatedOrganization { organizationId: string; name: string; adminUserId: string; adminEmail: string; createdAt: string; }
