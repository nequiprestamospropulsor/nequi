import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';
import { Credito } from '../../core/credito';
import { SolicitudService } from '../../core/solicitud';

@Component({
  selector: 'app-firma-contrato',
  imports: [Header, Footer],
  templateUrl: './firma-contrato.html',
})
export class FirmaContrato {
  private readonly router = inject(Router);
  private readonly credito = inject(Credito);
  private readonly solicitud = inject(SolicitudService);

  private readonly RUTA_SIGUIENTE = '/otp';

  readonly cargando = signal(false);
  readonly listo = signal(false);

  readonly resumen = this.solicitud.credito;
  readonly montoTexto = computed(() => this.credito.formatoPesos(this.resumen()?.monto ?? 0));
  readonly cuotaTexto = computed(() => this.credito.formatoPesos(this.resumen()?.cuota ?? 0));

  firmar(): void {
    if (this.cargando()) return;

    this.cargando.set(true);
    setTimeout(() => this.listo.set(true), 2000);
    setTimeout(() => this.router.navigate([this.RUTA_SIGUIENTE]), 3200);
  }
}