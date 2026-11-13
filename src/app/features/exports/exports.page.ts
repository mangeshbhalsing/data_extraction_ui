import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ExportItem } from '../../core/models/saas.models';
import { SaasApiService } from '../../core/services/saas-api.service';

@Component({ selector: 'app-exports-page', imports: [DatePipe], template: `
  <header class="head"><div><span class="eyebrow">DOWNLOAD APPROVED DATA</span><h1>Exports</h1><p>Generate a CSV containing approved extraction records only.</p></div><button (click)="create()" [disabled]="busy()">{{ busy() ? 'Creating…' : 'Create CSV export' }}</button></header>
  @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
  <section class="panel"><h2>Recent exports</h2>@if (!items().length) { <p class="muted">No exports yet. Approve extraction data before creating a CSV.</p> }
    @for (item of items(); track item.exportId) { <div class="item"><div><strong>{{ item.filename }}</strong><small>{{ item.status }} · {{ item.createdAt | date:'medium' }}</small></div><button class="secondary" (click)="download(item)">Download</button></div> }
  </section>
  `, styles: [`:host{display:block}.head,.item{display:flex;align-items:center;justify-content:space-between;gap:12px}.head{margin-bottom:20px}.head h1{margin:7px 0;font-size:22px}.head p,.muted,small{color:#758397;font-size:11px}.eyebrow{color:#4385a8;font-size:9px;font-weight:800;letter-spacing:1.2px}.panel{padding:18px;border:1px solid var(--color-border);border-radius:12px;background:white}.panel h2{margin:0 0 15px;font-size:13px}.item{padding:13px 0;border-top:1px solid #edf0f4}.item>div{display:grid;gap:5px}.item strong{font-size:11px}.item small{font-size:9px}button{border:0;border-radius:7px;padding:10px 14px;background:#2381b1;color:#fff;font-size:10px;cursor:pointer}button.secondary{background:#eaf7ff;color:#276488}button:disabled{opacity:.6}.error{color:#a33;font-size:11px}`] })
export class ExportsPage {
  private readonly api = inject(SaasApiService);
  protected readonly items = signal<ExportItem[]>([]);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  constructor() { this.refresh(); }
  protected refresh(): void { this.api.exports().subscribe({ next: items => this.items.set(items), error: e => this.error.set(e?.error?.message || 'Could not load exports.') }); }
  protected create(): void { this.busy.set(true); this.api.createExport().subscribe({ next: item => { this.items.update(items => [item, ...items]); this.busy.set(false); }, error: e => { this.error.set(e?.error?.message || 'Could not create export.'); this.busy.set(false); } }); }
  protected download(item: ExportItem): void { this.api.downloadExport(item.exportId).subscribe({ next: blob => { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = item.filename; link.click(); URL.revokeObjectURL(url); }, error: e => this.error.set(e?.error?.message || 'Could not download export.') }); }
}
