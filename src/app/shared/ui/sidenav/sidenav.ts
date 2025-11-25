import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

export interface NavItem {
  title: string;
  path?: any[] | string;
  fragment?: string;
  icon?: string;
}

export interface NavGroup {
  title: string;
  expanded: boolean;
  items: NavItem[];
}

export interface SidenavConfig {
  brandText: string;
  brandLink: string;
  groups: NavGroup[];
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
      transition('collapsed <=> expanded', [animate('200ms ease-in-out')])
    ])
  ]
})
export class SidenavComponent {
  @Input() config!: SidenavConfig;
  @Output() itemClick = new EventEmitter<NavItem>();

  constructor(
    private router: Router,
    private viewportScroller: ViewportScroller
  ) {}

  toggleGroup(group: NavGroup) {
    group.expanded = !group.expanded;
  }

  async handleItemClick(item: NavItem, event?: Event) {
    // If item has a click handler requirement (fragment-based), emit event
    if (item.fragment) {
      event?.preventDefault();
      this.itemClick.emit(item);
      
      // Handle fragment navigation
      if (item.path) {
        await this.router.navigate(
          Array.isArray(item.path) ? item.path : [item.path],
          { fragment: item.fragment }
        );
      }
      
      setTimeout(() => {
        if (item.fragment) {
          this.viewportScroller.scrollToAnchor(item.fragment);
        }
      }, 0);
    } else if (item.path) {
      // Regular navigation via routerLink will handle this
      // Only programmatic navigation if explicitly needed
      this.itemClick.emit(item);
    }
  }

  isRouterLink(item: NavItem): boolean {
    return !!item.path && !item.fragment;
  }
}

