import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';
import { Credito } from '../../core/credito';
import { SolicitudService } from '../../core/solicitud';

@Component({
  selector: 'app-inicio',
  imports: [Header, Footer],
  templateUrl: './inicio.html',
})
export class Inicio implements OnDestroy {
  private readonly credito = inject(Credito);
  private readonly solicitud = inject(SolicitudService);
  private readonly router = inject(Router);
  private readonly doc = inject(DOCUMENT);

  // Límites del monto (coinciden con el input range del modal)
  readonly montoMin = 100000;
  readonly montoMax = 6700000;

  readonly cedula = signal('');
  readonly errorCedula = signal(false);

  readonly modalAbierto = signal(false);
  readonly monto = signal(this.montoMax);
  readonly plazo = signal(24);
  readonly autorizado = signal(false);

  readonly cargando = signal(false);
  readonly listo = signal(false);

  readonly montoTexto = computed(() => this.credito.formatoPesos(this.monto()));
  readonly cuotaTexto = computed(() =>
    this.credito.formatoPesos(this.credito.calcularCuota(this.monto(), this.plazo())),
  );
  readonly tasaTexto = computed(() => this.credito.textoTasa());

  // Pinta de blanco la parte recorrida de la barra del monto
  readonly barra = computed(() => {
    const porcentaje = ((this.monto() - this.montoMin) / (this.montoMax - this.montoMin)) * 100;
    return `linear-gradient(to right, #fff ${porcentaje}%, rgba(255,255,255,0.35) ${porcentaje}%)`;
  });

  escribirCedula(texto: string): void {
    this.cedula.set(texto.replace(/\D/g, '').slice(0, 10));
    this.errorCedula.set(false);
  }

  enviar(evento: Event): void {
    evento.preventDefault();
    if (!/^\d{7,10}$/.test(this.cedula())) {
      this.errorCedula.set(true);
      return;
    }
    this.abrirModal();
  }

  cambiarMonto(texto: string): void {
    this.monto.set(Number(texto));
  }

  cambiarPlazo(texto: string): void {
    this.plazo.set(Number(texto));
  }

  cerrar(): void {
    this.modalAbierto.set(false);
    this.autorizado.set(false);
    this.doc.documentElement.classList.remove('sin-scroll');
  }

  continuar(): void {
    // Solicitud nueva: se borra cualquier dato de un intento anterior
    this.solicitud.limpiar();

    // Se guardan las dos secciones que se llenan en esta pantalla
    this.solicitud.guardar('cliente', { cedula: this.cedula() });
    this.solicitud.guardar('credito', this.credito.construirResumen(this.monto(), this.plazo()));

    this.cargando.set(true);
    setTimeout(() => this.listo.set(true), 2000);
    setTimeout(() => this.router.navigate(['/intro']), 3200);
  }

  ngOnDestroy(): void {
    this.doc.documentElement.classList.remove('sin-scroll');
  }

  private abrirModal(): void {
    this.modalAbierto.set(true);
    this.doc.documentElement.classList.add('sin-scroll');
  }
}