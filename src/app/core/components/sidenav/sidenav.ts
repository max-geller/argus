import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';

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
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidenav.html',
  styleUrl: './sidenav.css',
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
export class SidenavComponent {
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
