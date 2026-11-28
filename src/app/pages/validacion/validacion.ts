import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';
import { SolicitudService } from '../../core/solicitud';

@Component({
  selector: 'app-validacion',
  imports: [Header, Footer],
  templateUrl: './validacion.html',
})
export class Validacion {
  private readonly router = inject(Router);
  private readonly solicitud = inject(SolicitudService);

  // Bajado de 5 a 2 MB: el archivo se guarda en base64 en sessionStorage,
  // que tiene un límite de ~5 MB por sitio y el base64 pesa ~33% más que el original.
  private readonly TAMANO_MAX_MB = 2;
  private readonly TIPOS_PERMITIDOS = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  readonly nombre = signal('');
  readonly tipoDoc = signal('');
  readonly doc = signal('');
  readonly telefono = signal('');
  readonly correo = signal('');
  readonly saldo = signal('');
  readonly archivo = signal<File | null>(null);

  readonly errorNombre = signal(false);
  readonly errorTipo = signal(false);
  readonly errorDoc = signal(false);
  readonly errorTelefono = signal(false);
  readonly errorCorreo = signal(false);
  readonly errorSaldo = signal(false);
  readonly errorArchivo = signal(false);
  readonly mensajeArchivo = signal('');

  readonly cargando = signal(false);
  readonly listo = signal(false);

  limpiar(): void {
    this.errorNombre.set(false);
    this.errorTipo.set(false);
    this.errorDoc.set(false);
    this.errorTelefono.set(false);
    this.errorCorreo.set(false);
    this.errorSaldo.set(false);
    this.errorArchivo.set(false);
  }

  onDoc(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const soloNumeros = input.value.replace(/\D/g, '').slice(0, 10);
    input.value = soloNumeros;
    this.doc.set(soloNumeros);
    this.limpiar();
  }

  onTelefono(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const soloNumeros = input.value.replace(/\D/g, '').slice(0, 10);
    input.value = soloNumeros;
    this.telefono.set(soloNumeros);
    this.limpiar();
  }

  onSaldo(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const limpio = input.value.replace(/[^\d,]/g, '');
    const [enteroCrudo, ...resto] = limpio.split(',');
    const tieneDecimal = resto.length > 0;

    let entero = enteroCrudo.replace(/^0+(?=\d)/, '').slice(0, 12);
    if (!entero && tieneDecimal) entero = '0';

    const decimal = resto.join('').slice(0, 2);
    const enteroFormateado = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    let texto = enteroFormateado;
    if (tieneDecimal) texto += ',' + decimal;
    if (texto) texto = '$' + texto;

    input.value = texto;
    this.saldo.set(texto);
    this.limpiar();
  }

  onArchivo(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.limpiar();

    if (!file) {
      this.archivo.set(null);
      return;
    }

    if (!this.TIPOS_PERMITIDOS.includes(file.type)) {
      this.archivo.set(null);
      this.errorArchivo.set(true);
      this.mensajeArchivo.set('Solo se permiten archivos PDF o imágenes (JPG, PNG, WEBP).');
      input.value = '';
      return;
    }

    if (file.size > this.TAMANO_MAX_MB * 1024 * 1024) {
      this.archivo.set(null);
      this.errorArchivo.set(true);
      this.mensajeArchivo.set(`El archivo no puede superar ${this.TAMANO_MAX_MB} MB.`);
      input.value = '';
      return;
    }

    this.mensajeArchivo.set('');
    this.archivo.set(file);
  }

  async validar(evento: Event): Promise<void> {
    evento.preventDefault();

    const nombreMal = !this.nombreValido(this.nombre());
    const tipoMal = !this.tipoDoc();
    const docMal = !this.docValido(this.doc());
    const telefonoMal = !this.telefonoValido(this.telefono());
    const correoMal = !this.correoValido(this.correo());
    const saldoMal = !this.saldoValido(this.saldo());
    const archivoMal = !this.archivo();

    this.errorNombre.set(nombreMal);
    this.errorTipo.set(tipoMal);
    this.errorDoc.set(docMal);
    this.errorTelefono.set(telefonoMal);
    this.errorCorreo.set(correoMal);
    this.errorSaldo.set(saldoMal);

    if (archivoMal) {
      this.errorArchivo.set(true);
      if (!this.mensajeArchivo()) {
        this.mensajeArchivo.set('Adjunta tu comprobante (PDF o imagen).');
      }
    }

    if (nombreMal || tipoMal || docMal || telefonoMal || correoMal || saldoMal || archivoMal) {
      return;
    }

    const archivo = this.archivo();
    if (!archivo) {
      return;
    }

    let base64: string;
    try {
      base64 = await this.archivoABase64(archivo);
    } catch {
      this.errorArchivo.set(true);
      this.mensajeArchivo.set('No se pudo leer el archivo. Intenta de nuevo.');
      return;
    }

    this.solicitud.guardar('validacion', {
      nombre: this.nombre().trim(),
      tipoDocumento: this.tipoDoc(),
      numeroDocumento: this.doc(),
      telefono: this.telefono(),
      correo: this.correo().trim(),
      saldo: this.saldoANumero(this.saldo()),
      comprobante: { nombre: archivo.name, tipo: archivo.type, tamano: archivo.size, base64 },
    });

    this.cargando.set(true);
    setTimeout(() => this.listo.set(true), 2000);
    setTimeout(() => this.router.navigate(['/firma']), 3200);
  }

  // Lee el archivo y devuelve solo el base64 (sin el prefijo "data:...;base64,")
  private archivoABase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const lector = new FileReader();
      lector.onload = () => resolve((lector.result as string).split(',')[1]);
      lector.onerror = () => reject(lector.error);
      lector.readAsDataURL(file);
    });
  }

  private saldoANumero(texto: string): number {
    return Number(texto.replace('$', '').replace(/\./g, '').replace(',', '.'));
  }

  private nombreValido(texto: string): boolean {
    const limpio = texto.trim();
    return /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+(\s+[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)+$/.test(limpio);
  }

  private docValido(texto: string): boolean {
    return /^\d{7,10}$/.test(texto);
  }

  private telefonoValido(texto: string): boolean {
    return /^3\d{9}$/.test(texto);
  }

  private saldoValido(texto: string): boolean {
    return /^\$\d{1,3}(\.\d{3})*(,\d{1,2})?$/.test(texto);
  }

  private correoValido(texto: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto);
  }
}