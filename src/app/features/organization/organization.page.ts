import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Member, Organization } from '../../core/models/saas.models';
import { SaasApiService } from '../../core/services/saas-api.service';

@Component({ selector: 'app-organization-page', imports: [DatePipe], template: `
  <header><span class="eyebrow">WORKSPACE SETTINGS</span><h1>Organization</h1><p>Your data and member list are isolated to this organization.</p></header>
  @if (organization(); as org) { <section class="panel org"><span class="avatar">{{ org.name.charAt(0) }}</span><div><h2>{{ org.name }}</h2><p>{{ org.organizationId }}</p><span class="role">Your role: {{ org.role }}</span></div></section> }
  @if (error()) { <p class="error">{{ error() }}</p> }
  <section class="panel"><h2>Members</h2>@for (member of members(); track member.userId) { <div class="member"><div><strong>{{ member.displayName }}</strong><small>{{ member.email }}</small></div><span class="role">{{ member.role }}</span><time>{{ member.joinedAt | date:'mediumDate' }}</time></div> }</section>
  `, styles: [`:host{display:grid;gap:15px}header h1{margin:7px 0;font-size:22px}header p{color:#758397;font-size:11px}.eyebrow{color:#4385a8;font-size:9px;font-weight:800;letter-spacing:1.2px}.panel{padding:18px;border:1px solid var(--color-border);border-radius:12px;background:#fff}.org{display:flex;align-items:center;gap:14px}.avatar{display:grid;width:42px;height:42px;place-items:center;border-radius:12px;background:#eaf7ff;color:#347ba5;font-weight:800}.org h2{margin:0;font-size:14px}.org p,.member small,.member time{color:#758397;font-size:9px}.role{padding:5px 8px;border-radius:30px;background:#eff7fb;color:#477391;font-size:9px}.panel>h2{margin:0 0 10px;font-size:13px}.member{display:flex;align-items:center;gap:12px;padding:12px 0;border-top:1px solid #edf0f4}.member div{display:grid;gap:4px;flex:1}.member strong{font-size:11px}.member time{min-width:85px;text-align:right}.error{color:#a33;font-size:11px}`] })
export class OrganizationPage {
  private readonly api = inject(SaasApiService);
  protected readonly organization = signal<Organization | null>(null);
  protected readonly members = signal<Member[]>([]);
  protected readonly error = signal('');
  constructor() {
    this.api.organization().subscribe({ next: org => this.organization.set(org), error: e => this.error.set(e?.error?.message || 'Could not load organization.') });
    this.api.members().subscribe({ next: members => this.members.set(members), error: e => this.error.set(e?.error?.message || 'Could not load organization members.') });
  }
}
