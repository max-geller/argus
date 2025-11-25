import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { SettingsSidenavComponent } from '@shared/layouts/settings-layout/settings-sidenav/settings-sidenav';
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
    SettingsSidenavComponent,
    NavbarComponent
  ]
})
export class SettingsShellComponent {}


