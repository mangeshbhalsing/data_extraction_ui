export interface ExtractionResult {
  id: string; jobId: string; documentId: string; organizationId: string; documentType: string;
  outputFormat: string; data: Record<string, unknown>; reviewStatus: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  version: number; validationErrors: ValidationIssue[]; createdAt: string; updatedAt: string; approvedAt: string | null;
}
export interface ValidationIssue { fieldName: string; errorCode: string; message: string; }
export interface AnalyticsSummary { documentCount: number; jobCount: number; completedJobs: number; failedJobs: number; storageBytes: number; pendingReviewCount: number; approvedCount: number; }
export interface Page<T> { items: T[]; page: number; size: number; totalElements: number; totalPages: number; }
export interface Organization { organizationId: string; name: string; role: string; createdAt: string; }
export interface Member { userId: string; email: string; displayName: string; role: string; joinedAt: string; }
export interface ExportItem { exportId: string; status: string; filename: string; statusUrl: string; createdAt: string; }
export interface AuditEvent { eventId: string; userId: string; organizationId: string; action: string; resource: string; responseStatus: number; createdAt: string; }
