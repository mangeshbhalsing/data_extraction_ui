import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { SaasApiService } from '../../core/services/saas-api.service';
import { AuditEvent } from '../../core/models/saas.models';
import { formatBytes } from '../../core/utils/api-error';

@Component({ selector: 'app-settings-page', imports: [DatePipe], template: `
  <header><span class="eyebrow">ACCOUNT & USAGE</span><h1>Settings</h1><p>Session and local H2 workspace details.</p></header>
  @if (user(); as profile) { <section class="panel"><h2>Signed-in account</h2><div class="line"><span>Name</span><strong>{{ profile.displayName }}</strong></div><div class="line"><span>Email</span><strong>{{ profile.email }}</strong></div><div class="line"><span>Role</span><strong>{{ profile.role }}</strong></div><div class="line"><span>Organization ID</span><strong>{{ profile.organizationId }}</strong></div></section> }
  @if (usage(); as u) { <section class="panel"><h2>Current usage</h2><div class="line"><span>Documents</span><strong>{{ u['documents'] }} / {{ u['documentLimit'] }}</strong></div><div class="line"><span>Storage</span><strong>{{ formatUsageBytes(u['storageBytes']) }} / {{ formatUsageBytes(u['storageLimitBytes']) }}</strong></div><div class="line"><span>Extraction jobs</span><strong>{{ u['extractionJobs'] }}</strong></div><small>{{ u['period'] }}</small></section> }
  @if (user()?.role === 'ADMIN' || user()?.role === 'SUPER_ADMIN') { <section class="panel"><h2>Recent audit activity</h2>@for (event of events(); track event.eventId) { <div class="line"><span>{{ event.action }} {{ event.resource }} · HTTP {{ event.responseStatus }}</span><strong>{{ event.createdAt | date:'medium' }}</strong></div> } @if (!events().length) { <small>No audited changes yet.</small> }</section> }
  @if (error()) { <p class="error">{{ error() }}</p> }
  `, styles: [`:host{display:grid;gap:15px}header h1{margin:7px 0;font-size:22px}header p,.panel small{color:#758397;font-size:11px}.eyebrow{color:#4385a8;font-size:9px;font-weight:800;letter-spacing:1.2px}.panel{max-width:700px;padding:18px;border:1px solid var(--color-border);border-radius:12px;background:#fff}.panel h2{margin:0 0 12px;font-size:13px}.line{display:flex;justify-content:space-between;gap:15px;padding:10px 0;border-top:1px solid #edf0f4;font-size:10px}.line span{color:#758397}.line strong{overflow-wrap:anywhere;text-align:right}.error{color:#a33;font-size:11px}`] })
export class SettingsPage {
  private readonly api = inject(SaasApiService);
  private readonly auth = inject(AuthService);
  protected readonly user = this.auth.user;
  protected readonly usage = signal<Record<string, string | number> | null>(null);
  protected readonly events = signal<AuditEvent[]>([]);
  protected readonly formatBytes = formatBytes;
  protected formatUsageBytes(value: string | number | undefined): string { return formatBytes(Number(value) || 0); }
  protected readonly error = signal('');
  constructor() {
    this.api.usage().subscribe({ next: value => this.usage.set(value), error: e => this.error.set(e?.error?.message || 'Could not load usage.') });
    if (this.user()?.role === 'ADMIN' || this.user()?.role === 'SUPER_ADMIN') this.api.audit().subscribe({ next: value => this.events.set(value), error: e => this.error.set(e?.error?.message || 'Could not load audit activity.') });
  }
}
