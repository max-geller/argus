import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface ShellAlias {
  name: string;
  command: string;
  description?: string;
}

@Component({
  selector: 'app-alias-editor',
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
        <button mat-stroked-button color="primary" (click)="addAlias()">
          <mat-icon>add</mat-icon>
          Add Alias
        </button>
      </div>

      <div class="alias-list" *ngIf="aliases.length > 0">
        <div class="alias-item" *ngFor="let alias of aliases; let i = index">
          <mat-form-field appearance="outline" class="alias-name">
            <mat-label>Name</mat-label>
            <input matInput [(ngModel)]="alias.name" (ngModelChange)="onChange()" placeholder="alias_name">
          </mat-form-field>

          <mat-form-field appearance="outline" class="alias-command">
            <mat-label>Command</mat-label>
            <input matInput [(ngModel)]="alias.command" (ngModelChange)="onChange()" placeholder="command --with-args">
          </mat-form-field>

          <mat-form-field appearance="outline" class="alias-description" *ngIf="showDescription">
            <mat-label>Description</mat-label>
            <input matInput [(ngModel)]="alias.description" (ngModelChange)="onChange()" placeholder="Optional description">
          </mat-form-field>

          <button mat-icon-button color="warn" (click)="removeAlias(i)" matTooltip="Remove alias">
            <mat-icon>delete</mat-icon>
          </button>
        </div>
      </div>

      <p class="empty-message" *ngIf="aliases.length === 0">
        No aliases defined. Click "Add Alias" to create one.
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

    .alias-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .alias-item {
      display: grid;
      grid-template-columns: 150px 1fr auto;
      gap: 12px;
      align-items: flex-start;

      &.with-description {
        grid-template-columns: 150px 1fr 200px auto;
      }
    }

    .alias-name {
      min-width: 120px;
    }

    .alias-command {
      flex: 1;
    }

    .alias-description {
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
      .alias-item {
        grid-template-columns: 1fr;
        gap: 8px;

        &.with-description {
          grid-template-columns: 1fr;
        }
      }
    }
  `]
})
export class AliasEditorComponent {
  @Input() aliases: ShellAlias[] = [];
  @Input() title = 'Aliases';
  @Input() showDescription = false;
  @Output() aliasesChange = new EventEmitter<ShellAlias[]>();
  @Output() configChanged = new EventEmitter<void>();

  addAlias(): void {
    this.aliases = [...this.aliases, { name: '', command: '' }];
    this.aliasesChange.emit(this.aliases);
    this.configChanged.emit();
  }

  removeAlias(index: number): void {
    this.aliases = this.aliases.filter((_, i) => i !== index);
    this.aliasesChange.emit(this.aliases);
    this.configChanged.emit();
  }

  onChange(): void {
    this.aliasesChange.emit(this.aliases);
    this.configChanged.emit();
  }
}
