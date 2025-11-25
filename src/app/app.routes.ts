import { Routes } from '@angular/router';
import { DocViewerComponent } from './features/docs/ui/doc-viewer/doc-viewer';
import { DocsPageComponent } from './features/docs/docs.page';
import { KeybindingsComponent } from './features/docs/pages/keybindings/keybindings';
import { LandingComponent } from './features/landing/landing';
import { NotFoundComponent } from './features/not-found/not-found';
import { SettingsPageComponent } from './features/settings/settings.page';
import { DocsShellComponent } from './shared/layouts/docs-layout/docs.layout';
import { SettingsShellComponent } from './shared/layouts/settings-layout/settings.layout';

export const routes: Routes = [
  // Landing page (no shell/layout)
  { path: '', component: LandingComponent },
  
  // Settings module with dedicated layout
  {
    path: 'settings',
    component: SettingsShellComponent,
    children: [{ path: '', component: SettingsPageComponent }]
  },
  
  // Docs module with dedicated layout
  {
    path: 'docs',
    component: DocsShellComponent,
    children: [
      { path: '', component: DocsPageComponent },
      { path: ':id', component: DocViewerComponent }
    ]
  },
  
  // Keybindings under docs layout
  {
    path: 'keybindings',
    component: DocsShellComponent,
    children: [{ path: '', component: KeybindingsComponent }]
  },
  
  // 404 fallback
  { path: '**', component: NotFoundComponent }
];
