import { HttpClient, HttpEvent, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateUploadSessionRequest,
  DocumentRecord,
  DocumentPage,
  ExtractionJob,
  StartExtractionRequest,
  UploadSession,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class DocumentApiService {
  private readonly http = inject(HttpClient);
  private readonly apiRoot = `${environment.apiBaseUrl}/v1`;
  private readonly documentsUrl = `${this.apiRoot}/documents`;

  listDocuments(filters: { page?: number; filename?: string; status?: string; fromDate?: string; toDate?: string; sortBy?: string; direction?: string } = {}): Observable<DocumentPage> {
    const params: Record<string, string> = { page: String(filters.page ?? 0), sortBy: filters.sortBy ?? 'date', direction: filters.direction ?? 'desc' };
    if (filters.filename) params['filename'] = filters.filename;
    if (filters.status && filters.status !== 'ALL') params['status'] = filters.status;
    if (filters.fromDate) params['fromDate'] = filters.fromDate;
    if (filters.toDate) params['toDate'] = filters.toDate;
    return this.http.get<DocumentPage>(this.documentsUrl, { params });
  }

  getDocument(documentId: string): Observable<DocumentRecord> {
    return this.http.get<DocumentRecord>(`${this.documentsUrl}/${encodeURIComponent(documentId)}`);
  }

  createUploadSession(request: CreateUploadSessionRequest): Observable<UploadSession> {
    return this.http.post<UploadSession>(this.documentsUrl, request);
  }

  uploadFile(session: UploadSession, file: File, contentType: string): Observable<HttpEvent<DocumentRecord>> {
    const targetUrl = this.resolveUploadUrl(session.uploadUrl);
    return this.http.put<DocumentRecord>(targetUrl, file, {
      headers: { 'Content-Type': contentType },
      observe: 'events',
      reportProgress: true,
      withCredentials: false,
    });
  }

  confirmUpload(documentId: string): Observable<DocumentRecord> {
    return this.http.post<DocumentRecord>(`${this.documentsUrl}/${encodeURIComponent(documentId)}/confirm-upload`, {});
  }

  startExtraction(documentId: string, request: StartExtractionRequest, idempotencyKey: string): Observable<ExtractionJob> {
    return this.http.post<ExtractionJob>(
      `${this.documentsUrl}/${encodeURIComponent(documentId)}/extractions`,
      request,
      { headers: { 'Idempotency-Key': idempotencyKey } },
    );
  }

  getJob(jobId: string): Observable<ExtractionJob> {
    return this.http.get<ExtractionJob>(`${this.apiRoot}/jobs/${encodeURIComponent(jobId)}`);
  }

  retryJob(jobId: string): Observable<ExtractionJob> {
    return this.http.post<ExtractionJob>(`${this.apiRoot}/jobs/${encodeURIComponent(jobId)}/retry`, {});
  }

  deleteDocument(documentId: string): Observable<void> {
    return this.http.delete<void>(`${this.documentsUrl}/${encodeURIComponent(documentId)}`);
  }

  private resolveUploadUrl(uploadUrl: string): string {
    const apiOrigin = new URL(environment.apiBaseUrl, window.location.origin);
    const resolved = new URL(uploadUrl, apiOrigin.origin);
    const isLocalHttp = resolved.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(resolved.hostname);

    if ((resolved.protocol !== 'https:' && !isLocalHttp) || resolved.username || resolved.password) {
      throw new Error('The upload URL is not a safe HTTP or HTTPS destination.');
    }

    return resolved.toString();
  }
}

export function isHttpResponse<T>(event: HttpEvent<T>): event is HttpResponse<T> {
  return event instanceof HttpResponse;
}
