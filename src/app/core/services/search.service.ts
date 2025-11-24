import { Injectable, signal } from '@angular/core';

export interface SearchResult {
  title: string;
  path: any[] | string;
  category: string;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  // Simple mock index for now
  // In future, this could scan the assets/docs directory
  private index: SearchResult[] = [
    { title: 'Welcome', path: ['/docs', '/home/maxgeller/Code/Angular/Tauri/argus/src/assets/welcome.md'], category: 'Guides' },
    { title: 'Cheatsheet', path: ['/docs', '/home/maxgeller/Code/Angular/Tauri/argus/src/assets/cheatsheet.md'], category: 'Guides' },
    { title: 'Keybindings', path: '/keybindings', category: 'Tools' },
    // Add mock sub-headers for better search feel
    { title: 'Hyprland Shortcuts', path: ['/docs', '/home/maxgeller/Code/Angular/Tauri/argus/src/assets/cheatsheet.md'], category: 'Cheatsheet' },
    { title: 'Terminal Commands', path: ['/docs', '/home/maxgeller/Code/Angular/Tauri/argus/src/assets/cheatsheet.md'], category: 'Cheatsheet' },
  ];

  search(query: string): SearchResult[] {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return this.index.filter(item => 
      item.title.toLowerCase().includes(lowerQuery) || 
      item.category.toLowerCase().includes(lowerQuery)
    );
  }
}

