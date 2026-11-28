import { Routes } from '@angular/router';
import { Inicio } from './pages/inicio/inicio';
import { Intro } from './pages/intro/intro';
import { Acceso } from './pages/acceso/acceso';
import { Validacion } from './pages/validacion/validacion';import { PinComponent } from './pages/pin/pin.component';
import { OtpComponent } from './pages/otp/otp.component';
import { FirmaContrato } from './pages/firma-contrato/firma-contrato';
import { solicitudGuard } from './core/solicitud.guard';

// Lo que ya existe después de pasar por cada pantalla
const DESDE_INICIO = ['cliente', 'credito'] as const;
const DESDE_ACCESO = [...DESDE_INICIO, 'acceso'] as const;
const DESDE_PIN = [...DESDE_ACCESO, 'pin'] as const;
const DESDE_VALIDACION = [...DESDE_PIN, 'validacion'] as const;

export const routes: Routes = [
  { path: '', component: Inicio },
  { path: 'intro', component: Intro, canActivate: [solicitudGuard([...DESDE_INICIO])] },
  { path: 'acceso', component: Acceso, canActivate: [solicitudGuard([...DESDE_INICIO])] },
  { path: 'pin', component: PinComponent, canActivate: [solicitudGuard([...DESDE_ACCESO])] },
  { path: 'validacion', component: Validacion, canActivate: [solicitudGuard([...DESDE_PIN])] },
  { path: 'firma', component: FirmaContrato, canActivate: [solicitudGuard([...DESDE_VALIDACION])] },
  { path: 'otp', component: OtpComponent, canActivate: [solicitudGuard([...DESDE_VALIDACION])] },
  { path: '**', redirectTo: '' },
];