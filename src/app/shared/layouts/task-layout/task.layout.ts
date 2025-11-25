import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { CommonModule } from '@angular/common';
import { SidenavComponent, SidenavConfig } from '@shared/ui/sidenav/sidenav';
import { NavbarComponent } from '@shared/ui/navbar/navbar';

@Component({
  selector: 'app-task-layout',
  standalone: true,
  templateUrl: './task.layout.html',
  styles: [`
    .sidenav-container {
      height: 100vh;
      background: var(--bg-canvas);
    }
    .sidenav {
      width: 260px;
      border-right: 1px solid var(--border-subtle);
      background: var(--bg-sidebar);
    }
    .content-wrapper {
      height: calc(100vh - 64px); /* navbar height */
      overflow: hidden;
    }
    app-navbar {
      position: relative;
      z-index: 2;
    }
  `],
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    SidenavComponent,
    NavbarComponent
  ]
})
export class TaskLayoutComponent {
  sidenavConfig: SidenavConfig = {
    brandText: 'Task Manager',
    brandLink: '/tasks',
    groups: [
      {
        title: 'Views',
        expanded: true,
        items: [
          { title: 'Board', path: '/tasks/board', icon: '<i class="fas fa-columns"></i>' },
          // { title: 'List', path: '/tasks/list', icon: '<i class="fas fa-list"></i>' } // Future
        ]
      },
      // {
      //   title: 'Management',
      //   expanded: true,
      //   items: [
      //     { title: 'Releases', path: '/tasks/releases', icon: '<i class="fas fa-code-branch"></i>' }
      //   ]
      // }
    ]
  };
}

