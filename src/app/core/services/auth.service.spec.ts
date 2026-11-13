import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('obtains a CSRF token before login and stores the server profile in memory', () => {
    let signedIn = false;
    service.login({ email: 'user@example.test', password: 'StrongPass123!' }).subscribe(() => signedIn = service.isAuthenticated());
    http.expectOne('/api/v1/auth/csrf').flush({ token: 'csrf-token' });
    const login = http.expectOne('/api/v1/auth/login');
    expect(login.request.method).toBe('POST');
    expect(login.request.body).toEqual({ email: 'user@example.test', password: 'StrongPass123!' });
    login.flush({ userId: 'user-1', organizationId: 'org-1', email: 'user@example.test', displayName: 'Test User', role: 'USER' });
    expect(signedIn).toBe(true);
    expect(service.user()?.organizationId).toBe('org-1');
  });

  it('clears the in-memory profile after server logout', () => {
    service.logout().subscribe();
    http.expectOne('/api/v1/auth/csrf').flush({ token: 'csrf-token' });
    const logout = http.expectOne('/api/v1/auth/logout');
    expect(logout.request.method).toBe('POST');
    logout.flush(null);
    expect(service.user()).toBeNull();
  });
});
