import { Component, inject, effect, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { QuickTaskListComponent } from './features/tasks/components/quick-task-list/quick-task-list';
import { LayoutService } from '@core/services/layout.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatSidenavModule, QuickTaskListComponent],
  templateUrl: './app.component.html',
  styles: [`
    .global-sidenav-container {
      width: 100vw;
      height: 100vh;
      background: transparent;
    }
  `]
})
export class AppComponent {
  title = 'argus';
  layoutService = inject(LayoutService);
  
  @ViewChild('taskSidenav') taskSidenav!: MatSidenav;
  
  constructor() {
    effect(() => {
      if (this.layoutService.showTaskSidenav()) {
        this.taskSidenav?.open();
      } else {
        this.taskSidenav?.close();
      }
    });
  }
  
  onSidenavClosed() {
    this.layoutService.closeTaskSidenav();
  }
}
