import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ThemeService } from './core/services/theme.service';

interface NavItem {
  title: string;
  path: any[] | string;
  icon?: string;
}

interface NavGroup {
  title: string;
  expanded: boolean;
  items: NavItem[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0px', opacity: 0, overflow: 'hidden' })),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('collapsed <=> expanded', [
        animate('200ms ease-in-out')
      ])
    ])
  ]
})
export class AppComponent {
  title = 'argus';
  themeService = inject(ThemeService);

  navGroups: NavGroup[] = [
    {
      title: 'Guides',
      expanded: true,
      items: [
        { 
          title: 'Welcome', 
          path: ['/docs', '/home/maxgeller/Code/Angular/Tauri/argus/src/assets/welcome.md'] 
        },
        { 
          title: 'Cheatsheet', 
          path: ['/docs', '/home/maxgeller/Code/Angular/Tauri/argus/src/assets/cheatsheet.md'] 
        }
      ]
    },
    {
      title: 'Tools',
      expanded: true,
      items: [
        { 
          title: 'Keybindings', 
          path: '/keybindings' 
        }
      ]
    }
  ];

  toggleGroup(group: NavGroup) {
    group.expanded = !group.expanded;
  }
}
