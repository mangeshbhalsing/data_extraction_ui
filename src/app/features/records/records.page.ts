import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SaasApiService } from '../../core/services/saas-api.service';

@Component({ selector: 'app-records-page', imports: [FormsModule], template: `
  <header class="head"><div><span class="eyebrow">APPROVED STRUCTURED DATA</span><h1>Data Explorer</h1><p>Search records from approved extractions in your workspace.</p></div></header>
  <div class="toolbar"><input [(ngModel)]="query" (keyup.enter)="search()" placeholder="Search approved records…" aria-label="Search records"><button (click)="search()">Search</button></div>
  @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
  @if (busy()) { <section class="panel">Loading records…</section> }
  @else if (!records().length) { <section class="panel empty">No approved records match this search.</section> }
  @else { <section class="panel table-wrap"><table><thead><tr>@for (key of keys(); track key) { <th>{{ key }}</th> }</tr></thead><tbody>@for (row of records(); track $index) { <tr>@for (key of keys(); track key) { <td>{{ row[key] }}</td> }</tr> }</tbody></table></section> }
  `, styles: [`:host{display:block}.head h1{margin:7px 0;font-size:22px}.head p{color:#758397;font-size:11px}.eyebrow{color:#4385a8;font-size:9px;font-weight:800;letter-spacing:1.2px}.toolbar{display:flex;gap:8px;margin:18px 0}.toolbar input{flex:1;min-width:0;padding:10px 12px;border:1px solid #dce4ec;border-radius:8px}.toolbar button{border:0;border-radius:8px;padding:0 18px;background:#2381b1;color:white}.panel{padding:16px;border:1px solid var(--color-border);border-radius:12px;background:#fff;overflow:auto}.empty{color:#758397;font-size:11px}table{width:100%;border-collapse:collapse;font-size:10px}th,td{text-align:left;padding:10px;border-bottom:1px solid #edf0f4}th{color:#6d7d91}.error{color:#a33;font-size:11px}`] })
export class RecordsPage {
  private readonly api = inject(SaasApiService);
  protected query = '';
  protected readonly records = signal<Record<string, unknown>[]>([]);
  protected readonly keys = signal<string[]>([]);
  protected readonly error = signal('');
  protected readonly busy = signal(true);
  constructor() { this.search(); }
  protected search(): void { this.busy.set(true); this.api.searchRecords(this.query).subscribe({ next: page => { this.records.set(page.items); this.keys.set([...new Set(page.items.flatMap(row => Object.keys(row)))]); this.busy.set(false); }, error: e => { this.error.set(e?.error?.message || 'Could not load records.'); this.busy.set(false); } }); }
}
