import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewportScroller } from '@angular/common';

interface SettingsNavSection {
  id: string;
  label: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-settings-sidenav',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings-sidenav.html',
  styleUrl: './settings-sidenav.css'
})
export class SettingsSidenavComponent {
  private viewportScroller = inject(ViewportScroller);

  readonly sections: SettingsNavSection[] = [
    {
      id: 'hyprland',
      label: 'Hyprland',
      description: 'Compositor, monitors, input rules',
      icon: '🌀'
    },
    {
      id: 'waybar',
      label: 'Waybar',
      description: 'Status modules & indicators',
      icon: '📊'
    },
    {
      id: 'theme',
      label: 'Theme',
      description: 'Palettes, typography, tokens',
      icon: '🎨'
    }
  ];

  navigate(fragment: string) {
    this.viewportScroller.scrollToAnchor(fragment);
  }
}


