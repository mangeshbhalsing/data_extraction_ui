import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { DocumentRecord, DocumentStatus } from '../../core/models/api.models';
import { AuthService } from '../../core/services/auth.service';
import { DocumentApiService } from '../../core/services/document-api.service';
import { formatBytes, toApiError } from '../../core/utils/api-error';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-documents-page',
  imports: [DatePipe, RouterLink],
  templateUrl: './documents.page.html',
  styleUrl: './documents.page.css',
})
export class DocumentsPage {
  private readonly api = inject(DocumentApiService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly isAdmin = () => ['ADMIN', 'SUPER_ADMIN'].includes(this.auth.user()?.role ?? '');
  protected readonly documents = signal<DocumentRecord[]>([]);
  protected readonly totalElements = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly page = signal(0);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly search = signal('');
  protected readonly statusFilter = signal<'ALL' | DocumentStatus>('ALL');
  protected readonly fromDate = signal('');
  protected readonly toDate = signal('');
  protected readonly sortOption = signal('date-desc');
  private readonly searchTerms = new Subject<string>();
  protected readonly formatBytes = formatBytes;

  protected failureTooltip(document: DocumentRecord): string {
    const details = [
      document.failureCode ? `Error code: ${document.failureCode}` : null,
      `Reason: ${document.failureReason || 'No failure details were recorded for this document.'}`,
      document.failureAttempt ? `Attempt: ${document.failureAttempt}` : null,
      document.failedAt ? `Recorded: ${new Date(document.failedAt).toLocaleString()}` : null,
      document.failureJobId ? `Job ID: ${document.failureJobId}` : null,
    ].filter((line): line is string => !!line);
    return details.join('\n');
  }

  constructor() {
    this.searchTerms.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.page.set(0); this.refresh();
    });
    this.refresh();
  }

  protected setSearch(event: Event): void { this.search.set((event.target as HTMLInputElement).value); this.searchTerms.next(this.search()); }
  protected setStatus(event: Event): void { this.statusFilter.set((event.target as HTMLSelectElement).value as 'ALL' | DocumentStatus); this.applyFilters(); }
  protected setFromDate(event: Event): void { this.fromDate.set((event.target as HTMLInputElement).value); this.applyFilters(); }
  protected setToDate(event: Event): void { this.toDate.set((event.target as HTMLInputElement).value); this.applyFilters(); }
  protected setSort(event: Event): void { this.sortOption.set((event.target as HTMLSelectElement).value); this.page.set(0); this.refresh(); }
  protected applyFilters(): void { this.page.set(0); this.refresh(); }
  protected previousPage(): void { if (this.page() > 0) { this.page.update(value => value - 1); this.refresh(); } }
  protected nextPage(): void { if (this.page() + 1 < this.totalPages()) { this.page.update(value => value + 1); this.refresh(); } }

  protected refresh(): void {
    this.loading.set(true);
    this.error.set('');
    const [sortBy, direction] = this.sortOption().split('-');
    this.api.listDocuments({ page: this.page(), filename: this.search().trim(), status: this.statusFilter(), fromDate: this.fromDate(), toDate: this.toDate(), sortBy, direction }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => { this.documents.set(result.content); this.totalElements.set(result.totalElements); this.totalPages.set(result.totalPages); this.page.set(result.page); this.loading.set(false); },
      error: error => { this.error.set(toApiError(error).message); this.loading.set(false); },
    });
  }

  protected deleteDocument(document: DocumentRecord): void {
    if (!window.confirm(`Delete “${document.filename}”? This removes the uploaded file from the current API process.`)) return;
    this.api.deleteDocument(document.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.documents.update(items => items.filter(item => item.id !== document.id)); this.totalElements.update(value => Math.max(0, value - 1)); if (!this.documents().length && this.page() > 0) this.previousPage(); else this.refresh(); },
      error: error => this.error.set(toApiError(error).message),
    });
  }
}
