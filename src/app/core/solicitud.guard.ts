import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Seccion, SolicitudService } from './solicitud';

export const solicitudGuard =
  (requeridas: Seccion[]): CanActivateFn =>
  () => {
    const solicitud = inject(SolicitudService);
    const router = inject(Router);
    return solicitud.tiene(requeridas) ? true : router.createUrlTree(['/']);
  };