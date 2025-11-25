import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  showTaskSidenav = signal(false);

  toggleTaskSidenav() {
    this.showTaskSidenav.update(v => !v);
  }

  openTaskSidenav() {
    this.showTaskSidenav.set(true);
  }

  closeTaskSidenav() {
    this.showTaskSidenav.set(false);
  }
}

