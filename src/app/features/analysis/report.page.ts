import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SaasApiService } from '../../core/services/saas-api.service';
import { ExtractionResult } from '../../core/models/saas.models';
import { toApiError } from '../../core/utils/api-error';

interface ReportTable { name: string; columns: string[]; records: Record<string, unknown>[]; recordCount: number; }
interface ReportChart { title: string; type: string; seriesLabel: string; labels: string[]; values: number[]; }

@Component({selector:'app-analysis-report-page',imports:[RouterLink],templateUrl:'./report.page.html',styleUrl:'./report.page.css'})
export class AnalysisReportPage {
  private readonly api = inject(SaasApiService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('extractionId') ?? '';
  protected readonly result = signal<ExtractionResult | null>(null);
  protected readonly tables = signal<ReportTable[]>([]);
  protected readonly charts = signal<ReportChart[]>([]);
  protected readonly summary = signal('');
  protected readonly error = signal('');
  protected readonly loading = signal(true);
  constructor() {
    this.api.getExtraction(this.id).subscribe({next: result => {
      this.result.set(result);
      this.summary.set(String(result.data['summary'] ?? 'No summary was generated.'));
      this.tables.set(this.asTables(result.data['tables']));
      this.charts.set(this.asCharts(result.data['charts']));
      this.loading.set(false);
    }, error: cause => { this.error.set(toApiError(cause).message); this.loading.set(false); }});
  }
  protected chartWidth(chart: ReportChart, value: number): number {
    const maximum = Math.max(1, ...chart.values.map(Math.abs));
    return Math.max(2, Math.round(Math.abs(value) / maximum * 100));
  }
  protected display(value: unknown): string { return value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value); }
  private asTables(value: unknown): ReportTable[] {
    if (!Array.isArray(value)) return [];
    return value.flatMap(item => {
      if (!item || typeof item !== 'object') return [];
      const row = item as Record<string, unknown>;
      const columns = Array.isArray(row['columns']) ? row['columns'].map(String) : [];
      const records = Array.isArray(row['records']) ? row['records'].filter(v => v && typeof v === 'object') as Record<string, unknown>[] : [];
      return [{ name: String(row['name'] ?? 'Data'), columns, records, recordCount: Number(row['recordCount'] ?? records.length) }];
    });
  }
  private asCharts(value: unknown): ReportChart[] {
    if (!Array.isArray(value)) return [];
    return value.flatMap(item => {
      if (!item || typeof item !== 'object') return [];
      const row = item as Record<string, unknown>;
      if (!Array.isArray(row['labels']) || !Array.isArray(row['values'])) return [];
      return [{ title: String(row['title'] ?? 'Data chart'), type: String(row['type'] ?? 'bar'),
        seriesLabel: String(row['seriesLabel'] ?? 'Value'), labels: row['labels'].map(String),
        values: row['values'].map(Number).filter(Number.isFinite) }];
    });
  }
}
