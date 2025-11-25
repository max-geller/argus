import { Injectable } from '@angular/core';
import { DocEntry } from '../content.service';
import { NavGroup, NavItem } from '@shared/ui/sidenav/sidenav';

@Injectable({
  providedIn: 'root'
})
export class DocsConfigService {
  private readonly STORAGE_KEY = 'maxos_docs_order';
  private readonly DEFAULT_CATEGORY_ORDER = [
    'Introduction',
    'Guides',
    'Cheatsheets',
    'Configs',
    'Setup',
    'Widgets',
    'Tools',
    'General'
  ];

  constructor() {}

  getOrderedGroups(docs: DocEntry[]): NavGroup[] {
    // 1. Group docs by category
    const groupedDocs = new Map<string, NavItem[]>();
    
    // Initialize groups from raw docs
    docs.forEach(doc => {
      if (!groupedDocs.has(doc.category)) {
        groupedDocs.set(doc.category, []);
      }
      groupedDocs.get(doc.category)?.push({
        title: doc.title,
        path: ['/docs', doc.path]
      });
    });

    // Add static items if they exist in the original logic (DocsShellComponent)
    // We'll replicate the static items logic here or handle it by merging if passed in.
    // For now, let's add the known static Keybindings item if it's not there, 
    // but strictly speaking, the input `docs` usually comes from `listDocs` which might not have it.
    // However, `DocsShellComponent` added it manually. 
    // Let's ensure 'Tools' category exists for Keybindings if we want to be consistent,
    // or better, let the component handle static additions before calling this, 
    // OR handle it here. 
    // The plan says: "Handle merging new documents/categories with saved preferences."
    
    // Let's add the static Keybindings here to be safe as it's part of the "Docs" experience.
    if (!groupedDocs.has('Tools')) {
      groupedDocs.set('Tools', []);
    }
    // Check if Keybindings is already there to avoid dupes if passed in `docs` somehow
    const tools = groupedDocs.get('Tools')!;
    if (!tools.some(t => t.title === 'Keybindings')) {
       tools.push({ title: 'Keybindings', path: '/docs/keybindings' });
    }

    // 2. Load saved order
    const savedOrder = this.loadSavedOrder();

    // 3. Reconstruct groups based on saved order + new items
    const orderedGroups: NavGroup[] = [];
    const processedCategories = new Set<string>();

    if (savedOrder) {
      savedOrder.forEach(savedGroup => {
        if (groupedDocs.has(savedGroup.title)) {
          const currentItems = groupedDocs.get(savedGroup.title)!;
          const orderedItems: NavItem[] = [];
          const processedItems = new Set<string>();

          // Order items based on saved group items
          savedGroup.items.forEach(savedItem => {
            const found = currentItems.find(i => i.title === savedItem.title);
            if (found) {
              orderedItems.push(found);
              processedItems.add(found.title);
            }
          });

          // Append any new items that weren't in saved order
          currentItems.forEach(item => {
            if (!processedItems.has(item.title)) {
              orderedItems.push(item);
            }
          });

          // Sort new items alphabetically if they were just appended? 
          // Or just leave them at the end. Let's leave them at the end for now, 
          // or maybe sort the appended ones. 
          // Existing logic was "sort by title".
          // Let's sort the *remaining* items alphabetically before appending?
          // Actually, simplest is just append.

          orderedGroups.push({
            title: savedGroup.title,
            expanded: savedGroup.expanded, // Keep saved expansion state
            items: orderedItems
          });
          processedCategories.add(savedGroup.title);
        }
      });
    }

    // 4. Append any new categories not in saved order
    const remainingCategories = Array.from(groupedDocs.keys())
      .filter(c => !processedCategories.has(c));
    
    // Sort remaining categories by default order
    remainingCategories.sort((a, b) => {
      const indexA = this.DEFAULT_CATEGORY_ORDER.indexOf(a);
      const indexB = this.DEFAULT_CATEGORY_ORDER.indexOf(b);
      const valA = indexA === -1 ? 999 : indexA;
      const valB = indexB === -1 ? 999 : indexB;
      return valA - valB || a.localeCompare(b);
    });

    remainingCategories.forEach(category => {
      const items = groupedDocs.get(category)!;
      items.sort((a, b) => a.title.localeCompare(b.title)); // Default sort for new categories
      
      orderedGroups.push({
        title: category,
        expanded: category === 'Introduction', // Default expansion
        items: items
      });
    });

    return orderedGroups;
  }

  saveOrder(groups: NavGroup[]) {
    // We only need to save the structure: title, expanded, and list of item titles
    // We don't strictly need paths in localStorage, but saving the whole object is fine 
    // if we clean it up or just use it as a schema.
    // Let's strip it down to minimal necessary info to avoid stale paths issues.
    const simplified = groups.map(g => ({
      title: g.title,
      expanded: g.expanded,
      items: g.items.map(i => ({ title: i.title }))
    }));
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(simplified));
  }

  private loadSavedOrder(): { title: string, expanded: boolean, items: { title: string }[] }[] | null {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved docs order', e);
      return null;
    }
  }
}

