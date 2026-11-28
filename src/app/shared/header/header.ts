import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  template: `
    <header class="flex items-center justify-between px-6 py-4 bg-white">
      <div class="flex items-center">
        <img src="assets/logo.png" alt="Mi marca" class="w-auto" style="height: 28px;">
      </div>
      <div class="flex flex-col gap-1" aria-hidden="true">
        <span class="block w-6 border-b border-purple-primary"></span>
        <span class="block w-6 border-b border-purple-primary"></span>
        <span class="block w-6 border-b border-purple-primary"></span>
      </div>
    </header>
  `,
})
export class Header {}
