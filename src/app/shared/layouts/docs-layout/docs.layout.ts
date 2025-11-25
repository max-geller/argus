import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { CommonModule } from '@angular/common';
import { SidenavComponent } from '@shared/ui/sidenav/sidenav.component';
import { NavbarComponent } from '@shared/ui/navbar/navbar.component';

@Component({
  selector: 'app-docs-shell',
  standalone: true,
  templateUrl: './docs.layout.html',
  styleUrl: './docs.layout.scss',
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    SidenavComponent,
    NavbarComponent
  ]
})
export class DocsShellComponent {}


