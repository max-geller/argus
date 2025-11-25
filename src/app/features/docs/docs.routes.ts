import { Routes } from '@angular/router';
import { DocsPageComponent } from './docs.page';
import { DocViewerComponent } from './ui/doc-viewer/doc-viewer';
import { KeybindingsComponent } from './pages/keybindings/keybindings';

export const DOCS_ROUTES: Routes = [
  { path: '', component: DocsPageComponent },
  { path: 'keybindings', component: KeybindingsComponent },
  { path: ':id', component: DocViewerComponent }
];

