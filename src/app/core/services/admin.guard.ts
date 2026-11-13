import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.ensureSignedIn().pipe(
    map(signedIn => signedIn && ['ADMIN', 'SUPER_ADMIN'].includes(auth.user()?.role ?? '') ? true : router.createUrlTree(signedIn ? ['/'] : ['/login'])),
    catchError(() => of(router.createUrlTree(['/login']))),
  );
};
