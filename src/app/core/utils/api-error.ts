import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorResponse } from '../models/api.models';

export function toApiError(error: unknown): ApiErrorResponse {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { message?: string; code?: string } | null;
    return {
      message: body?.message || (error.status === 0
        ? 'The API could not be reached. Check that Spring Boot is running on port 8080.'
        : `The request failed with status ${error.status}.`),
      status: error.status,
      code: body?.code,
    };
  }

  return { message: error instanceof Error ? error.message : 'Something went wrong.' };
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
