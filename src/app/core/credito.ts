import { Injectable } from '@angular/core';

export interface ResumenCredito {
  monto: number;
  plazo: number;
  cuota: number;
  tasaMensual: number; // ej. 0.02
  fechaPago: string;
  fechaAceptacion: string; // ISO
}

/**
 * Cálculo de la simulación de crédito (sistema francés + seguro).
 * No guarda nada: el estado vive en SolicitudService.
 */
@Injectable({ providedIn: 'root' })
export class Credito {
  readonly tasaMensual = 0.02;                // 2 % de interés mensual
  private readonly seguroMensual = 0.0007956; // ≈0,08 % del monto, cada mes

  /** Arma el resumen del crédito pactado (no lo guarda). */
  construirResumen(monto: number, plazo: number): ResumenCredito {
    return {
      monto,
      plazo,
      cuota: this.calcularCuota(monto, plazo),
      tasaMensual: this.tasaMensual,
      fechaPago: '1 de cada mes',
      fechaAceptacion: new Date().toISOString(),
    };
  }

  /** 6700000 -> "$6.700.000" */
  formatoPesos(valor: number): string {
    return '$' + Math.round(valor).toLocaleString('es-CO');
  }

  /** Cuota fija mensual (sistema francés) más el seguro. */
  calcularCuota(prestamo: number, meses: number): number {
    const cuotaCredito = prestamo * this.tasaMensual / (1 - Math.pow(1 + this.tasaMensual, -meses));
    const seguro = prestamo * this.seguroMensual;
    return cuotaCredito + seguro;
  }

  /** Tasa efectiva anual a partir de la mensual: (1 + em)^12 - 1 */
  tasaEfectivaAnual(tasaMensual: number = this.tasaMensual): number {
    return Math.pow(1 + tasaMensual, 12) - 1;
  }

  /** 0.02 -> "2,00% E.M (26,82% E.A)" */
  textoTasa(tasaMensual: number = this.tasaMensual): string {
    const formato = (valor: number) =>
      (valor * 100).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${formato(tasaMensual)}% E.M (${formato(this.tasaEfectivaAnual(tasaMensual))}% E.A)`;
  }
}