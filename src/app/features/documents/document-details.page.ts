import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DocumentRecord } from '../../core/models/api.models';
import { DocumentApiService } from '../../core/services/document-api.service';
import { formatBytes, toApiError } from '../../core/utils/api-error';

@Component({
  selector: 'app-document-details-page', imports: [DatePipe, RouterLink],
  templateUrl: './document-details.page.html', styleUrl: './document-details.page.css',
})
export class DocumentDetailsPage {
  private readonly api = inject(DocumentApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly documentId = inject(ActivatedRoute).snapshot.paramMap.get('documentId') ?? '';
  protected readonly document = signal<DocumentRecord | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly startingJob = signal(false);
  protected readonly jobError = signal('');
  protected readonly formatBytes = formatBytes;

  constructor() {
    this.api.getDocument(this.documentId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: document => { this.document.set(document); this.loading.set(false); },
      error: error => { this.error.set(toApiError(error).message); this.loading.set(false); },
    });
  }

  protected startExtraction(document: DocumentRecord): void {
    this.startingJob.set(true);
    this.jobError.set('');
    this.api.startExtraction(document.id, { documentType: 'INVOICE', outputFormat: 'STRUCTURED_JSON' }, crypto.randomUUID())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: job => { void this.router.navigate(['/jobs', job.jobId]); },
        error: error => { this.jobError.set(toApiError(error).message); this.startingJob.set(false); },
      });
  }
}
