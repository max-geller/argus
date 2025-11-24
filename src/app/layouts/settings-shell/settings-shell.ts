import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SettingsSidenavComponent } from '../../features/settings/settings-sidenav/settings-sidenav';

@Component({
  selector: 'app-settings-shell',
  standalone: true,
  templateUrl: './settings-shell.html',
  styleUrl: './settings-shell.css',
  imports: [CommonModule, RouterLink, RouterOutlet, SettingsSidenavComponent]
})
export class SettingsShellComponent {}


