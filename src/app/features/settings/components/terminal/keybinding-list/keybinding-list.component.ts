import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface TerminalKeybinding {
  key: string;
  action: string;
  description?: string;
  flags?: string;
}

@Component({
  selector: 'app-keybinding-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <mat-card class="editor-card">
      <div class="section-header">
        <h3>{{ title }}</h3>
        <button mat-stroked-button color="primary" (click)="addKeybinding()">
          <mat-icon>add</mat-icon>
          Add Keybinding
        </button>
      </div>

      <div class="keybinding-list" *ngIf="keybindings.length > 0">
        <div class="keybinding-item" *ngFor="let kb of keybindings; let i = index">
          <mat-form-field appearance="outline" class="kb-key">
            <mat-label>{{ keyLabel }}</mat-label>
            <input matInput [(ngModel)]="kb.key" (ngModelChange)="onChange()" [placeholder]="keyPlaceholder">
          </mat-form-field>

          <mat-form-field appearance="outline" class="kb-action">
            <mat-label>{{ actionLabel }}</mat-label>
            <input matInput [(ngModel)]="kb.action" (ngModelChange)="onChange()" [placeholder]="actionPlaceholder">
          </mat-form-field>

          <mat-form-field appearance="outline" class="kb-description" *ngIf="showDescription">
            <mat-label>Description</mat-label>
            <input matInput [(ngModel)]="kb.description" (ngModelChange)="onChange()" placeholder="Optional">
          </mat-form-field>

          <button mat-icon-button color="warn" (click)="removeKeybinding(i)" matTooltip="Remove keybinding">
            <mat-icon>delete</mat-icon>
          </button>
        </div>
      </div>

      <p class="empty-message" *ngIf="keybindings.length === 0">
        No keybindings defined. Click "Add Keybinding" to create one.
      </p>
    </mat-card>
  `,
  styles: [`
    .editor-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      padding: 24px;
      border-radius: 16px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h3 {
        margin: 0;
        color: var(--vp-c-text-1);
        font-size: 1.2rem;
        font-weight: 600;
      }
    }

    .keybinding-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .keybinding-item {
      display: grid;
      grid-template-columns: 180px 1fr auto;
      gap: 12px;
      align-items: flex-start;

      &.with-description {
        grid-template-columns: 180px 1fr 200px auto;
      }
    }

    .kb-key {
      min-width: 160px;
    }

    .kb-action {
      flex: 1;
    }

    .kb-description {
      min-width: 180px;
    }

    mat-form-field {
      width: 100%;
    }

    .empty-message {
      color: var(--vp-c-text-2);
      font-style: italic;
      text-align: center;
      padding: 20px;
      margin: 0;
    }

    @media (max-width: 768px) {
      .keybinding-item {
        grid-template-columns: 1fr;
        gap: 8px;

        &.with-description {
          grid-template-columns: 1fr;
        }
      }
    }
  `]
})
export class KeybindingListComponent {
  @Input() keybindings: TerminalKeybinding[] = [];
  @Input() title = 'Keybindings';
  @Input() keyLabel = 'Key';
  @Input() actionLabel = 'Action';
  @Input() keyPlaceholder = 'ctrl+a';
  @Input() actionPlaceholder = 'command';
  @Input() showDescription = false;
  @Output() keybindingsChange = new EventEmitter<TerminalKeybinding[]>();
  @Output() configChanged = new EventEmitter<void>();

  addKeybinding(): void {
    this.keybindings = [...this.keybindings, { key: '', action: '' }];
    this.keybindingsChange.emit(this.keybindings);
    this.configChanged.emit();
  }

  removeKeybinding(index: number): void {
    this.keybindings = this.keybindings.filter((_, i) => i !== index);
    this.keybindingsChange.emit(this.keybindings);
    this.configChanged.emit();
  }

  onChange(): void {
    this.keybindingsChange.emit(this.keybindings);
    this.configChanged.emit();
  }
}
