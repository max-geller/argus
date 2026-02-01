import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ResticConfig } from '@core/models/restic.model';

@Component({
  selector: 'app-create-backup-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatChipsModule
  ],
  template: `
    <h2 mat-dialog-title>Create Backup</h2>

    <mat-dialog-content>
      <div class="section">
        <h3>Backup Name (Optional)</h3>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput [(ngModel)]="name" placeholder="e.g., Pre-upgrade backup">
          <mat-hint>This will be added as a tag for easy identification</mat-hint>
        </mat-form-field>
      </div>

      <div class="section" *ngIf="data.config">
        <h3>Paths to Backup</h3>
        <div class="paths-list">
          <div class="path-item" *ngFor="let path of data.config.backup.paths">
            <mat-icon>folder</mat-icon>
            <span>{{ path }}</span>
          </div>
        </div>
      </div>

      <div class="section" *ngIf="data.config">
        <h3>Tags</h3>
        <mat-chip-set>
          <mat-chip>manual</mat-chip>
          <mat-chip *ngIf="data.config.backup.tag">{{ data.config.backup.tag }}</mat-chip>
          <mat-chip *ngIf="name">name:{{ name }}</mat-chip>
        </mat-chip-set>
      </div>

      <div class="info-box" *ngIf="!hasPaths() && name">
        <mat-icon>info</mat-icon>
        <span>The backup name will be passed to your backup script via the ARGUS_BACKUP_NAME environment variable.</span>
      </div>

      <div class="preview" *ngIf="hasPaths()">
        <h4>Command Preview</h4>
        <code>restic backup --tag manual{{ getTagPart() }}{{ name ? ' --tag name:' + name : '' }} ...</code>
      </div>

      <div class="preview script-mode" *ngIf="!hasPaths() && data.config?.backup?.script">
        <h4>Using Backup Script</h4>
        <code>{{ data.config?.backup?.script }}</code>
        <p class="script-note">Script will use tags: manual, fedora{{ name ? ', name:' + name : '' }}</p>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="create()">
        <mat-icon>backup</mat-icon>
        Create Backup
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 450px;
    }

    .section {
      margin-bottom: 24px;

      h3 {
        margin: 0 0 12px;
        font-size: 1rem;
        font-weight: 600;
        color: var(--vp-c-text-1);
      }
    }

    .full-width {
      width: 100%;
    }

    .paths-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .path-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      font-family: monospace;
      font-size: 0.9rem;
      color: var(--vp-c-text-2);

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--vp-c-text-3);
      }
    }

    .preview {
      margin-top: 16px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 8px;

      h4 {
        margin: 0 0 8px;
        font-size: 0.85rem;
        color: var(--vp-c-text-2);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      code {
        font-size: 0.85rem;
        color: var(--vp-c-text-1);
        word-break: break-all;
      }
    }

    mat-dialog-actions button mat-icon {
      margin-right: 8px;
    }

    .info-box {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-top: 16px;
      padding: 12px;
      background: rgba(33, 150, 243, 0.1);
      border: 1px solid rgba(33, 150, 243, 0.2);
      border-radius: 8px;
      color: #2196f3;
      font-size: 0.85rem;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }
    }

    .script-mode {
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .script-note {
      margin: 8px 0 0;
      font-size: 0.8rem;
      color: var(--vp-c-text-3);
      font-style: italic;
    }
  `]
})
export class CreateBackupDialogComponent {
  name = '';

  constructor(
    public dialogRef: MatDialogRef<CreateBackupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { config: ResticConfig | null }
  ) {}

  create() {
    this.dialogRef.close({ name: this.name || undefined });
  }

  getTagPart(): string {
    if (this.data.config?.backup?.tag) {
      return ' --tag ' + this.data.config.backup.tag;
    }
    return '';
  }

  hasPaths(): boolean {
    return (this.data.config?.backup?.paths?.length ?? 0) > 0;
  }
}
