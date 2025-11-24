import { Routes } from '@angular/router';
import { DocViewerComponent } from './features/docs/doc-viewer/doc-viewer';
import { KeybindingsComponent } from './features/keybindings/keybindings/keybindings';

export const routes: Routes = [
  { path: '', redirectTo: 'keybindings', pathMatch: 'full' },
  { path: 'docs/:id', component: DocViewerComponent },
  { path: 'keybindings', component: KeybindingsComponent },
];
