import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateOrganizationRequest, CreateUserRequest, CreatedOrganization, ManagedOrganization, ManagedUser, UpdateManagedUserRequest, UpdateUserAccessRequest } from '../models/admin.models';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly usersUrl = `${environment.apiBaseUrl}/v1/admin/users`;

  listUsers(): Observable<ManagedUser[]> {
    return this.http.get<ManagedUser[]>(this.usersUrl);
  }

  listOrganizations(): Observable<ManagedOrganization[]> {
    return this.http.get<ManagedOrganization[]>(`${this.usersUrl}/organizations`);
  }

  createUser(request: CreateUserRequest): Observable<ManagedUser> {
    return this.http.post<ManagedUser>(this.usersUrl, request);
  }

  createOrganization(request: CreateOrganizationRequest): Observable<CreatedOrganization> {
    return this.http.post<CreatedOrganization>(`${this.usersUrl}/organizations`, request);
  }

  updateAccess(userId: string, update: UpdateUserAccessRequest): Observable<ManagedUser> {
    return this.http.patch<ManagedUser>(`${this.usersUrl}/${encodeURIComponent(userId)}/access`, update);
  }

  updateUser(userId: string, update: UpdateManagedUserRequest): Observable<ManagedUser> {
    return this.http.put<ManagedUser>(`${this.usersUrl}/${encodeURIComponent(userId)}`, update);
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.usersUrl}/${encodeURIComponent(userId)}`);
  }
}
