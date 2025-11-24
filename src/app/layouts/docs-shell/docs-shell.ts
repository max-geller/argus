import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { CommonModule } from '@angular/common';
import { SidenavComponent } from '../../core/components/sidenav/sidenav';
import { NavbarComponent } from '../../core/components/navbar/navbar';

@Component({
  selector: 'app-docs-shell',
  standalone: true,
  templateUrl: './docs-shell.html',
  styleUrl: './docs-shell.css',
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    SidenavComponent,
    NavbarComponent
  ]
})
export class DocsShellComponent {}


