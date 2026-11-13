import { Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, Router } from '@angular/router';
import { filter, map, switchMap, tap } from 'rxjs';
import { ApiErrorResponse } from '../../core/models/api.models';
import { DocumentApiService, isHttpResponse } from '../../core/services/document-api.service';
import { formatBytes, toApiError } from '../../core/utils/api-error';

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const TYPES: Record<string, string> = {
  pdf: 'application/pdf', doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', csv: 'text/csv',
};
type Phase = 'idle' | 'session' | 'upload' | 'confirm' | 'analyze' | 'error';

@Component({
  selector: 'app-analyze-page', imports: [RouterLink],
  templateUrl: './analyze.page.html', styleUrl: './analyze.page.css',
})
export class AnalyzePage {
  private readonly api = inject(DocumentApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly file = signal<File | null>(null);
  protected readonly phase = signal<Phase>('idle');
  protected readonly progress = signal<number | null>(null);
  protected readonly error = signal<ApiErrorResponse | null>(null);
  protected readonly busy = () => ['session', 'upload', 'confirm', 'analyze'].includes(this.phase());
  protected readonly formatBytes = formatBytes;
  protected readonly contentType = (file: File) => TYPES[file.name.split('.').pop()?.toLowerCase() ?? ''] ?? '';

  protected select(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) ?? null;
    input.value = '';
    if (!file) return;
    if (!this.contentType(file)) return this.fail('Unsupported file', 'Choose a PDF, DOC, DOCX, XLS, XLSX, or CSV document.');
    if (!file.size || file.size > MAX_FILE_BYTES) return this.fail('Invalid file size', 'Choose a non-empty file no larger than 20 MiB.');
    if (file.type && file.type !== this.contentType(file)) return this.fail('File type mismatch', 'The selected file type does not match its extension.');
    this.error.set(null); this.phase.set('idle'); this.file.set(file);
  }

  protected analyze(): void {
    const file = this.file();
    if (!file || this.busy()) return;
    const type = this.contentType(file);
    this.error.set(null); this.phase.set('session');
    this.api.createUploadSession({ filename: file.name, contentType: type, sizeBytes: file.size }).pipe(
      switchMap(session => {
        this.phase.set('upload');
        return this.api.uploadFile(session, file, type).pipe(
          tap(event => { if (event.type === HttpEventType.UploadProgress && event.total) this.progress.set(Math.round(event.loaded / event.total * 100)); }),
          filter(isHttpResponse), map(() => session),
        );
      }),
      switchMap(session => { this.phase.set('confirm'); return this.api.confirmUpload(session.documentId).pipe(map(() => session)); }),
      switchMap(session => {
        this.phase.set('analyze');
        return this.api.startExtraction(session.documentId, { documentType: 'DOCUMENT_ANALYSIS', outputFormat: 'ANALYSIS_REPORT' }, crypto.randomUUID());
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: job => { void this.router.navigate(['/jobs', job.jobId]); },
      error: cause => { this.error.set(toApiError(cause)); this.phase.set('error'); },
    });
  }

  protected clear(): void { if (!this.busy()) { this.file.set(null); this.error.set(null); this.progress.set(null); this.phase.set('idle'); } }
  protected status(): string {
    return ({ session: 'Preparing secure upload…', upload: `Uploading${this.progress() === null ? '' : ` ${this.progress()}%`}…`,
      confirm: 'Confirming upload…', analyze: 'Starting analysis…' } as Record<string, string>)[this.phase()] ?? 'Analyze document';
  }
  private fail(message: string, detail: string): void {
    this.file.set(null); this.error.set({ message: `${message}. ${detail}` }); this.phase.set('error');
  }
}
