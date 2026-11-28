import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Reintento {
  private usado = false;

  marcar(): void {
    this.usado = true;
  }

  yaSeUso(): boolean {
    return this.usado;
  }
}