import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { SettingsSidenavComponent } from '../../../features/settings/settings-sidenav/settings-sidenav.component';
import { NavbarComponent } from '../../../shared/ui/navbar/navbar.component';

@Component({
  selector: 'app-settings-shell',
  standalone: true,
  templateUrl: './settings.layout.html',
  styleUrl: './settings.layout.scss',
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    SettingsSidenavComponent,
    NavbarComponent
  ]
})
export class SettingsShellComponent {}


