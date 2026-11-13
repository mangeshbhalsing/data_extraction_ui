import { Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { filter, map, switchMap, tap } from 'rxjs';
import { DocumentApiService, isHttpResponse } from '../../core/services/document-api.service';
import { ApiErrorResponse } from '../../core/models/api.models';
import { toApiError, formatBytes } from '../../core/utils/api-error';

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const CONTENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  csv: 'text/csv',
};

type UploadPhase = 'idle' | 'creating-session' | 'uploading' | 'confirming-upload' | 'creating-job' | 'error';

@Component({
  selector: 'app-upload-page', imports: [RouterLink],
  templateUrl: './upload.page.html', styleUrl: './upload.page.css',
})
export class UploadPage {
  private readonly api = inject(DocumentApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly phase = signal<UploadPhase>('idle');
  protected readonly progress = signal<number | null>(null);
  protected readonly error = signal<ApiErrorResponse | null>(null);
  protected readonly isDragging = signal(false);
  protected readonly formatBytes = formatBytes;
  protected readonly busy = () => ['creating-session', 'uploading', 'creating-job'].includes(this.phase());

  protected onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.setFile(input.files?.item(0) ?? null);
    input.value = '';
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    this.setFile(event.dataTransfer?.files.item(0) ?? null);
  }

  protected onDragOver(event: DragEvent): void { event.preventDefault(); this.isDragging.set(true); }
  protected onDragLeave(): void { this.isDragging.set(false); }

  protected clearFile(): void {
    if (this.busy()) return;
    this.selectedFile.set(null);
    this.error.set(null);
    this.phase.set('idle');
    this.progress.set(null);
  }

  protected startUpload(): void {
    const file = this.selectedFile();
    if (!file || this.busy()) return;
    const contentType = this.contentTypeFor(file);
    if (!contentType) {
      this.failLocally('Unsupported file type', 'Choose a PDF, JPG, PNG, or CSV file.');
      return;
    }

    this.phase.set('creating-session');
    this.error.set(null);
    this.progress.set(null);
    this.api.createUploadSession({ filename: file.name, contentType, sizeBytes: file.size }).pipe(
      switchMap(session => {
        this.phase.set('uploading');
        return this.api.uploadFile(session, file, contentType).pipe(
          tap(event => {
            if (event.type === HttpEventType.UploadProgress && event.total) {
              this.progress.set(Math.round((event.loaded / event.total) * 100));
            }
          }),
          filter(isHttpResponse),
          map(() => session),
        );
      }),
      switchMap(session => {
        this.phase.set('confirming-upload');
        return this.api.confirmUpload(session.documentId).pipe(map(() => session));
      }),
      switchMap(session => {
        this.phase.set('creating-job');
        return this.api.startExtraction(session.documentId,
          { documentType: contentType === 'text/csv' ? 'TABLE' : 'INVOICE', outputFormat: 'STRUCTURED_JSON' }, crypto.randomUUID());
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: job => { void this.router.navigate(['/jobs', job.jobId]); },
      error: error => { this.error.set(toApiError(error)); this.phase.set('error'); },
    });
  }

  protected phaseLabel(): string {
    switch (this.phase()) {
      case 'creating-session': return 'Preparing secure upload…';
      case 'uploading': return this.progress() === null ? 'Uploading document…' : `Uploading ${this.progress()}%`;
      case 'confirming-upload': return 'Confirming upload…';
      case 'creating-job': return 'Submitting extraction request…';
      default: return 'Upload and request extraction';
    }
  }

  private setFile(file: File | null): void {
    if (!file || this.busy()) return;
    this.error.set(null);
    const type = this.contentTypeFor(file);
    if (!type) {
      this.selectedFile.set(null);
      this.failLocally('Unsupported file type', 'The API currently accepts PDF, JPEG, PNG, and CSV files.');
      return;
    }
    if (file.size === 0) {
      this.selectedFile.set(null);
      this.failLocally('This file is empty', 'Choose a non-empty file to continue.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      this.selectedFile.set(null);
      this.failLocally('File exceeds the 20 MB limit', 'Choose a smaller file and try again.');
      return;
    }
    if (file.type && file.type !== type) {
      this.selectedFile.set(null);
      this.failLocally('File type does not match its extension', 'Choose a valid file with a supported format.');
      return;
    }
    this.selectedFile.set(file);
    this.phase.set('idle');
  }

  private contentTypeFor(file: File): string | null {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    return CONTENT_TYPES[extension] ?? null;
  }

  private failLocally(message: string, detail: string): void {
    this.error.set({ message: `${message}. ${detail}` });
    this.phase.set('error');
  }
}
