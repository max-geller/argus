import { Injectable } from '@angular/core';
import { TauriService } from './tauri.service';

export interface DocEntry {
  title: string;
  path: string;
  category: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private docsCache?: DocEntry[];

  constructor(private tauriService: TauriService) {}

  async getContent(path: string): Promise<string> {
    return this.tauriService.invoke<string>('get_content', { path });
  }

  async listDocs(forceRefresh = false): Promise<DocEntry[]> {
    if (this.docsCache && !forceRefresh) {
      return this.docsCache;
    }

    try {
      this.docsCache = await this.tauriService.invoke<DocEntry[]>('list_docs');
    } catch (error) {
      console.error('Failed to load documentation index', error);
      this.docsCache = [];
    }

    return this.docsCache;
  }
}

