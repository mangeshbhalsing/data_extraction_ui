import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface CapabilityCopy { title: string; icon: string; message: string; }

@Component({
  selector: 'app-capability-page', imports: [RouterLink],
  template: `
    <a class="back-link" routerLink="/">← Back to dashboard</a>
    <section class="capability-panel">
      <span class="capability-icon" aria-hidden="true">{{ copy().icon }}</span>
      <div class="eyebrow"><span class="eyebrow-line"></span> BACKEND API REQUIRED</div>
      <h1>{{ copy().title }}</h1>
      <p>{{ copy().message }}</p>
      <div class="api-gap"><span aria-hidden="true">i</span><span>This page is intentionally read-only until Spring Boot exposes the required API. No sample data or simulated success is shown.</span></div>
      <a class="button button-secondary" routerLink="/documents">View connected document APIs</a>
    </section>
  `,
  styles: [`:host{display:block}.back-link{display:inline-block;margin-bottom:20px;color:#58708c;font-size:10px;text-decoration:none}.capability-panel{display:flex;max-width:610px;min-height:310px;align-items:flex-start;flex-direction:column;padding:30px;border:1px solid var(--color-border);border-radius:var(--radius-card);background:#fff;box-shadow:var(--shadow-card)}.capability-icon{display:grid;width:44px;height:44px;margin-bottom:21px;place-items:center;border-radius:13px;background:#eaf7ff;color:#3e82a8;font-size:19px}.capability-panel h1{margin:9px 0 8px;color:var(--color-text-primary);font-size:22px}.capability-panel>p{max-width:475px;margin:0;color:#79889b;font-size:11px;line-height:1.7}.api-gap{display:flex;gap:9px;margin:22px 0;padding:12px;border:1px solid #dfedf7;border-radius:8px;background:#f6fbff;color:#66809a;font-size:9px;line-height:1.6}.api-gap>span:first-child{font-weight:800}.button{margin-top:auto}`],
})
export class CapabilityPage {
  private readonly route = inject(ActivatedRoute);
  private readonly routeData = toSignal(this.route.data, { initialValue: this.route.snapshot.data });
  protected readonly copy = computed(() => this.routeData() as CapabilityCopy);
}
