import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { AdminApiService } from '../../core/services/admin-api.service';
import { CreateUserRequest, ManagedOrganization, ManagedUser, UserRole } from '../../core/models/admin.models';
import { toApiError } from '../../core/utils/api-error';

@Component({
  selector: 'app-admin-users-page',
  imports: [DatePipe],
  templateUrl: './admin-users.page.html',
  styleUrl: './admin-users.page.css',
})
export class AdminUsersPage {
  private readonly api = inject(AdminApiService);
  protected readonly auth = inject(AuthService);
  protected readonly currentUser = this.auth.user;
  protected readonly isSuperAdmin = () => this.currentUser()?.role === 'SUPER_ADMIN';
  protected readonly activeTab = signal<'users' | 'create-user' | 'create-organization'>('users');
  protected readonly editingUser = signal<ManagedUser | null>(null);
  protected readonly users = signal<ManagedUser[]>([]);
  protected readonly organizations = signal<ManagedOrganization[]>([]);
  protected readonly selectedOrganizationId = signal('');
  protected readonly newUserRole = signal<'USER' | 'ADMIN'>('USER');
  protected readonly adminCount = computed(() => this.users().filter(user => user.role === 'ADMIN' || user.role === 'SUPER_ADMIN').length);
  protected readonly suspendedCount = computed(() => this.users().filter(user => !user.enabled).length);
  protected readonly drafts = signal<Record<string, UserRole>>({});
  protected readonly loading = signal(true);
  protected readonly busyId = signal('');
  protected readonly error = signal('');
  protected readonly notice = signal('');

  constructor() {
    this.load();
    if (this.isSuperAdmin()) this.loadOrganizations();
  }

  protected roleDraft(user: ManagedUser): UserRole { return this.drafts()[user.userId] ?? user.role; }
  protected roleChanged(user: ManagedUser): boolean { return this.roleDraft(user) !== user.role; }
  protected isSelf(user: ManagedUser): boolean { return user.userId === this.currentUser()?.userId; }
  protected canEditRole(user: ManagedUser): boolean { return user.role !== 'SUPER_ADMIN' && !user.protectedAdmin; }
  protected canManageUser(user: ManagedUser): boolean {
    return user.role !== 'SUPER_ADMIN' && !user.protectedAdmin && (this.isSuperAdmin() || user.organizationId === this.currentUser()?.organizationId);
  }
  protected changeTab(tab: 'users' | 'create-user' | 'create-organization'): void { this.activeTab.set(tab); this.error.set(''); this.notice.set(''); }
  protected setNewUserRole(event: Event): void { this.newUserRole.set((event.target as HTMLSelectElement).value as 'USER' | 'ADMIN'); }

  protected setRole(user: ManagedUser, event: Event): void {
    const role = (event.target as HTMLSelectElement).value as UserRole;
    this.drafts.update(current => ({ ...current, [user.userId]: role }));
  }

  protected saveRole(user: ManagedUser): void {
    this.update(user, { role: this.roleDraft(user) }, `${user.displayName} is now ${this.roleDraft(user) === 'ADMIN' ? 'an administrator' : 'a regular user'}.`);
  }

  protected toggleAccess(user: ManagedUser): void {
    const enabled = !user.enabled;
    this.update(user, { enabled }, enabled ? `${user.displayName} can sign in again.` : `${user.displayName}'s access has been suspended.`);
  }

  protected refresh(): void { this.load(); }
  protected beginEdit(user: ManagedUser): void { this.editingUser.set(user); this.error.set(''); this.notice.set(''); }
  protected closeEdit(): void { if (!this.busyId()) this.editingUser.set(null); }

  protected saveUser(user: ManagedUser, event: Event): void {
    event.preventDefault();
    if (this.busyId()) return;
    const form = event.target as HTMLFormElement;
    const values = new FormData(form);
    const password = String(values.get('password') ?? '');
    const request: { email: string; displayName: string; password?: string } = {
      email: String(values.get('email') ?? ''),
      displayName: String(values.get('displayName') ?? ''),
    };
    if (password) request.password = password;
    this.busyId.set(user.userId); this.error.set(''); this.notice.set('');
    this.api.updateUser(user.userId, request).subscribe({
      next: updated => {
        this.users.update(items => items.map(item => item.userId === updated.userId ? updated : item));
        this.editingUser.set(null); this.notice.set(`${updated.displayName}'s account was updated.`); this.busyId.set('');
      },
      error: cause => { this.error.set(toApiError(cause).message); this.busyId.set(''); },
    });
  }

