import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardPage } from './dashboard.page';

describe('DashboardPage', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('shows document metrics from the backend response without invented counts', () => {
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();
    http.expectOne('/api/v1/documents').flush([
      { id: 'doc-1', filename: 'invoice-1.pdf', contentType: 'application/pdf', sizeBytes: 100, status: 'UPLOADED', createdAt: '2026-10-25T08:00:00Z', expiresAt: '2026-10-25T09:00:00Z' },
      { id: 'doc-2', filename: 'invoice-2.pdf', contentType: 'application/pdf', sizeBytes: 200, status: 'UPLOAD_PENDING', createdAt: '2026-10-25T08:00:00Z', expiresAt: '2026-10-25T09:00:00Z' },
    ]);
    fixture.detectChanges();

    const metrics = fixture.nativeElement.querySelectorAll('.metric-value') as NodeListOf<HTMLElement>;
    expect(metrics[0].textContent?.trim()).toBe('2');
    expect(metrics[1].textContent?.trim()).toBe('1');
    expect(metrics[2].textContent?.trim()).toBe('1');
    expect(metrics[3].textContent?.trim()).toBe('0');
  });

  it('shows a backend error state instead of sample records', () => {
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();
    http.expectOne('/api/v1/documents').flush({ status: 500, message: 'Unavailable' }, { status: 500, statusText: 'Server error' });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Try again');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('invoice-1.pdf');
  });
});
