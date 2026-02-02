import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

export interface EnvironmentVar {
  key: string;
  value: string;
  export: boolean;
}

@Component({
  selector: 'app-env-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    MatSlideToggleModule
  ],
  template: `
    <mat-card class="editor-card">
      <div class="section-header">
        <h3>{{ title }}</h3>
        <button mat-stroked-button color="primary" (click)="addVariable()">
          <mat-icon>add</mat-icon>
          Add Variable
        </button>
      </div>

      <div class="env-list" *ngIf="variables.length > 0">
        <div class="env-item" *ngFor="let env of variables; let i = index">
          <mat-form-field appearance="outline" class="env-key">
            <mat-label>Variable Name</mat-label>
            <input matInput [(ngModel)]="env.key" (ngModelChange)="onChange()" placeholder="VARIABLE_NAME">
          </mat-form-field>

          <mat-form-field appearance="outline" class="env-value">
            <mat-label>Value</mat-label>
            <input matInput [(ngModel)]="env.value" (ngModelChange)="onChange()" placeholder="value">
          </mat-form-field>

          <mat-slide-toggle
            *ngIf="showExport"
            [(ngModel)]="env.export"
            (ngModelChange)="onChange()"
            color="primary"
            matTooltip="Export to child processes">
            Export
          </mat-slide-toggle>

          <button mat-icon-button color="warn" (click)="removeVariable(i)" matTooltip="Remove variable">
            <mat-icon>delete</mat-icon>
          </button>
        </div>
      </div>

      <p class="empty-message" *ngIf="variables.length === 0">
        No environment variables defined. Click "Add Variable" to create one.
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

    .env-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .env-item {
      display: grid;
      grid-template-columns: 200px 1fr auto auto;
      gap: 12px;
      align-items: center;
    }

    .env-key {
      min-width: 180px;
    }

    .env-value {
      flex: 1;
    }

    mat-form-field {
      width: 100%;
    }

    mat-slide-toggle {
      margin: 0 8px;
    }

    .empty-message {
      color: var(--vp-c-text-2);
      font-style: italic;
      text-align: center;
      padding: 20px;
      margin: 0;
    }

    @media (max-width: 768px) {
      .env-item {
        grid-template-columns: 1fr;
        gap: 8px;
      }

      mat-slide-toggle {
        margin: 8px 0;
      }
    }
  `]
})
export class EnvEditorComponent {
  @Input() variables: EnvironmentVar[] = [];
  @Input() title = 'Environment Variables';
  @Input() showExport = true;
  @Output() variablesChange = new EventEmitter<EnvironmentVar[]>();
  @Output() configChanged = new EventEmitter<void>();

  addVariable(): void {
    this.variables = [...this.variables, { key: '', value: '', export: true }];
    this.variablesChange.emit(this.variables);
    this.configChanged.emit();
  }

  removeVariable(index: number): void {
    this.variables = this.variables.filter((_, i) => i !== index);
    this.variablesChange.emit(this.variables);
    this.configChanged.emit();
  }

  onChange(): void {
    this.variablesChange.emit(this.variables);
    this.configChanged.emit();
  }
}
