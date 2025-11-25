import { Component, HostListener, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ThemeService } from '../../../core/services/theme.service';
import { SearchDialogComponent } from './search-dialog/search-dialog';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, MatDialogModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent {
  @Input() sidenav!: MatSidenav;
  themeService = inject(ThemeService);
  private dialog = inject(MatDialog);

  @HostListener('window:keydown', ['$event'])
  handleGlobalShortcut(event: KeyboardEvent) {
    const isCmdK = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
    if (isCmdK) {
      event.preventDefault();
      this.openSearchDialog();
    }
  }

  openSearchDialog() {
    this.dialog.open(SearchDialogComponent, {
      panelClass: 'search-dialog-panel',
      autoFocus: false
    });
  }
}
