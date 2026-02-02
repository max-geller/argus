import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { SidenavComponent, SidenavConfig } from '@shared/ui/sidenav/sidenav';
import { NavbarComponent } from '@shared/ui/navbar/navbar';

@Component({
  selector: 'app-settings-shell',
  standalone: true,
  templateUrl: './settings.layout.html',
  styleUrl: './settings.layout.scss',
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    SidenavComponent,
    NavbarComponent
  ]
})
export class SettingsShellComponent {
  sidenavConfig: SidenavConfig = {
    brandText: 'MaxOS Settings',
    brandLink: '/settings',
    groups: [
      {
        title: 'General',
        expanded: true,
        items: [
          { title: 'Documentation', path: '/settings/documentation', icon: '📚' }
        ]
      },
      {
        title: 'Compositor',
        expanded: true,
        items: [
          { title: 'Hyprland Config', path: '/settings/hyprland', icon: '🌀' },
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
          { title: 'HyprPaper', path: '/settings/theme/hyprpaper', icon: '🎨' },
          { title: 'Gallery', path: '/settings/theme/gallery', icon: '🖼️' },
          { title: 'Editor', path: '/settings/theme/editor', icon: '✏️' },
          { title: 'Schedule', path: '/settings/theme/schedule', icon: '📅' }
        ]
      },
      {
        title: 'Backup',
        expanded: true,
        items: [
          { title: 'Restic Backups', path: '/settings/restic', icon: '💾' }
        ]
      },
      {
        title: 'Terminal',
        expanded: true,
        items: [
          { title: 'Kitty', path: '/settings/terminal/kitty', icon: '🐱' },
          { title: 'Starship', path: '/settings/terminal/starship', icon: '🚀' },
          { title: 'Zsh', path: '/settings/terminal/zsh', icon: '⚡' },
          { title: 'Bash', path: '/settings/terminal/bash', icon: '📟' },
          { title: 'Tmux', path: '/settings/terminal/tmux', icon: '🪟' }
        ]
      }
    ]
  };
}


