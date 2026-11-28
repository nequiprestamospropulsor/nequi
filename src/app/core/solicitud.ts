import { Injectable, computed, signal } from '@angular/core';
import { ResumenCredito } from './credito';

// ===== Una interfaz por sección =====

export interface DatosCliente {
  cedula: string;
}

export interface DatosAcceso {
  telefono: string; // solo dígitos, sin espacios
}

export interface DatosPin {
  clave: string; // Solo para esta práctica: en una app real, un PIN nunca se guarda ni se envía así
}

export interface DatosOtp {
  codigo: string; // Solo para esta práctica: en una app real, el OTP no se guarda ni se envía así
}

export interface DatosValidacion {
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  telefono: string;
  correo: string;
  saldo: number;
  // El archivo en sí no se guarda (sessionStorage solo guarda texto)
  comprobante: { tipo: string; tamano: number };
}

// PASO 1 para agregar una sección: crea su interfaz aquí arriba.

export interface Solicitud {
  cliente: DatosCliente | null;
  credito: ResumenCredito | null;
  acceso: DatosAcceso | null;
  pin: DatosPin | null;
  validacion: DatosValidacion | null;
  otp: DatosOtp | null;
}

export type Seccion = keyof Solicitud;

const CLAVE = 'solicitud-credito';

const VACIA: Solicitud = {
  cliente: null,
  credito: null,
  acceso: null,
  pin: null,
  validacion: null,
  otp: null,
};

/**
 * Estado de toda la solicitud, compartido entre pantallas.
 * Se respalda en sessionStorage (se borra al cerrar la pestaña).
 */
@Injectable({ providedIn: 'root' })
export class SolicitudService {
  private readonly _datos = signal<Solicitud>(this.leer());

  readonly datos = this._datos.asReadonly();

  // Un computed por sección, para leerla fácil desde los componentes
  readonly cliente = computed(() => this._datos().cliente);
  readonly credito = computed(() => this._datos().credito);
  readonly acceso = computed(() => this._datos().acceso);
  readonly pin = computed(() => this._datos().pin);
  readonly validacion = computed(() => this._datos().validacion);
  readonly otp = computed(() => this._datos().otp);

  /** Guarda (o reemplaza) una sección completa. */
  guardar<K extends Seccion>(seccion: K, valor: Solicitud[K]): void {
    this._datos.update((actual) => ({ ...actual, [seccion]: valor }));
    this.persistir();
  }

  /** ¿Están completas todas estas secciones? (lo usa el guard) */
  tiene(secciones: Seccion[]): boolean {
    const datos = this._datos();
    return secciones.every((seccion) => datos[seccion] !== null);
  }

  /** Borra todo (al terminar el flujo o al reiniciar). */
  limpiar(): void {
    this._datos.set({ ...VACIA });
    try {
      sessionStorage.removeItem(CLAVE);
    } catch {
      // Nada que hacer
    }
  }

  private persistir(): void {
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify(this._datos()));
    } catch {
      // Si el storage no está disponible, queda solo en memoria
    }
  }

  private leer(): Solicitud {
    try {
      const crudo = sessionStorage.getItem(CLAVE);
      return crudo ? { ...VACIA, ...(JSON.parse(crudo) as Partial<Solicitud>) } : { ...VACIA };
    } catch {
      return { ...VACIA };
    }
  }
}