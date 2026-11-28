import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';

@Component({
  selector: 'app-intro',
  imports: [Header, Footer],
  templateUrl: './intro.html',
})
export class Intro {
  private readonly router = inject(Router);

  continuar(): void {
    this.router.navigate(['/acceso']);
  }
}
