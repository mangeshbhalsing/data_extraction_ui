export interface UserProfile {
  userId: string;
  organizationId: string;
  email: string;
  displayName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
}

export interface AuthCredentials { email: string; password: string; }
export interface RegistrationRequest extends AuthCredentials { displayName: string; }
