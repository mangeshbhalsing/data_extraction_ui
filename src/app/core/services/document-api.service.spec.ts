import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DocumentApiService } from './document-api.service';

describe('DocumentApiService', () => {
  let service: DocumentApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(DocumentApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads documents from the implemented backend endpoint', () => {
    let result: unknown;
    service.listDocuments().subscribe(value => result = value);

    const request = http.expectOne(request => request.url === '/api/v1/documents' && request.params.get('page') === '0');
    expect(request.request.method).toBe('GET');
    const page = { content: [], totalElements: 0, totalPages: 0, page: 0, size: 50 };
    request.flush(page);
    expect(result).toEqual(page);
  });

  it('creates an upload session with the backend request shape', () => {
    const body = { filename: 'invoice.pdf', contentType: 'application/pdf', sizeBytes: 5 };
    service.createUploadSession(body).subscribe();

    const request = http.expectOne('/api/v1/documents');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    request.flush({ documentId: 'doc-1', uploadUrl: '/api/v1/documents/doc-1/content', expiresInSeconds: 300 });
  });

  it('uploads bytes without credentialed cross-origin requests', () => {
    const file = new File(['%PDF-'], 'invoice.pdf', { type: 'application/pdf' });
    service.uploadFile({ documentId: 'doc-1', uploadUrl: '/api/v1/documents/doc-1/content', expiresInSeconds: 300 }, file, 'application/pdf').subscribe();

    const request = http.expectOne('http://localhost:3000/api/v1/documents/doc-1/content');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toBe(file);
    expect(request.request.headers.get('Content-Type')).toBe('application/pdf');
    expect(request.request.withCredentials).toBe(false);
    request.flush({ id: 'doc-1', filename: 'invoice.pdf', contentType: 'application/pdf', sizeBytes: 5, status: 'UPLOADED', createdAt: '', expiresAt: '' });
  });

  it('sends an idempotency key when starting an extraction job', () => {
    service.startExtraction('doc-1', { documentType: 'INVOICE', outputFormat: 'STRUCTURED_JSON' }, 'request-1').subscribe();

    const request = http.expectOne('/api/v1/documents/doc-1/extractions');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Idempotency-Key')).toBe('request-1');
    expect(request.request.body).toEqual({ documentType: 'INVOICE', outputFormat: 'STRUCTURED_JSON' });
    request.flush({ jobId: 'job-1', status: 'QUEUED', extractionId: null, progress: 0, statusUrl: '/api/v1/jobs/job-1' });
  });

  it('rejects an insecure non-local upload destination', () => {
    const file = new File(['sample'], 'sample.pdf', { type: 'application/pdf' });
    expect(() => service.uploadFile({ documentId: 'doc-1', uploadUrl: 'http://files.example.test/upload', expiresInSeconds: 300 }, file, 'application/pdf'))
      .toThrow('The upload URL is not a safe HTTP or HTTPS destination.');
  });
});
