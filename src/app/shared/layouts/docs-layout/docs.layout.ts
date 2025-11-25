import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { CommonModule } from '@angular/common';
import { SidenavComponent, SidenavConfig, NavGroup } from '@shared/ui/sidenav/sidenav';
import { NavbarComponent } from '@shared/ui/navbar/navbar';
import { ContentService, DocEntry } from '@core/services/content.service';

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
  private readonly categoryOrder = ['Guides', 'Cheatsheets', 'Configs', 'Setup', 'Widgets', 'Tools', 'General'];

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
      this.sidenavConfig.groups = this.buildGroups(docs);
    } catch (error) {
      console.error('Failed to load docs for navigation', error);
      this.sidenavConfig.groups = this.buildGroups([]);
    }
  }

  private buildGroups(docs: DocEntry[]): NavGroup[] {
    const grouped = new Map<string, any[]>();

    docs.forEach(doc => {
      const path: any[] = ['/docs', doc.path];
      if (!grouped.has(doc.category)) {
        grouped.set(doc.category, []);
      }
      grouped.get(doc.category)?.push({ title: doc.title, path });
    });

    this.appendStaticItems(grouped);

    return Array.from(grouped.entries())
      .map(([title, items]) => ({
        title,
        expanded: true,
        items: items.sort((a, b) => a.title.localeCompare(b.title))
      }))
      .sort((a, b) => {
        const diff = this.categorySortValue(a.title) - this.categorySortValue(b.title);
        return diff !== 0 ? diff : a.title.localeCompare(b.title);
      });
  }

  private appendStaticItems(grouped: Map<string, any[]>) {
    const extras: Record<string, any[]> = {
      Configs: [
        {
          title: 'Settings Hub',
          path: '/settings'
        }
      ],
      Tools: [
        {
          title: 'Keybindings',
          path: '/keybindings'
        }
      ]
    };

    Object.entries(extras).forEach(([category, items]) => {
      const existing = grouped.get(category) ?? [];
      grouped.set(category, [...existing, ...items]);
    });
  }

  private categorySortValue(title: string): number {
    const index = this.categoryOrder.indexOf(title);
    return index === -1 ? this.categoryOrder.length : index;
  }
}


