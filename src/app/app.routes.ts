import { Routes } from '@angular/router';
import { DocViewerComponent } from './features/docs/ui/doc-viewer/doc-viewer';
import { KeybindingsComponent } from './features/docs/pages/keybindings/keybindings';
import { LandingComponent } from './features/landing/landing/landing';
import { NotFoundComponent } from './features/not-found/not-found/not-found';
import { SettingsComponent } from '@features/settings/settings';
import { DocsShellComponent } from './shared/layouts/docs-layout/docs.layout';
import { SettingsShellComponent } from './shared/layouts/settings-layout/settings.layout';

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
