import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';

interface SettingsNavItem {
  title: string;
  fragment?: string;
  path?: any[] | string;
  icon?: string;
}

interface SettingsNavGroup {
  title: string;
  expanded: boolean;
  items: SettingsNavItem[];
}

@Component({
  selector: 'app-settings-sidenav',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './settings-sidenav.html',
  styleUrl: './settings-sidenav.css',
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0px', opacity: 0, overflow: 'hidden' })),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('collapsed <=> expanded', [animate('180ms ease-in-out')])
    ])
  ]
})
export class SettingsSidenavComponent {
  private viewportScroller = inject(ViewportScroller);
  private router = inject(Router);

  navGroups: SettingsNavGroup[] = [
    {
      title: 'Compositor',
      expanded: true,
      items: [
        { title: 'Hyprland Config', fragment: 'hyprland', icon: '🌀' },
        { title: 'Monitor Profiles', fragment: 'hyprland-monitors', icon: '🖵' }
      ]
    },
    {
      title: 'Status Bars',
      expanded: true,
      items: [
        { title: 'Waybar Modules', fragment: 'waybar', icon: '📊' },
        { title: 'Widgets & CSS', fragment: 'waybar-styles', icon: '🎛️' }
      ]
    },
    {
      title: 'System Theme',
      expanded: true,
      items: [
        { title: 'Palette Tokens', fragment: 'theme', icon: '🎨' },
        { title: 'Export Targets', fragment: 'theme-exports', icon: '🔗' }
      ]
    }
  ];

  toggleGroup(group: SettingsNavGroup) {
    group.expanded = !group.expanded;
  }

  async navigate(item: SettingsNavItem) {
    if (item.path) {
      await this.router.navigate(Array.isArray(item.path) ? item.path : [item.path]);
    } else {
      await this.router.navigate(['/settings'], { fragment: item.fragment });
    }

    if (item.fragment) {
      setTimeout(() => this.viewportScroller.scrollToAnchor(item.fragment!), 0);
    }
  }
}


