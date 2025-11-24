import { Component, Input, OnChanges, Inject, PLATFORM_ID } from '@angular/core';
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
export class TocComponent implements OnChanges {
  @Input() content: string = '';
  toc: TocItem[] = [];
  private isBrowser: boolean;

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
    const element = document.getElementById(id);
    if (element) {
      // Offset for sticky header
      const y = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
      
      // Manually set active state
      this.toc.forEach(i => i.active = false);
      const item = this.toc.find(i => i.id === id);
      if (item) item.active = true;
    }
  }

  setupScrollSpy() {
    // Basic IntersectionObserver logic could go here
    // For now, let's stick to the manual active state on click
    // implementing a full scroll spy requires tracking all headers
  }
}
