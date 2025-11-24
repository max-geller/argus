import { Routes } from '@angular/router';
import { DocViewerComponent } from './features/docs/doc-viewer/doc-viewer';
import { KeybindingsComponent } from './features/keybindings/keybindings/keybindings';
import { LandingComponent } from './features/landing/landing/landing';
import { NotFoundComponent } from './features/not-found/not-found/not-found';
import { SettingsComponent } from './features/settings/settings/settings';
import { DocsShellComponent } from './layouts/docs-shell/docs-shell';
import { SettingsShellComponent } from './layouts/settings-shell/settings-shell';

export const routes: Routes = [
  {
    path: 'settings',
    component: SettingsShellComponent,
    children: [{ path: '', component: SettingsComponent }]
  },
  {
    path: '',
    component: DocsShellComponent,
    children: [
      { path: '', component: LandingComponent },
      { path: 'docs/:id', component: DocViewerComponent },
      { path: 'keybindings', component: KeybindingsComponent },
      { path: '**', component: NotFoundComponent }
    ]
  }
];
