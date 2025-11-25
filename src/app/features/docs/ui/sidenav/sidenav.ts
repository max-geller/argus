import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ContentService, DocEntry } from '@core/services/content.service';

interface NavItem {
  title: string;
  path: any[] | string;
  icon?: string;
}

interface NavGroup {
  title: string;
  expanded: boolean;
  items: NavItem[];
}

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidenav.html',
  styleUrl: './sidenav.scss',
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0px', opacity: 0, overflow: 'hidden' })),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('collapsed <=> expanded', [
        animate('200ms ease-in-out')
      ])
    ])
  ]
})
export class SidenavComponent implements OnInit {
  navGroups: NavGroup[] = [];
  private contentService = inject(ContentService);
  private readonly categoryOrder = ['Guides', 'Cheatsheets', 'Configs', 'Setup', 'Widgets', 'Tools', 'General'];

  ngOnInit() {
    this.navGroups = this.buildGroups([]);
    this.loadDynamicDocs();
  }

  toggleGroup(group: NavGroup) {
    group.expanded = !group.expanded;
  }

  private async loadDynamicDocs() {
    try {
      const docs = await this.contentService.listDocs();
      this.navGroups = this.buildGroups(docs);
    } catch (error) {
      console.error('Failed to load docs for navigation', error);
      this.navGroups = this.buildGroups([]);
    }
  }

  private buildGroups(docs: DocEntry[]): NavGroup[] {
    const grouped = new Map<string, NavItem[]>();

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

  private appendStaticItems(grouped: Map<string, NavItem[]>) {
    const extras: Record<string, NavItem[]> = {
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
