import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { SettingsSidenavComponent } from '../../features/settings/settings-sidenav/settings-sidenav';
import { NavbarComponent } from '../../core/components/navbar/navbar';

@Component({
  selector: 'app-settings-shell',
  standalone: true,
  templateUrl: './settings-shell.html',
  styleUrl: './settings-shell.css',
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    SettingsSidenavComponent,
    NavbarComponent
  ]
})
export class SettingsShellComponent {}


