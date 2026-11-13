import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { interval, startWith, switchMap, takeWhile } from 'rxjs';
import { ExtractionJob, JobStatus } from '../../core/models/api.models';
import { DocumentApiService } from '../../core/services/document-api.service';
import { toApiError } from '../../core/utils/api-error';

const ACTIVE_STATUSES: JobStatus[] = ['QUEUED', 'PROCESSING'];

@Component({
  selector: 'app-job-details-page', imports: [DatePipe, RouterLink],
  templateUrl: './job-details.page.html', styleUrl: './job-details.page.css',
})
export class JobDetailsPage {
  private readonly api = inject(DocumentApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly jobId = inject(ActivatedRoute).snapshot.paramMap.get('jobId') ?? '';
  protected readonly job = signal<ExtractionJob | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly lastUpdated = signal<Date | null>(null);
  protected readonly ACTIVE_POLLING_LABEL = 'Every 5 seconds while active';
  protected readonly retrying = signal(false);

  constructor() {
    interval(5000).pipe(
      startWith(0),
      switchMap(() => this.api.getJob(this.jobId)),
      takeWhile(job => ACTIVE_STATUSES.includes(job.status), true),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: job => { this.job.set(job); this.lastUpdated.set(new Date()); this.loading.set(false); this.error.set(''); },
      error: error => { this.error.set(toApiError(error).message); this.loading.set(false); },
    });
  }

  protected statusLabel(status: JobStatus): string {
    return status.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, character => character.toUpperCase());
  }

  protected retry(): void {
    this.retrying.set(true);
    this.api.retryJob(this.jobId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: job => { this.job.set(job); this.retrying.set(false); this.error.set(''); },
      error: error => { this.error.set(toApiError(error).message); this.retrying.set(false); },
    });
  }
}
