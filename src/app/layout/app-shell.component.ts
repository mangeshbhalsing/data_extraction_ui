import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

interface NavigationItem {
  label: string;
  route?: string;
  icon: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
})
export class AppShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly menuOpen = signal(false);
  protected readonly user = this.auth.user;
  protected roleInitials(): string {
    switch (this.user()?.role) {
      case 'SUPER_ADMIN': return 'SA';
      case 'ADMIN': return 'A';
      default: return 'U';
    }
  }
  protected readonly primaryNavigation: NavigationItem[] = [
    { label: 'Dashboard', route: '/', icon: '▦' },
    { label: 'Documents', route: '/documents', icon: '▤' },
    { label: 'Upload documents', route: '/documents/new', icon: '↑' },
    { label: 'Analyze a document', route: '/documents/analyze', icon: '◫' },
  ];
  protected readonly workspaceNavigation: NavigationItem[] = [
    { label: 'Extraction review', route: '/extractions', icon: '✦' },
    { label: 'Data Explorer', route: '/data-explorer', icon: '◫' },
    { label: 'Analytics', route: '/analytics', icon: '◒' },
    { label: 'Exports', route: '/exports', icon: '⇩' },
  ];
  protected readonly accountNavigation: NavigationItem[] = [
    { label: 'Organization', route: '/organization', icon: '⌂' },
    { label: 'Settings', route: '/settings', icon: '⚙' },
  ];
  protected readonly adminNavigation: NavigationItem[] = [
    { label: 'Users & access', route: '/admin/users', icon: '♙' },
  ];

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected signOut(): void {
    this.auth.logout().subscribe(() => void this.router.navigateByUrl('/login'));
  }
}
