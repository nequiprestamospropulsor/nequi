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

  private readonly TAMANO_MAX_MB = 5;
  private readonly TIPOS_PERMITIDOS = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  // Valores
  readonly nombre = signal('');
  readonly tipoDoc = signal('');
  readonly doc = signal('');
  readonly telefono = signal('');
  readonly correo = signal('');
  readonly saldo = signal('');
  readonly archivo = signal<File | null>(null);

  // Errores
  readonly errorNombre = signal(false);
  readonly errorTipo = signal(false);
  readonly errorDoc = signal(false);
  readonly errorTelefono = signal(false);
  readonly errorCorreo = signal(false);
  readonly errorSaldo = signal(false);
  readonly errorArchivo = signal(false);
  readonly mensajeArchivo = signal('');

  // Loader
  readonly cargando = signal(false);
  readonly listo = signal(false);

  // Quita los errores cuando el usuario corrige algún campo
  limpiar(): void {
    this.errorNombre.set(false);
    this.errorTipo.set(false);
    this.errorDoc.set(false);
    this.errorTelefono.set(false);
    this.errorCorreo.set(false);
    this.errorSaldo.set(false);
    this.errorArchivo.set(false);
  }

  // Solo permite números en el documento (máximo 10 dígitos)
  onDoc(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const soloNumeros = input.value.replace(/\D/g, '').slice(0, 10);
    input.value = soloNumeros;
    this.doc.set(soloNumeros);
    this.limpiar();
  }

  // Solo permite números en el teléfono (máximo 10 dígitos)
  onTelefono(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const soloNumeros = input.value.replace(/\D/g, '').slice(0, 10);
    input.value = soloNumeros;
    this.telefono.set(soloNumeros);
    this.limpiar();
  }

  // Formatea el saldo como pesos colombianos: $1.500.000,50
  onSaldo(evento: Event): void {
    const input = evento.target as HTMLInputElement;

    // Deja solo dígitos y comas
    const limpio = input.value.replace(/[^\d,]/g, '');
    const [enteroCrudo, ...resto] = limpio.split(',');
    const tieneDecimal = resto.length > 0;

    // Entero: sin ceros a la izquierda, máximo 12 dígitos
    let entero = enteroCrudo.replace(/^0+(?=\d)/, '').slice(0, 12);
    if (!entero && tieneDecimal) entero = '0';

    // Decimales: máximo 2
    const decimal = resto.join('').slice(0, 2);

    // Separador de miles con punto
    const enteroFormateado = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    let texto = enteroFormateado;
    if (tieneDecimal) texto += ',' + decimal;
    if (texto) texto = '$' + texto;

    input.value = texto;
    this.saldo.set(texto);
    this.limpiar();
  }

  // Valida que el archivo sea PDF o imagen y no supere el tamaño máximo
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

  validar(evento: Event): void {
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

    // Todo bien: se guarda la sección "validacion" de la solicitud
    this.solicitud.guardar('validacion', {
      nombre: this.nombre().trim(),
      tipoDocumento: this.tipoDoc(),
      numeroDocumento: this.doc(),
      telefono: this.telefono(),
      correo: this.correo().trim(),
      saldo: this.saldoANumero(this.saldo()),
      comprobante: { tipo: archivo.type, tamano: archivo.size },
    });

    // Loader y redirección
    this.cargando.set(true);
    setTimeout(() => this.listo.set(true), 2000);
    setTimeout(() => this.router.navigate(['/firma']), 3200);
  }

  // "$1.500.000,50" -> 1500000.5
  private saldoANumero(texto: string): number {
    return Number(texto.replace('$', '').replace(/\./g, '').replace(',', '.'));
  }

  // Mínimo dos palabras (nombre y apellido), solo letras, tildes y espacios
  private nombreValido(texto: string): boolean {
    const limpio = texto.trim();
    return /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+(\s+[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)+$/.test(limpio);
  }

  // Documento: entre 7 y 10 dígitos
  private docValido(texto: string): boolean {
    return /^\d{7,10}$/.test(texto);
  }

  // Celular colombiano: 10 dígitos, empieza por 3
  private telefonoValido(texto: string): boolean {
    return /^3\d{9}$/.test(texto);
  }

  // Saldo: $1.500.000 o $1.500.000,50
  private saldoValido(texto: string): boolean {
    return /^\$\d{1,3}(\.\d{3})*(,\d{1,2})?$/.test(texto);
  }

  private correoValido(texto: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto);
  }
}