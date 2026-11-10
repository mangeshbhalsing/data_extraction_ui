import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthCredentials, RegistrationRequest, UserProfile } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly authUrl = `${environment.apiBaseUrl}/v1/auth`;
  private readonly current = signal<UserProfile | null>(null);
  readonly user = this.current.asReadonly();
  readonly isAuthenticated = computed(() => this.current() !== null);

  loadProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${environment.apiBaseUrl}/v1/users/me`).pipe(tap(user => this.current.set(user)));
  }

  login(credentials: AuthCredentials): Observable<UserProfile> {
    return this.csrf().pipe(
      switchMap(() => this.http.post<UserProfile>(`${this.authUrl}/login`, credentials)),
      tap(user => this.current.set(user)),
    );
  }

  register(request: RegistrationRequest): Observable<UserProfile> {
    return this.csrf().pipe(
      switchMap(() => this.http.post<void>(`${this.authUrl}/register`, request)),
      switchMap(() => this.login(request)),
    );
  }

  logout(): Observable<void> {
    return this.csrf().pipe(
      switchMap(() => this.http.post<void>(`${this.authUrl}/logout`, {})),
      tap(() => this.current.set(null)),
      catchError(error => { this.current.set(null); return of(undefined); }),
    );
  }

  ensureSignedIn(): Observable<boolean> {
    if (this.current()) return of(true);
    return this.loadProfile().pipe(map(() => true), catchError(() => of(false)));
  }

  private csrf(): Observable<unknown> { return this.http.get(`${this.authUrl}/csrf`); }
}
