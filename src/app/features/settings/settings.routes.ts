import { Routes } from '@angular/router';
import { SettingsPageComponent } from './settings.page';
import { HyprlandPageComponent } from './pages/hyprland/hyprland.page';
import { ManageDocsComponent } from './pages/manage-docs/manage-docs.component';
import { ResticPageComponent } from './pages/restic/restic.page';
import { KittyPageComponent } from './pages/terminal/kitty/kitty.page';
import { StarshipPageComponent } from './pages/terminal/starship/starship.page';
import { ZshPageComponent } from './pages/terminal/zsh/zsh.page';
import { BashPageComponent } from './pages/terminal/bash/bash.page';
import { TmuxPageComponent } from './pages/terminal/tmux/tmux.page';
// Theme pages
import { HyprpaperPageComponent } from './pages/theme/hyprpaper/hyprpaper.page';
import { GalleryPageComponent } from './pages/theme/gallery/gallery.page';
import { EditorPageComponent } from './pages/theme/editor/editor.page';
import { SchedulePageComponent } from './pages/theme/schedule/schedule.page';

export const SETTINGS_ROUTES: Routes = [
  { path: '', component: SettingsPageComponent },
  { path: 'hyprland', component: HyprlandPageComponent },
  { path: 'documentation', component: ManageDocsComponent },
  { path: 'restic', component: ResticPageComponent },
  // Terminal configuration routes
  { path: 'terminal/kitty', component: KittyPageComponent },
  { path: 'terminal/starship', component: StarshipPageComponent },
  { path: 'terminal/zsh', component: ZshPageComponent },
  { path: 'terminal/bash', component: BashPageComponent },
  { path: 'terminal/tmux', component: TmuxPageComponent },
  // Theme configuration routes
  { path: 'theme/hyprpaper', component: HyprpaperPageComponent },
  { path: 'theme/gallery', component: GalleryPageComponent },
  { path: 'theme/editor', component: EditorPageComponent },
  { path: 'theme/schedule', component: SchedulePageComponent }
];

