import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditEvent, ExportItem, AnalyticsSummary, ExtractionResult, Member, Organization, Page } from '../models/saas.models';

@Injectable({ providedIn: 'root' })
export class SaasApiService {
  private readonly http = inject(HttpClient);
  private readonly root = `${environment.apiBaseUrl}/v1`;
  listExtractions(): Observable<ExtractionResult[]> { return this.http.get<ExtractionResult[]>(`${this.root}/extractions`); }
  getExtraction(id: string): Observable<ExtractionResult> { return this.http.get<ExtractionResult>(`${this.root}/extractions/${encodeURIComponent(id)}/results`); }
  correctExtraction(id: string, changes: Record<string, unknown>): Observable<ExtractionResult> { return this.http.patch<ExtractionResult>(`${this.root}/extractions/${encodeURIComponent(id)}/results`, changes); }
  validateExtraction(id: string): Observable<ExtractionResult> { return this.http.post<ExtractionResult>(`${this.root}/extractions/${encodeURIComponent(id)}/validate`, {}); }
  approveExtraction(id: string): Observable<ExtractionResult> { return this.http.post<ExtractionResult>(`${this.root}/extractions/${encodeURIComponent(id)}/approve`, {}); }
  searchRecords(q: string): Observable<Page<Record<string, unknown>>> {
    const params = q ? new HttpParams().set('q', q) : new HttpParams();
    return this.http.get<Page<Record<string, unknown>>>(`${this.root}/records`, { params });
  }
  analytics(): Observable<AnalyticsSummary> { return this.http.get<AnalyticsSummary>(`${this.root}/analytics/summary`); }
  charts(): Observable<Record<string, Record<string, number>>> { return this.http.get<Record<string, Record<string, number>>>(`${this.root}/analytics/charts`); }
  organization(): Observable<Organization> { return this.http.get<Organization>(`${this.root}/organization`); }
  members(): Observable<Member[]> { return this.http.get<Member[]>(`${this.root}/organization/members`); }
  usage(): Observable<Record<string, string | number>> { return this.http.get<Record<string, string | number>>(`${this.root}/usage`); }
  audit(): Observable<AuditEvent[]> { return this.http.get<AuditEvent[]>(`${this.root}/audit`); }
  exports(): Observable<ExportItem[]> { return this.http.get<ExportItem[]>(`${this.root}/exports`); }
  createExport(): Observable<ExportItem> { return this.http.post<ExportItem>(`${this.root}/exports`, { format: 'CSV' }); }
  downloadExport(id: string): Observable<Blob> { return this.http.get(`${this.root}/exports/${encodeURIComponent(id)}/download`, { responseType: 'blob' }); }
}
