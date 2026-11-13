import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { DocumentApiService } from '../../core/services/document-api.service';
import { DocumentRecord } from '../../core/models/api.models';
import { formatBytes, toApiError } from '../../core/utils/api-error';

@Component({
  selector: 'app-dashboard-page',
  imports: [DatePipe, RouterLink],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css',
})
export class DashboardPage {
  private readonly api = inject(DocumentApiService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly documents = signal<DocumentRecord[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly uploadedCount = computed(() => this.documents().filter(item => ['UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED'].includes(item.status)).length);
  protected readonly pendingCount = computed(() => this.documents().filter(item => item.status === 'UPLOAD_PENDING').length);
  protected readonly completedCount = computed(() => this.documents().filter(item => item.status === 'COMPLETED').length);
  protected readonly recentDocuments = computed(() => this.documents().slice(0, 6));
  protected readonly formatBytes = formatBytes;

  constructor() { this.refresh(); }

  protected refresh(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.listDocuments().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => { this.documents.set(result.content); this.loading.set(false); },
      error: error => { this.error.set(toApiError(error).message); this.loading.set(false); },
    });
  }
}
