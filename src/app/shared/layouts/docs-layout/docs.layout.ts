import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { CommonModule } from '@angular/common';
import { SidenavComponent, SidenavConfig } from '@shared/ui/sidenav/sidenav';
import { NavbarComponent } from '@shared/ui/navbar/navbar';
import { ContentService } from '@core/services/content.service';
import { DocsConfigService } from '@core/services/config/docs-config.service';

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
export class DocsShellComponent implements OnInit {
  private contentService = inject(ContentService);
  private docsConfigService = inject(DocsConfigService);

  sidenavConfig: SidenavConfig = {
    brandText: 'MaxOS Guide',
    brandLink: '/',
    groups: []
  };

  ngOnInit() {
    this.loadDocsNav();
  }

  private async loadDocsNav() {
    try {
      const docs = await this.contentService.listDocs();
      this.sidenavConfig.groups = this.docsConfigService.getOrderedGroups(docs);
    } catch (error) {
      console.error('Failed to load docs for navigation', error);
      this.sidenavConfig.groups = this.docsConfigService.getOrderedGroups([]);
    }
  }
}
