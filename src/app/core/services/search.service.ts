import { Injectable, signal, inject } from '@angular/core';
import { ContentService, DocEntry } from './content.service';

export interface SearchResult {
  title: string;
  path: any[] | string;
  category: string;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private contentService = inject(ContentService);
  private index = signal<SearchResult[]>([
    { title: 'Keybindings', path: '/keybindings', category: 'Tools' }
  ]);
  private initialized = false;

  constructor() {
    this.loadDocIndex();
  }

  search(query: string): SearchResult[] {
    if (!query.trim()) {
      return [];
    }

    if (!this.initialized) {
      this.loadDocIndex();
    }

    const lowerQuery = query.toLowerCase();
    return this.index().filter(item =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.category.toLowerCase().includes(lowerQuery)
    );
  }

  private async loadDocIndex() {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    try {
      const docs = await this.contentService.listDocs();
      const docResults = docs.map(doc => this.toSearchResult(doc));
      this.index.set(this.mergeStaticEntries(docResults));
    } catch (error) {
      console.error('Failed to build search index from docs', error);
    }
  }

  private toSearchResult(doc: DocEntry): SearchResult {
    return {
      title: doc.title,
      path: ['/docs', doc.path],
      category: doc.category
    };
  }

  private mergeStaticEntries(dynamicEntries: SearchResult[]): SearchResult[] {
    const staticEntries = this.index().filter(entry => entry.path === '/keybindings');
    return [...dynamicEntries, ...staticEntries].sort((a, b) => a.title.localeCompare(b.title));
  }
}

