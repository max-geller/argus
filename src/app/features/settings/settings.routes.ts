import { Routes } from '@angular/router';
import { SettingsPageComponent } from './settings.page';
import { HyprlandPageComponent } from './pages/hyprland/hyprland.page';
import { ManageDocsComponent } from './pages/manage-docs/manage-docs.component';
import { ResticPageComponent } from './pages/restic/restic.page';

export const SETTINGS_ROUTES: Routes = [
  { path: '', component: SettingsPageComponent },
  { path: 'hyprland', component: HyprlandPageComponent },
  { path: 'documentation', component: ManageDocsComponent },
  { path: 'restic', component: ResticPageComponent }
];

