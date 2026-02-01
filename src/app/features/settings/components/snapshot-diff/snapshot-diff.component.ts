import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { SnapshotDisplay, DiffResult } from '@core/models/restic.model';

@Component({
  selector: 'app-snapshot-diff',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTabsModule
  ],
  template: `
    <div class="diff-overlay">
      <div class="diff-container">
        <!-- Header -->
        <div class="diff-header">
          <div class="header-info">
            <h2>Snapshot Comparison</h2>
            <div class="snapshot-comparison">
              <code>{{ snapshot1.shortId }}</code>
              <mat-icon>arrow_forward</mat-icon>
              <code>{{ snapshot2.shortId }}</code>
            </div>
          </div>
          <button mat-icon-button (click)="close.emit()">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Content -->
        <div class="diff-content" *ngIf="result; else loading">
          <!-- Summary -->
          <div class="diff-summary">
            <div class="summary-item added">
              <span class="count">{{ result.added.length }}</span>
              <span class="label">Added</span>
            </div>
            <div class="summary-item removed">
              <span class="count">{{ result.removed.length }}</span>
              <span class="label">Removed</span>
            </div>
            <div class="summary-item modified">
              <span class="count">{{ result.modified.length }}</span>
              <span class="label">Modified</span>
            </div>
          </div>

          <!-- Tabs -->
          <mat-tab-group>
            <mat-tab>
              <ng-template mat-tab-label>
                <span class="tab-label added">Added ({{ result.added.length }})</span>
              </ng-template>
              <div class="file-list">
                <div class="file-item added" *ngFor="let file of result.added">
                  <mat-icon>add</mat-icon>
                  <span>{{ file }}</span>
                </div>
                <div class="empty-message" *ngIf="result.added.length === 0">
                  No files added
                </div>
              </div>
            </mat-tab>

            <mat-tab>
              <ng-template mat-tab-label>
                <span class="tab-label removed">Removed ({{ result.removed.length }})</span>
              </ng-template>
              <div class="file-list">
                <div class="file-item removed" *ngFor="let file of result.removed">
                  <mat-icon>remove</mat-icon>
                  <span>{{ file }}</span>
                </div>
                <div class="empty-message" *ngIf="result.removed.length === 0">
                  No files removed
                </div>
              </div>
            </mat-tab>

            <mat-tab>
              <ng-template mat-tab-label>
                <span class="tab-label modified">Modified ({{ result.modified.length }})</span>
              </ng-template>
              <div class="file-list">
                <div class="file-item modified" *ngFor="let file of result.modified">
                  <mat-icon>edit</mat-icon>
                  <span>{{ file }}</span>
                </div>
                <div class="empty-message" *ngIf="result.modified.length === 0">
                  No files modified
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>
        </div>

        <ng-template #loading>
          <div class="loading-state">
            <mat-progress-spinner mode="indeterminate" diameter="48"></mat-progress-spinner>
            <p>Computing differences...</p>
            <button mat-stroked-button (click)="compute.emit()">Start Comparison</button>
          </div>
        </ng-template>

        <!-- Footer -->
        <div class="diff-footer">
          <button mat-stroked-button (click)="close.emit()">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .diff-overlay {
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

    .diff-container {
      width: 100%;
      max-width: 800px;
      max-height: 80vh;
      background: var(--vp-c-bg);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .diff-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 20px 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);

      h2 {
        margin: 0 0 8px;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--vp-c-text-1);
      }

      .snapshot-comparison {
        display: flex;
        align-items: center;
        gap: 8px;

        code {
          font-family: monospace;
          padding: 4px 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          font-size: 0.9rem;
        }

        mat-icon {
          color: var(--vp-c-text-2);
        }
      }
    }

    .diff-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .diff-summary {
      display: flex;
      gap: 16px;
      padding: 16px 24px;
      background: rgba(255, 255, 255, 0.02);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 24px;
      border-radius: 8px;

      &.added {
        background: rgba(52, 199, 89, 0.1);
        .count { color: #34c759; }
      }

      &.removed {
        background: rgba(255, 59, 48, 0.1);
        .count { color: #ff3b30; }
      }

      &.modified {
        background: rgba(245, 165, 36, 0.1);
        .count { color: #f5a524; }
      }

      .count {
        font-size: 1.5rem;
        font-weight: 600;
      }

      .label {
        font-size: 0.85rem;
        color: var(--vp-c-text-2);
      }
    }

    .tab-label {
      &.added { color: #34c759; }
      &.removed { color: #ff3b30; }
      &.modified { color: #f5a524; }
    }

    .file-list {
      padding: 16px;
      max-height: 300px;
      overflow-y: auto;
    }

    .file-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 0.85rem;
      margin-bottom: 4px;

      &.added {
        background: rgba(52, 199, 89, 0.05);
        mat-icon { color: #34c759; }
      }

      &.removed {
        background: rgba(255, 59, 48, 0.05);
        mat-icon { color: #ff3b30; }
      }

      &.modified {
        background: rgba(245, 165, 36, 0.05);
        mat-icon { color: #f5a524; }
      }

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    .empty-message {
      padding: 24px;
      text-align: center;
      color: var(--vp-c-text-3);
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      gap: 16px;

      p {
        margin: 0;
        color: var(--vp-c-text-2);
      }
    }

    .diff-footer {
      display: flex;
      justify-content: flex-end;
      padding: 16px 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(255, 255, 255, 0.02);
    }
  `]
})
export class SnapshotDiffComponent {
  @Input() snapshot1!: SnapshotDisplay;
  @Input() snapshot2!: SnapshotDisplay;
  @Input() result: DiffResult | null = null;

  @Output() compute = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
}
