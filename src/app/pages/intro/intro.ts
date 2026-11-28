import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-intro',
  imports: [],
  templateUrl: './intro.html',
})
export class Intro {
  private readonly router = inject(Router);

  continuar(): void {
    this.router.navigate(['/acceso']);
  }
}