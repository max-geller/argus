import { Routes } from '@angular/router';
import { SettingsPageComponent } from './settings.page';
import { HyprlandPageComponent } from './pages/hyprland/hyprland.page';
import { ManageDocsComponent } from './pages/manage-docs/manage-docs.component';

export const SETTINGS_ROUTES: Routes = [
  { path: '', component: SettingsPageComponent },
  { path: 'hyprland', component: HyprlandPageComponent },
  { path: 'documentation', component: ManageDocsComponent }
];

