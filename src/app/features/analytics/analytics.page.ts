import { Component, inject, signal } from '@angular/core';
import { AnalyticsSummary } from '../../core/models/saas.models';
import { SaasApiService } from '../../core/services/saas-api.service';
import { formatBytes } from '../../core/utils/api-error';

@Component({ selector: 'app-analytics-page', template: `
  <header><span class="eyebrow">WORKSPACE METRICS</span><h1>Analytics</h1><p>Live counts from your H2-backed workspace.</p></header>
  @if (error()) { <p class="error">{{ error() }}</p> }
  @if (summary(); as s) { <div class="grid">
    <article><span>Documents</span><strong>{{ s.documentCount }}</strong></article><article><span>Extraction jobs</span><strong>{{ s.jobCount }}</strong></article>
    <article><span>Completed jobs</span><strong>{{ s.completedJobs }}</strong></article><article><span>Failed jobs</span><strong>{{ s.failedJobs }}</strong></article>
    <article><span>Pending review</span><strong>{{ s.pendingReviewCount }}</strong></article><article><span>Approved</span><strong>{{ s.approvedCount }}</strong></article>
    <article><span>Storage used</span><strong>{{ formatBytes(s.storageBytes) }}</strong></article>
  </div> } @else if (!error()) { <div class="panel">Loading workspace metrics…</div> }
  @for (group of chartGroups(); track group.title) { <section class="chart panel"><h2>{{ group.title }}</h2>@for (item of group.items; track item.name) { <div class="bar-row"><span>{{ item.name }}</span><div class="track"><div class="fill" [style.width.%]="item.width"></div></div><strong>{{ item.count }}</strong></div> } @empty { <p class="muted">No activity yet.</p> }</section> }
  <p class="note">Metrics are derived from your local H2 workspace.</p>
  `, styles: [`:host{display:block}header h1{margin:7px 0;font-size:22px}header p,.note,.muted{color:#758397;font-size:11px}.eyebrow{color:#4385a8;font-size:9px;font-weight:800;letter-spacing:1.2px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-top:20px}.grid article,.panel{display:grid;gap:12px;padding:18px;border:1px solid var(--color-border);border-radius:12px;background:#fff}.grid span{color:#758397;font-size:10px}.grid strong{font-size:24px;color:#263b55}.chart{margin-top:12px}.chart h2{margin:0;font-size:13px}.bar-row{display:grid;grid-template-columns:minmax(110px,170px) 1fr 25px;gap:10px;align-items:center;color:#66788c;font-size:10px}.bar-row strong{text-align:right}.track{height:8px;border-radius:8px;background:#edf4f8;overflow:hidden}.fill{height:100%;border-radius:8px;background:#73c6ee}.note{margin-top:20px}.error{color:#a33;font-size:11px}`] })
export class AnalyticsPage {
  private readonly api = inject(SaasApiService);
  protected readonly formatBytes = formatBytes;
  protected readonly summary = signal<AnalyticsSummary | null>(null);
  protected readonly error = signal('');
  protected readonly chartGroups = signal<{ title: string; items: { name: string; count: number; width: number }[] }[]>([]);
  constructor() {
    this.api.analytics().subscribe({ next: value => this.summary.set(value), error: error => this.error.set(error?.error?.message || 'Could not load analytics.') });
    this.api.charts().subscribe({ next: value => this.chartGroups.set(Object.entries(value).map(([title, counts]) => {
      const max = Math.max(1, ...Object.values(counts));
      return { title: title.replace(/([A-Z])/g, ' $1'), items: Object.entries(counts).map(([name, count]) => ({ name, count, width: count / max * 100 })) };
    })) });
  }
}
