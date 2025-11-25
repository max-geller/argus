import { Component, HostListener, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ThemeService } from '@core/services/theme.service';
import { SearchDialogComponent } from './search-dialog/search-dialog';
import { TaskService } from '@core/services/task.service';
import { LayoutService } from '@core/services/layout.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatDialogModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent {
  @Input() sidenav?: MatSidenav;
  themeService = inject(ThemeService);
  taskService = inject(TaskService);
  layoutService = inject(LayoutService);
  private dialog = inject(MatDialog);

  @HostListener('window:keydown', ['$event'])
  handleGlobalShortcut(event: KeyboardEvent) {
    const isCmdK = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
    if (isCmdK) {
      event.preventDefault();
      this.openSearchDialog();
    }
  }

  toggleSidenav() {
    if (this.sidenav) {
      this.sidenav.toggle();
    }
  }

  openSearchDialog() {
    this.dialog.open(SearchDialogComponent, {
      panelClass: 'search-dialog-panel',
      autoFocus: false
    });
  }
}
