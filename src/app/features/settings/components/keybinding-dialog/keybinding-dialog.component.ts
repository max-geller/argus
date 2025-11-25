import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { Keybinding, KeybindingType } from '@core/services/config/hyprland.service';
import { HYPRLAND_MODIFIERS, getAllKeys, WINDOW_ACTIONS, WORKSPACE_ACTIONS, FOCUS_ACTIONS } from '@core/constants/hyprland-keys';

export interface KeybindingDialogData {
  keybinding?: Keybinding;
  existingKeybindings: Keybinding[];
}

@Component({
  selector: 'app-keybinding-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule
  ],
  templateUrl: './keybinding-dialog.component.html',
  styleUrl: './keybinding-dialog.component.scss'
})
export class KeybindingDialogComponent {
  readonly modifiers = HYPRLAND_MODIFIERS;
  readonly allKeys = getAllKeys();
  readonly windowActions = WINDOW_ACTIONS;
  readonly workspaceActions = WORKSPACE_ACTIONS;
  readonly focusActions = FOCUS_ACTIONS;

  // Form state
  selectedModifiers = signal<Set<string>>(new Set());
  selectedKey = signal<string>('');
  bindingType = signal<KeybindingType>('bind');
  actionType = signal<'exec' | 'window' | 'workspace' | 'focus' | 'custom'>('exec');
  actionValue = signal<string>('');
  actionParams = signal<string>('');
  description = signal<string>('');
  
  searchTerm = signal<string>('');
  conflictWarning = signal<string | null>(null);

  constructor(
    public dialogRef: MatDialogRef<KeybindingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: KeybindingDialogData
  ) {
    if (data.keybinding) {
      this.loadKeybinding(data.keybinding);
    }
  }

  private loadKeybinding(kb: Keybinding) {
    this.selectedModifiers.set(new Set(kb.modifiers));
    this.selectedKey.set(kb.key);
    this.bindingType.set(kb.type);
    this.actionParams.set(kb.params);
    this.description.set(kb.description || '');

    // Determine action type
    if (kb.action === 'exec') {
      this.actionType.set('exec');
    } else if (WINDOW_ACTIONS.some(a => a.value === kb.action)) {
      this.actionType.set('window');
      this.actionValue.set(kb.action);
    } else if (kb.action === 'workspace' || kb.action === 'movetoworkspace') {
      this.actionType.set('workspace');
      this.actionValue.set(kb.action);
    } else if (kb.action === 'movefocus') {
      this.actionType.set('focus');
      this.actionValue.set(kb.action);
    } else {
      this.actionType.set('custom');
      this.actionValue.set(kb.action);
    }
  }

  toggleModifier(mod: string) {
    const mods = this.selectedModifiers();
    if (mods.has(mod)) {
      mods.delete(mod);
    } else {
      mods.add(mod);
    }
    this.selectedModifiers.set(new Set(mods));
    this.checkConflicts();
  }

  onKeyChange() {
    this.checkConflicts();
  }

  checkConflicts() {
    const combo = this.getKeyCombo();
    const conflict = this.data.existingKeybindings.find(kb => {
      if (this.data.keybinding && kb.id === this.data.keybinding.id) return false;
      const kbCombo = this.getKeybindingCombo(kb);
      return kbCombo === combo;
    });

    if (conflict) {
      this.conflictWarning.set(`Conflicts with: ${conflict.action} ${conflict.params}`);
    } else {
      this.conflictWarning.set(null);
    }
  }

  private getKeybindingCombo(kb: Keybinding): string {
    return [...kb.modifiers.sort(), kb.key].join(' + ');
  }

  getKeyCombo(): string {
    const mods = Array.from(this.selectedModifiers()).sort();
    const key = this.selectedKey();
    if (!key) return 'Select a key...';
    return [...mods, key].join(' + ');
  }

  get filteredKeys() {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.allKeys;
    return this.allKeys.filter(k => 
      k.value.toLowerCase().includes(term) ||
      k.label.toLowerCase().includes(term)
    );
  }

  getKeysByCategory(category: string) {
    return this.filteredKeys.filter(k => k.category === category);
  }

  onSave() {
    if (!this.selectedKey()) {
      return;
    }

    let action = '';
    let params = '';

    switch (this.actionType()) {
      case 'exec':
        action = 'exec';
        params = this.actionParams();
        break;
      case 'window':
        action = this.actionValue();
        params = '';
        break;
      case 'workspace':
        action = this.actionValue();
        params = this.actionParams();
        break;
      case 'focus':
        action = this.actionValue();
        params = this.actionParams();
        break;
      case 'custom':
        action = this.actionValue();
        params = this.actionParams();
        break;
    }

    const keybinding: Partial<Keybinding> = {
      id: this.data.keybinding?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: this.bindingType(),
      modifiers: Array.from(this.selectedModifiers()),
      key: this.selectedKey(),
      action,
      params,
      description: this.description(),
      originalLine: '' // Will be generated by stringifier
    };

    this.dialogRef.close(keybinding);
  }

  onCancel() {
    this.dialogRef.close();
  }
}

