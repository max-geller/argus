import { Routes } from '@angular/router';
import { DocViewerComponent } from './features/docs/doc-viewer/doc-viewer';
import { KeybindingsComponent } from './features/keybindings/keybindings/keybindings';
import { LandingComponent } from './features/landing/landing/landing';
import { NotFoundComponent } from './features/not-found/not-found/not-found';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'docs/:id', component: DocViewerComponent },
  { path: 'keybindings', component: KeybindingsComponent },
  { path: '**', component: NotFoundComponent },
];
