import { Routes } from '@angular/router';
import { SettingsPageComponent } from './settings.page';
import { HyprlandPageComponent } from './pages/hyprland/hyprland.page';

export const SETTINGS_ROUTES: Routes = [
  { path: '', component: SettingsPageComponent },
  { path: 'hyprland', component: HyprlandPageComponent }
];

