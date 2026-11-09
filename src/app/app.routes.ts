import { Routes } from '@angular/router';
import { AppShellComponent } from './layout/app-shell.component';
import { authGuard } from './core/services/auth.guard';
import { adminGuard } from './core/services/admin.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/auth.page').then(m => m.AuthPage), title: 'Sign in · ExtractIQ' },
  { path: 'register', loadComponent: () => import('./features/auth/auth.page').then(m => m.AuthPage), title: 'Create account · ExtractIQ' },
  {
    path: '', component: AppShellComponent, canActivate: [authGuard], children: [
      { path: '', loadComponent: () => import('./features/dashboard/dashboard.page').then(m => m.DashboardPage), title: 'Dashboard · ExtractIQ' },
      { path: 'documents', loadComponent: () => import('./features/documents/documents.page').then(m => m.DocumentsPage), title: 'Documents · ExtractIQ' },
      { path: 'documents/new', loadComponent: () => import('./features/upload/upload.page').then(m => m.UploadPage), title: 'Upload documents · ExtractIQ' },
      { path: 'documents/analyze', loadComponent: () => import('./features/analysis/analyze.page').then(m => m.AnalyzePage), title: 'Analyze a document · ExtractIQ' },
      { path: 'analysis/reports/:extractionId', loadComponent: () => import('./features/analysis/report.page').then(m => m.AnalysisReportPage), title: 'Analysis report · ExtractIQ' },
      { path: 'documents/:documentId', loadComponent: () => import('./features/documents/document-details.page').then(m => m.DocumentDetailsPage), title: 'Document details · ExtractIQ' },
      { path: 'jobs/:jobId', loadComponent: () => import('./features/jobs/job-details.page').then(m => m.JobDetailsPage), title: 'Processing job · ExtractIQ' },
      { path: 'extractions', loadComponent: () => import('./features/extractions/extractions.page').then(m => m.ExtractionsPage), title: 'Extraction review · ExtractIQ' },
      { path: 'data-explorer', loadComponent: () => import('./features/records/records.page').then(m => m.RecordsPage), title: 'Data Explorer · ExtractIQ' },
      { path: 'analytics', loadComponent: () => import('./features/analytics/analytics.page').then(m => m.AnalyticsPage), title: 'Analytics · ExtractIQ' },
      { path: 'exports', loadComponent: () => import('./features/exports/exports.page').then(m => m.ExportsPage), title: 'Exports · ExtractIQ' },
      { path: 'organization', loadComponent: () => import('./features/organization/organization.page').then(m => m.OrganizationPage), title: 'Organization · ExtractIQ' },
      { path: 'settings', loadComponent: () => import('./features/settings/settings.page').then(m => m.SettingsPage), title: 'Settings · ExtractIQ' },
      { path: 'admin/users', canActivate: [adminGuard], loadComponent: () => import('./features/admin/admin-users.page').then(m => m.AdminUsersPage), title: 'Users & access · ExtractIQ' },
    ],
  },
  { path: '**', redirectTo: '' },
];
