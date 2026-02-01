import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SnapshotDisplay, FileNode } from '@core/models/restic.model';

interface DialogData {
  snapshot: SnapshotDisplay;
  files: FileNode[];
}

@Component({
  selector: 'app-restore-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatCheckboxModule
  ],
  template: `
    <h2 mat-dialog-title>Restore Files</h2>

    <mat-dialog-content>
      <div class="section">
        <h3>Source Snapshot</h3>
        <div class="snapshot-info">
          <code>{{ data.snapshot.shortId }}</code>
          <span>{{ data.snapshot.date | date:'medium' }}</span>
        </div>
      </div>

      <div class="section">
        <h3>Files to Restore ({{ data.files.length }})</h3>
        <div class="files-list">
          <div class="file-item" *ngFor="let file of data.files.slice(0, 5)">
            <mat-icon>{{ file.node_type === 'dir' ? 'folder' : 'insert_drive_file' }}</mat-icon>
            <span>{{ file.path }}</span>
          </div>
          <div class="more-files" *ngIf="data.files.length > 5">
            ... and {{ data.files.length - 5 }} more
          </div>
        </div>
      </div>

      <div class="section">
        <h3>Target Directory</h3>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Restore to</mat-label>
          <input matInput [(ngModel)]="targetDir" placeholder="/home/user/restored">
          <mat-hint>Files will be restored maintaining their directory structure</mat-hint>
        </mat-form-field>
      </div>

      <div class="section">
        <mat-checkbox [(ngModel)]="overwrite">
          Overwrite existing files
        </mat-checkbox>
      </div>

      <div class="warning" *ngIf="overwrite">
        <mat-icon>warning</mat-icon>
        <span>Existing files in the target directory will be overwritten!</span>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary"
              [disabled]="!targetDir"
              (click)="restore()">
        <mat-icon>restore</mat-icon>
        Restore Files
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 500px;
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

    .snapshot-info {
      display: flex;
      align-items: center;
      gap: 12px;

      code {
        font-family: monospace;
        padding: 4px 8px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
      }
    }

    .files-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 150px;
      overflow-y: auto;
    }

    .file-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 6px;
      font-family: monospace;
      font-size: 0.85rem;
      color: var(--vp-c-text-2);

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: var(--vp-c-text-3);
      }
    }

    .more-files {
      padding: 6px 10px;
      font-size: 0.85rem;
      color: var(--vp-c-text-3);
      font-style: italic;
    }

    .full-width {
      width: 100%;
    }

    .warning {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: rgba(245, 165, 36, 0.1);
      border: 1px solid rgba(245, 165, 36, 0.2);
      border-radius: 8px;
      color: #f5a524;
      font-size: 0.9rem;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    mat-dialog-actions button mat-icon {
      margin-right: 8px;
    }
  `]
})
export class RestoreDialogComponent {
  targetDir = '';
  overwrite = false;

  constructor(
    public dialogRef: MatDialogRef<RestoreDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  restore() {
    this.dialogRef.close({
      targetDir: this.targetDir,
      overwrite: this.overwrite
    });
  }
}