  protected deleteUser(user: ManagedUser): void {
    if (this.busyId() || this.isSelf(user)) return;
    if (!window.confirm(`Delete ${user.displayName} (${user.email})? This permanently removes their account and signs them out.`)) return;
    this.busyId.set(user.userId); this.error.set(''); this.notice.set('');
    this.api.deleteUser(user.userId).subscribe({
      next: () => {
        this.users.update(items => items.filter(item => item.userId !== user.userId));
        this.drafts.update(current => { const next = { ...current }; delete next[user.userId]; return next; });
        this.notice.set(`${user.displayName}'s account was deleted.`); this.busyId.set('');
      },
      error: cause => { this.error.set(toApiError(cause).message); this.busyId.set(''); },
    });
  }

  protected createUser(event: Event): void {
    event.preventDefault();
    if (this.busyId()) return;
    const form = event.target as HTMLFormElement;
    const values = new FormData(form);
    const request: CreateUserRequest = {
      email: String(values.get('email') ?? ''),
      displayName: String(values.get('displayName') ?? ''),
      password: String(values.get('password') ?? ''),
      role: this.isSuperAdmin() ? this.newUserRole() : 'USER',
    };
    if (this.isSuperAdmin()) request.organizationId = String(values.get('organizationId') ?? this.selectedOrganizationId());
    this.busyId.set('create-user'); this.error.set(''); this.notice.set('');
    this.api.createUser(request).subscribe({
      next: created => {
        this.busyId.set(''); this.newUserRole.set('USER'); form.reset(); this.load(); this.changeTab('users');
        this.notice.set(`${created.displayName} was added to ${created.organizationName}.`);
      },
      error: cause => { this.busyId.set(''); this.error.set(toApiError(cause).message); },
    });
  }

  protected createOrganization(event: Event): void {
    event.preventDefault();
    if (this.busyId()) return;
    const form = event.target as HTMLFormElement;
    const values = new FormData(form);
    this.busyId.set('create-organization'); this.error.set(''); this.notice.set('');
    this.api.createOrganization({
      name: String(values.get('name') ?? ''),
      adminDisplayName: String(values.get('adminDisplayName') ?? ''),
      adminEmail: String(values.get('adminEmail') ?? ''),
      adminPassword: String(values.get('adminPassword') ?? ''),
    }).subscribe({
      next: created => {
        this.busyId.set(''); form.reset(); this.load(); this.loadOrganizations(); this.changeTab('users');
        this.notice.set(`${created.name} was created with ${created.adminEmail} as its administrator.`);
      },
      error: cause => { this.busyId.set(''); this.error.set(toApiError(cause).message); },
    });
  }

  private load(): void {
    this.loading.set(true); this.error.set('');
    this.api.listUsers().subscribe({
      next: users => {
        this.users.set(users);
        this.drafts.set(Object.fromEntries(users.map(user => [user.userId, user.role])) as Record<string, UserRole>);
        this.loading.set(false);
      },
      error: cause => { this.error.set(toApiError(cause).message); this.loading.set(false); },
    });
  }

  private loadOrganizations(): void {
    this.api.listOrganizations().subscribe({
      next: organizations => {
        this.organizations.set(organizations);
        if (!this.selectedOrganizationId() && organizations.length) this.selectedOrganizationId.set(organizations[0].organizationId);
      },
      error: cause => this.error.set(toApiError(cause).message),
    });
  }

  private update(user: ManagedUser, change: { role?: UserRole; enabled?: boolean }, message: string): void {
    if (this.busyId()) return;
    this.busyId.set(user.userId); this.error.set(''); this.notice.set('');
    this.api.updateAccess(user.userId, change).subscribe({
      next: updated => {
        this.users.update(users => users.map(item => item.userId === updated.userId ? updated : item));
        this.drafts.update(current => ({ ...current, [updated.userId]: updated.role }));
        this.notice.set(message); this.busyId.set('');
      },
      error: cause => { this.error.set(toApiError(cause).message); this.busyId.set(''); },
    });
  }
}
