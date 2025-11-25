import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Keybinding, KeybindingCategory } from '@core/services/config/hyprland.service';
import { KeybindingDialogComponent } from '../keybinding-dialog/keybinding-dialog.component';

@Component({
  selector: 'app-keybinding-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatDialogModule
  ],
  templateUrl: './keybinding-editor.component.html',
  styleUrl: './keybinding-editor.component.scss'
})
export class KeybindingEditorComponent {
  @Input() keybindings: Keybinding[] = [];
  @Output() keybindingsChange = new EventEmitter<Keybinding[]>();
  @Output() configChanged = new EventEmitter<void>();

  searchTerm = signal('');
  selectedCategory = signal<KeybindingCategory | 'all'>('all');

  categories: { value: KeybindingCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'All Keybindings' },
    { value: 'applications', label: 'Applications' },
    { value: 'window-management', label: 'Window Management' },
    { value: 'workspaces', label: 'Workspaces' },
    { value: 'focus', label: 'Focus' },
    { value: 'media', label: 'Media Keys' },
    { value: 'mouse', label: 'Mouse' },
    { value: 'system', label: 'System' },
    { value: 'custom', label: 'Custom' }
  ];

  filteredKeybindings = computed(() => {
    let bindings = this.keybindings;

    // Filter by category
    const category = this.selectedCategory();
    if (category !== 'all') {
      bindings = bindings.filter(kb => kb.category === category);
    }

    // Filter by search term
    const term = this.searchTerm().toLowerCase();
    if (term) {
      bindings = bindings.filter(kb =>
        kb.key.toLowerCase().includes(term) ||
        kb.action.toLowerCase().includes(term) ||
        kb.params.toLowerCase().includes(term) ||
        kb.modifiers.some(m => m.toLowerCase().includes(term)) ||
        (kb.description && kb.description.toLowerCase().includes(term))
      );
    }

    return bindings;
  });

  constructor(private dialog: MatDialog) {}

  getKeyCombo(kb: Keybinding): string {
    const mods = kb.modifiers.map(m => m === '$mainMod' ? 'Super' : m);
    return [...mods, kb.key].join(' + ');
  }

  getActionDisplay(kb: Keybinding): string {
    if (kb.action === 'exec') {
      return `Launch: ${kb.params}`;
    }
    if (kb.action === 'workspace') {
      return `Workspace ${kb.params}`;
    }
    if (kb.action === 'movetoworkspace') {
      return `Move to Workspace ${kb.params}`;
    }
    if (kb.action === 'movefocus') {
      const dirMap: Record<string, string> = { l: 'Left', r: 'Right', u: 'Up', d: 'Down' };
      return `Focus ${dirMap[kb.params] || kb.params}`;
    }
    return kb.action.replace(/([A-Z])/g, ' $1').trim();
  }

  addKeybinding() {
    const dialogRef = this.dialog.open(KeybindingDialogComponent, {
      width: '600px',
      data: {
        existingKeybindings: this.keybindings
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.keybindings.push(result as Keybinding);
        this.keybindingsChange.emit(this.keybindings);
        this.configChanged.emit();
      }
    });
  }

  editKeybinding(kb: Keybinding) {
    const dialogRef = this.dialog.open(KeybindingDialogComponent, {
      width: '600px',
      data: {
        keybinding: kb,
        existingKeybindings: this.keybindings
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const index = this.keybindings.findIndex(k => k.id === kb.id);
        if (index >= 0) {
          this.keybindings[index] = { ...this.keybindings[index], ...result };
          this.keybindingsChange.emit(this.keybindings);
          this.configChanged.emit();
        }
      }
    });
  }

  deleteKeybinding(kb: Keybinding) {
    if (confirm(`Delete keybinding: ${this.getKeyCombo(kb)}?`)) {
      const index = this.keybindings.findIndex(k => k.id === kb.id);
      if (index >= 0) {
        this.keybindings.splice(index, 1);
        this.keybindingsChange.emit(this.keybindings);
        this.configChanged.emit();
      }
    }
  }

  getCategoryLabel(category: KeybindingCategory): string {
    return this.categories.find(c => c.value === category)?.label || category;
  }
}



