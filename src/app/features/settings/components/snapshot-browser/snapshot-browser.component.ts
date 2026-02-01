import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SnapshotDisplay, FileNode, formatBytes } from '@core/models/restic.model';

interface Breadcrumb {
  label: string;
  path: string;
}

@Component({
  selector: 'app-snapshot-browser',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="browser-overlay">
      <div class="browser-container">
        <!-- Header -->
        <div class="browser-header">
          <div class="header-info">
            <h2>Browse Snapshot</h2>
            <p class="snapshot-meta">{{ snapshot.shortId }} - {{ snapshot.date | date:'medium' }}</p>
          </div>
          <button mat-icon-button (click)="close.emit()">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Breadcrumb Navigation -->
        <div class="breadcrumb-nav">
          <button *ngFor="let crumb of breadcrumbs; let last = last"
                  mat-button
                  [disabled]="last"
                  (click)="navigate.emit(crumb.path)">
            {{ crumb.label }}
            <mat-icon *ngIf="!last">chevron_right</mat-icon>
          </button>
        </div>

        <!-- File List -->
        <div class="file-list">
          <div class="file-item" *ngFor="let file of files"
               [class.selected]="isSelected(file)"
               (click)="onFileClick(file)">
            <mat-checkbox
              [checked]="isSelected(file)"
              (click)="$event.stopPropagation()"
              (change)="toggleFile(file)">
            </mat-checkbox>
            <mat-icon class="file-icon" [class.folder]="file.type === 'dir'">
              {{ file.type === 'dir' ? 'folder' : getFileIcon(file.name) }}
            </mat-icon>
            <span class="file-name">{{ file.name }}</span>
            <span class="file-size" *ngIf="file.size && file.type !== 'dir'">
              {{ formatBytes(file.size) }}
            </span>
          </div>

          <div class="empty-state" *ngIf="files.length === 0">
            <mat-icon>folder_open</mat-icon>
            <p>This directory is empty</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="browser-footer">
          <div class="selection-info">
            {{ selectedFiles.length }} item(s) selected
          </div>
          <div class="footer-actions">
            <button mat-stroked-button (click)="close.emit()">Cancel</button>
            <button mat-flat-button color="primary"
                    [disabled]="selectedFiles.length === 0"
                    (click)="restore.emit()">
              <mat-icon>restore</mat-icon>
              Restore Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .browser-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 40px;
    }

    .browser-container {
      width: 100%;
      max-width: 900px;
      max-height: 80vh;
      background: var(--vp-c-bg);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .browser-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 20px 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);

      h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--vp-c-text-1);
      }

      .snapshot-meta {
        margin: 4px 0 0;
        font-size: 0.9rem;
        color: var(--vp-c-text-2);
      }
    }

    .breadcrumb-nav {
      display: flex;
      align-items: center;
      padding: 12px 24px;
      background: rgba(255, 255, 255, 0.02);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      overflow-x: auto;

      button {
        display: flex;
        align-items: center;
        min-width: auto;
        padding: 4px 8px;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          margin-left: 4px;
        }
      }
    }

    .file-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }

    .file-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.04);
      }

      &.selected {
        background: rgba(var(--vp-c-brand-rgb), 0.1);
      }

      .file-icon {
        color: var(--vp-c-text-2);

        &.folder {
          color: #f5a524;
        }
      }

      .file-name {
        flex: 1;
        color: var(--vp-c-text-1);
      }

      .file-size {
        color: var(--vp-c-text-3);
        font-size: 0.85rem;
        font-family: monospace;
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: var(--vp-c-text-2);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
        opacity: 0.5;
      }
    }

    .browser-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(255, 255, 255, 0.02);

      .selection-info {
        color: var(--vp-c-text-2);
        font-size: 0.9rem;
      }

      .footer-actions {
        display: flex;
        gap: 12px;

        button mat-icon {
          margin-right: 8px;
        }
      }
    }
  `]
})
export class SnapshotBrowserComponent {
  @Input() snapshot!: SnapshotDisplay;
  @Input() files: FileNode[] = [];
  @Input() path = '/';
  @Input() breadcrumbs: Breadcrumb[] = [];
  @Input() selectedFiles: FileNode[] = [];

  @Output() navigate = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();
  @Output() restore = new EventEmitter<void>();
  @Output() toggleFileSelection = new EventEmitter<FileNode>();

  formatBytes = formatBytes;

  isSelected(file: FileNode): boolean {
    return this.selectedFiles.some(f => f.path === file.path);
  }

  onFileClick(file: FileNode) {
    if (file.type === 'dir') {
      this.navigate.emit(file.path);
    } else {
      this.toggleFile(file);
    }
  }

  toggleFile(file: FileNode) {
    this.toggleFileSelection.emit(file);
  }

  getFileIcon(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'js':
      case 'py':
      case 'go':
      case 'rs':
        return 'code';
      case 'json':
      case 'yaml':
      case 'yml':
      case 'toml':
        return 'data_object';
      case 'md':
      case 'txt':
        return 'description';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return 'image';
      case 'pdf':
        return 'picture_as_pdf';
      case 'zip':
      case 'tar':
      case 'gz':
        return 'archive';
      default:
        return 'insert_drive_file';
    }
  }
}
