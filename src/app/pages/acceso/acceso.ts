import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SolicitudService } from '../../core/solicitud';

@Component({
  selector: 'app-acceso',
  templateUrl: './acceso.html',
  styleUrl: './acceso.css',
})
export class Acceso {
  private readonly router = inject(Router);
  private readonly solicitud = inject(SolicitudService);

  readonly telefono = signal('');

  // Válido: 10 dígitos que empiezan por 3 (celular en Colombia)
  readonly valido = computed(() => {
    const digitos = this.telefono().replace(/\D/g, '');
    return digitos.length === 10 && digitos[0] === '3';
  });

  // Máscara visual 3-3-4, tope de 10 dígitos
  escribir(texto: string): void {
    let digitos = texto.replace(/\D/g, '');
    if (digitos.length > 10) digitos = digitos.slice(0, 10);

    let formateado = digitos;
    if (digitos.length > 6) {
      formateado = digitos.replace(/(\d{3})(\d{3})(\d{0,4})/, '$1 $2 $3');
    } else if (digitos.length > 3) {
      formateado = digitos.replace(/(\d{3})(\d{0,3})/, '$1 $2');
    }
    this.telefono.set(formateado);
  }

  entrar(evento: Event): void {
    evento.preventDefault();
    if (!this.valido()) {
      return;
    }

    // Se guarda solo con dígitos: "300 123 4567" -> "3001234567"
    this.solicitud.guardar('acceso', {
      telefono: this.telefono().replace(/\D/g, ''),
    });

    this.router.navigate(['/pin']);
  }
}