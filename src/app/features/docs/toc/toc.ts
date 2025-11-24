import { Component, Input, OnChanges, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

export interface TocItem {
  id: string;
  title: string;
  level: number; // 2 or 3 (h2, h3)
  active?: boolean;
}

@Component({
  selector: 'app-toc',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toc.html',
  styleUrl: './toc.css'
})
export class TocComponent implements OnChanges, OnDestroy {
  @Input() content: string = '';
  @Input() host?: HTMLElement | null;
  toc: TocItem[] = [];
  private isBrowser: boolean;
  private observer?: IntersectionObserver;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnChanges() {
    this.parseToc();
    if (this.isBrowser) {
      // Small delay to let DOM render
      setTimeout(() => this.setupScrollSpy(), 100);
    }
  }

  ngOnDestroy(): void {
    this.disconnectObserver();
  }

  parseToc() {
    // Regex to find ## and ### headers
    const regex = /^(#{2,3})\s+(.+)$/gm;
    let match;
    const items: TocItem[] = [];

    while ((match = regex.exec(this.content)) !== null) {
      const level = match[1].length;
      const title = match[2].trim();
      // Generate simple slug
      const id = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      
      items.push({ id, title, level });
    }
    this.toc = items;
  }

  scrollTo(id: string) {
    if (!this.isBrowser) {
      return;
    }

    const element = this.queryHeading(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Manually set active state
      this.toc.forEach(i => (i.active = i.id === id));
    }
  }

  setupScrollSpy() {
    this.disconnectObserver();

    if (!this.isBrowser || !this.host || !this.toc.length) {
      return;
    }

    const headings = Array.from(this.host.querySelectorAll<HTMLElement>('h2[id], h3[id]'));
    if (!headings.length) {
      return;
    }

    this.observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top);

        const activeId = visible.length
          ? (visible[0].target as HTMLElement).id
          : this.findNearestHeadingAbove();

        if (activeId) {
          this.toc.forEach(item => (item.active = item.id === activeId));
        }
      },
      {
        root: null,
        rootMargin: '-120px 0px -60% 0px',
        threshold: [0, 0.25, 0.6, 1]
      }
    );

    headings.forEach(h => this.observer?.observe(h));
  }

  private disconnectObserver() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
  }

  private queryHeading(id: string): HTMLElement | null {
    if (!this.host) {
      return document.getElementById(id);
    }
    return this.host.querySelector<HTMLElement>(`#${id}`);
  }

  private findNearestHeadingAbove(): string | undefined {
    if (!this.host) {
      return undefined;
    }

    const headings = Array.from(this.host.querySelectorAll<HTMLElement>('h2[id], h3[id]'));
    const threshold = 140;
    let closest: { id: string; top: number } | undefined;

    headings.forEach(heading => {
      const top = heading.getBoundingClientRect().top;
      if (top <= threshold) {
        if (!closest || top > closest.top) {
          closest = { id: heading.id, top };
        }
      }
    });

    return closest?.id;
  }
}
