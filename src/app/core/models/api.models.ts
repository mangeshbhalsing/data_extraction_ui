export type DocumentStatus = 'UPLOAD_PENDING' | 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';

export interface DocumentRecord {
  id: string;
  uploadedBy?: string;
  uploadedByName?: string;
  uploadedByEmail?: string | null;
  filename: string;
  contentType: string;
  sizeBytes: number;
  status: DocumentStatus;
  failureReason?: string | null;
  failureCode?: string | null;
  failureJobId?: string | null;
  failureAttempt?: number | null;
  failedAt?: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface DocumentPage {
  content: DocumentRecord[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface CreateUploadSessionRequest {
  filename: string;
  contentType: string;
  sizeBytes: number;
}

export interface UploadSession {
  documentId: string;
  uploadUrl: string;
  expiresInSeconds: number;
}

export interface StartExtractionRequest {
  documentType: string;
  outputFormat: string;
}

export interface ExtractionJob {
  jobId: string;
  status: JobStatus;
  extractionId: string | null;
  progress: number;
  attempt: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  statusUrl: string;
}

export interface ApiError {
  timestamp?: string;
  status?: number;
  code?: string;
  message?: string;
  path?: string;
}

export interface ApiErrorResponse {
  message: string;
  status?: number;
  code?: string;
}
