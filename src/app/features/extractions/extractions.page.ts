import { Component, inject, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExtractionResult } from '../../core/models/saas.models';
import { SaasApiService } from '../../core/services/saas-api.service';

@Component({ selector: 'app-extractions-page', imports: [RouterLink, JsonPipe], template: `
  <header class="page-head"><div><span class="eyebrow">REVIEW WORKSPACE</span><h1>Extraction review</h1><p>Review, validate, and approve actual extracted data.</p></div><button (click)="refresh()">Refresh</button></header>
  @if (error()) { <div class="error" role="alert">{{ error() }}</div> }
  @if (busy()) { <div class="panel">Loading extraction results…</div> }
  @else if (!items().length) { <div class="panel empty"><strong>No extraction results yet</strong><span>Upload a CSV file to run the available local extraction processor.</span><a routerLink="/documents/new">Upload a document</a></div> }
  @else { <div class="results">@for (item of items(); track item.id) {
    <article class="panel"><div class="row"><div><span class="eyebrow">{{ item.documentType }} · VERSION {{ item.version }}</span><h2>{{ item.id }}</h2><small>Document {{ item.documentId }}</small></div><span class="badge" [class.approved]="item.reviewStatus === 'APPROVED'">{{ item.reviewStatus.replace('_',' ') }}</span></div>
      <label class="data-editor">Extracted data (JSON)<textarea #draft [value]="item.data | json" [disabled]="item.reviewStatus === 'APPROVED'" spellcheck="false"></textarea></label>
      @if (item.validationErrors.length) { <div class="issues">@for (issue of item.validationErrors; track issue.errorCode) { <div>{{ issue.fieldName }}: {{ issue.message }}</div> }</div> }
      <div class="actions"><button class="secondary" (click)="save(item, draft.value)" [disabled]="item.reviewStatus === 'APPROVED'">Save corrections</button><button class="secondary" (click)="validate(item)">Validate</button><button (click)="approve(item)" [disabled]="item.reviewStatus === 'APPROVED' || item.validationErrors.length > 0">Approve</button></div>
    </article>
  }</div> }
  `, styles: [`:host{display:block}.page-head,.row,.actions{display:flex;align-items:center;justify-content:space-between;gap:12px}.page-head{margin-bottom:20px}.eyebrow{color:#4385a8;font-size:9px;font-weight:800;letter-spacing:1.2px}.page-head h1{margin:7px 0;font-size:22px}.page-head p,small{color:#758397;font-size:11px}.panel{padding:18px;border:1px solid var(--color-border);border-radius:12px;background:#fff;box-shadow:var(--shadow-card)}.empty{display:grid;gap:9px;color:#58687d;font-size:12px}.empty a{color:#287ea9}.results{display:grid;gap:14px}.row h2{max-width:480px;overflow:hidden;text-overflow:ellipsis;font-size:12px}.badge{padding:6px 9px;border-radius:99px;background:#fff4d9;color:#93690f;font-size:9px}.badge.approved{background:#e6f7ee;color:#267748}.data-editor{display:grid;gap:7px;color:#66788c;font-size:10px}.data-editor textarea{min-height:150px;max-height:360px;padding:12px;border:1px solid #dce4ec;border-radius:8px;background:#f8fafc;color:#304257;font:10px/1.5 monospace}.issues{display:grid;gap:5px;color:#9f3131;font-size:10px}.actions{justify-content:flex-end;margin-top:14px;flex-wrap:wrap}button{border:0;border-radius:7px;padding:9px 13px;background:#2381b1;color:#fff;font-size:10px;cursor:pointer}.secondary{border:1px solid #dbe3eb;background:#fff;color:#405168}button:disabled{opacity:.5}.error{margin-bottom:12px;color:#a33;font-size:11px}`] })
export class ExtractionsPage {
  private readonly api = inject(SaasApiService);
  protected readonly items = signal<ExtractionResult[]>([]);
  protected readonly busy = signal(true);
  protected readonly error = signal('');
  constructor() { this.refresh(); }
  protected refresh(): void { this.busy.set(true); this.api.listExtractions().subscribe({ next: v => { this.items.set(v); this.busy.set(false); }, error: e => { this.error.set(e?.error?.message || 'Could not load extraction results.'); this.busy.set(false); } }); }
  protected validate(item: ExtractionResult): void { this.api.validateExtraction(item.id).subscribe({ next: v => this.replace(v), error: e => this.error.set(e?.error?.message || 'Validation failed.') }); }
  protected approve(item: ExtractionResult): void { this.api.approveExtraction(item.id).subscribe({ next: v => this.replace(v), error: e => this.error.set(e?.error?.message || 'Approval failed.') }); }
  protected save(item: ExtractionResult, value: string): void {
    try {
      const data = JSON.parse(value);
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Enter a JSON object.');
      this.api.correctExtraction(item.id, data as Record<string, unknown>).subscribe({ next: v => this.replace(v), error: e => this.error.set(e?.error?.message || 'Could not save corrections.') });
    } catch (error) { this.error.set(error instanceof Error ? error.message : 'Enter valid JSON.'); }
  }
  private replace(item: ExtractionResult): void { this.items.update(items => items.map(value => value.id === item.id ? item : value)); }
}
