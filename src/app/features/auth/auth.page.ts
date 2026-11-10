import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="auth-frame">
      <section class="auth-card" aria-labelledby="auth-title">
        <a class="brand" routerLink="/"><span class="brand-mark">E</span><span><strong>ExtractIQ</strong><small>AI Document Intelligence</small></span></a>
        <div class="eyebrow">{{ isRegister ? 'CREATE WORKSPACE ACCOUNT' : 'SECURE WORKSPACE ACCESS' }}</div>
        <h1 id="auth-title">{{ isRegister ? 'Create your account' : 'Welcome back' }}</h1>
        <p class="subtitle">{{ isRegister ? 'Your account starts in its own private workspace.' : 'Sign in to continue to your document workspace.' }}</p>
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          @if (isRegister) { <label>Full name<input formControlName="displayName" autocomplete="name" maxlength="100" /></label> }
          <label>Email<input formControlName="email" type="email" autocomplete="email" inputmode="email" /></label>
          <label>Password<input formControlName="password" type="password" [attr.autocomplete]="isRegister ? 'new-password' : 'current-password'" /></label>
          @if (isRegister) { <small class="hint">Use at least 12 characters, with uppercase, lowercase, and a number.</small> }
          @if (error()) { <div class="error" role="alert">{{ error() }}</div> }
          <button type="submit" [disabled]="form.invalid || busy()">{{ busy() ? 'Please wait…' : (isRegister ? 'Create account' : 'Sign in') }}</button>
        </form>
        <p class="switch">{{ isRegister ? 'Already have an account?' : 'New to ExtractIQ?' }} <a [routerLink]="isRegister ? '/login' : '/register'">{{ isRegister ? 'Sign in' : 'Create an account' }}</a></p>
        <p class="local-note">Local H2 preview. Your account, documents, and analysis reports are saved between restarts.</p>
      </section>
    </main>
  `,
  styles: [`
    :host{display:block;min-height:100vh;background:radial-gradient(ellipse at 15% 5%,#e3f5ff,transparent 45%),#f5f8fc;color:#1e2d42;font-family:inherit}.auth-frame{min-height:100vh;display:grid;place-items:center;padding:24px}.auth-card{width:min(100%,430px);padding:34px;border:1px solid #e2e8f0;border-radius:18px;background:#fff;box-shadow:0 18px 55px #29476412}.brand{display:flex;align-items:center;gap:12px;margin-bottom:34px;text-decoration:none;color:inherit}.brand-mark{display:grid;width:42px;height:42px;place-items:center;border-radius:13px;background:#97d7ff;color:#123c55;font-size:21px;font-weight:800}.brand>span:last-child{display:grid;gap:3px}.brand strong{font-size:17px}.brand small{color:#77879a;font-size:10px}.eyebrow{color:#5894b8;font-size:9px;font-weight:800;letter-spacing:1.4px}h1{margin:9px 0;color:#1d2d43;font-size:25px}.subtitle{margin:0 0 23px;color:#758397;font-size:12px;line-height:1.6}form{display:grid;gap:15px}label{display:grid;gap:7px;color:#405168;font-size:11px;font-weight:700}input{height:42px;padding:0 12px;border:1px solid #dbe3eb;border-radius:8px;color:#1d2d43;font:inherit;outline:none}input:focus{border-color:#65bcea;box-shadow:0 0 0 3px #97d7ff55}button{height:43px;margin-top:3px;border:0;border-radius:8px;background:#2784b3;color:white;font-size:12px;font-weight:750;cursor:pointer}button:disabled{opacity:.55;cursor:wait}.hint,.local-note{color:#8794a4;font-size:9px;line-height:1.55}.error{padding:10px;border-radius:7px;background:#fff1f1;color:#aa3030;font-size:11px}.switch{text-align:center;color:#738196;font-size:10px;margin:18px 0}.switch a{color:#287ea9;font-weight:700}.demo{display:grid;gap:6px;padding:12px;border:1px solid #e0edf4;border-radius:8px;background:#f7fbfd;color:#60748b;font-size:9px}.demo strong{color:#354c65}.local-note{text-align:center;margin:16px 0 0}
  `],
})
export class AuthPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly isRegister = this.router.url.startsWith('/register');
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly form = this.fb.group({
    displayName: ['', this.isRegister ? [Validators.required, Validators.maxLength(100)] : []],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', [Validators.required, ...(this.isRegister ? [Validators.minLength(12), Validators.maxLength(128)] : [])]],
  });

  protected submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.busy.set(true); this.error.set('');
    const value = this.form.getRawValue();
    const request = this.isRegister
      ? this.auth.register({ email: value.email!, password: value.password!, displayName: value.displayName! })
      : this.auth.login({ email: value.email!, password: value.password! });
    request.subscribe({
      next: () => { this.busy.set(false); void this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('returnUrl') || '/'); },
      error: response => { this.busy.set(false); this.error.set(response?.error?.message || 'Unable to sign in. Check your details and try again.'); },
    });
  }
}
