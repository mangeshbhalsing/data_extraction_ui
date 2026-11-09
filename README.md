# ExtractIQ — Angular frontend

Separate Angular frontend for the AI Data Extraction SaaS Spring Boot API. It uses standalone Angular 22 components, strict TypeScript, lazy-loaded routes, signals for UI state, and a custom responsive design system. The signature color is `#97D7FF`.

## Run locally in VS Code

Requirements: Node.js 24.15+ (this workspace has Node 24.22.1) and npm. Angular 22's official compatibility table lists Node `^22.22.3 || ^24.15.0 || ^26.0.0`, TypeScript `>=6.0.0 <6.1.0`, and RxJS 6.5.3 or 7.4.0. The project uses Angular framework 22.2.3, CLI/build 22.2.4, and TypeScript 6.0.x.

A local Node distribution with npm is available at `C:\Mangesh\software\node-v24.22.1-win-x64`. From a VS Code PowerShell terminal:

```powershell
$env:PATH = "C:\Mangesh\software\node-v24.22.1-win-x64;$env:PATH"
npm install
npm start
```

Open `http://localhost:4200`. Start Spring Boot separately on port 8080 with `APP_SEED_DEMO_USERS=true` for the local demo accounts. The Angular development server proxies `/api/**` to `http://localhost:8080` through `proxy.conf.json`, avoiding a development CORS configuration.

### Local demo login

Enable `APP_SEED_DEMO_USERS=true` in the backend run configuration, then use one of these local-only accounts:

| Role | Email | Password |
| --- | --- | --- |
| Super Admin | `superadmin@extractiq.local` | `SuperAdmin@ChangeMe123!` |
| Admin | `admin@extractiq.local` | `Admin@ChangeMe123!` |
| User | `user@extractiq.local` | `User@ChangeMe123!` |

These credentials are for local development only. Change or remove them before deploying the application.

Build and test:

```powershell
npm run build
npm test
```

## Implemented screens

- Dashboard: real document counts and completed extraction counts from the backend.
- Documents: list, filename search, upload-status filter, detail links, refresh, and confirmed deletion.
- Upload: drag-and-drop or file picker, one file at a time, PDF/JPEG/PNG/CSV, 20 MiB size validation, upload-session creation, upload progress, and extraction job creation.
- Document details: metadata, processing status, and a real extraction-job request for an uploaded document.
- Job status: real status endpoint with 5-second polling while the job is queued or processing; polling stops at terminal states.
- Login and registration use a server-side session cookie with an Angular CSRF header; private routes use an auth guard.
- Extraction review: view actual CSV rows, run validation, and approve reviewed results.
- Data Explorer: search records from approved extraction results.
- Analytics, CSV exports/downloads, organization members, and usage: connected to workspace-scoped backend APIs.
- Admin settings show recent workspace mutation audit events; regular users cannot access the audit endpoint.

## API integration inventory

The source of truth is the Spring Boot backend in `C:\Mangesh\data_extraction_saas`. All private API requests use the authenticated server session; Angular keeps the user profile in memory only. The XSRF cookie is paired with the `X-XSRF-TOKEN` header for writes.

| Frontend behavior | Backend request |
| --- | --- |
| Read document list | `GET /api/v1/documents` |
| Create upload session | `POST /api/v1/documents` |
| Upload bytes | `PUT /api/v1/documents/{documentId}/content` (local backend upload URL) |
| Confirm uploaded bytes | `POST /api/v1/documents/{documentId}/confirm-upload` |
| Confirm upload | `POST /api/v1/documents/{documentId}/confirm-upload` |
| Read document details | `GET /api/v1/documents/{documentId}` |
| Delete document | `DELETE /api/v1/documents/{documentId}` |
| Request extraction | `POST /api/v1/documents/{documentId}/extractions` |
| Poll extraction job | `GET /api/v1/jobs/{jobId}` |
| Login / register / current profile | `/api/v1/auth/**`, `GET /api/v1/users/me` |
| Read/correct/validate/approve results | `/api/v1/extractions/**` |
| Search approved rows | `GET /api/v1/records` |
| Analytics and usage | `/api/v1/analytics/**`, `GET /api/v1/usage` |
| Create/list/download exports | `/api/v1/exports/**` |
| Workspace / member list | `/api/v1/organization/**` |

The UI uses no fake login, sample records, or fabricated metrics. The local worker parses PDF text, Word text/tables, Excel worksheets, and CSV rows. The Analyze a document flow presents a content summary, extracted tables, and charts generated from numeric columns. The admin-only Users & access screen lists accounts across workspaces and supports role assignment and account suspension. Scanned PDF OCR and external AI extraction providers are not configured.

## Security and current limits

- **Local H2 preview.** The backend enforces login, session authentication, CSRF for writes, and organization isolation. Accounts, sessions, documents, jobs, results, and exports are stored in the local H2 file database. Use this development setup locally; it is not configured for production deployment.
- Authentication uses an HttpOnly server session cookie; the UI does not save passwords, bearer tokens, or session identifiers in browser storage. Angular pairs the CSRF cookie with its request header. Uploads are same-origin through the local proxy.
- No secrets belong in Angular environment files; frontend configuration is public. The development proxy target is local-only.
- The 20 MiB/type checks improve user feedback but are not security boundaries; the backend must validate bytes, content type, size, authorization, and tenant ownership.
- Production deployment still requires durable user and session storage, production cookie settings (`APP_COOKIE_SECURE=true` behind HTTPS), strict CORS, CSP/security headers, object storage, provider/queue protections, and operational retention controls.
- The API returns every document without pagination; the current documents table filters the returned array locally. Add server-side pagination before using large datasets.
- Analysis jobs run on an in-process asynchronous worker. Job and result records survive backend restarts, but queued work is not resumed automatically if the process stops mid-job. Scanned PDF/image OCR and AI provider workflows still require external integrations.

## Configuration

`src/environments/environment.ts` contains `apiBaseUrl: '/api'` for local development. Production builds replace it with `src/environments/environment.prod.ts`; configure that file for the deployed API origin when needed. Do not put secrets in either file. If the UI and API are hosted on different origins, configure an explicit allowlist in Spring Boot CORS and use HTTPS.
