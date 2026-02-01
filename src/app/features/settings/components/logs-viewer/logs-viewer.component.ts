import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-logs-viewer',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="logs-viewer">
      <div class="logs-container" *ngIf="logs.length > 0; else empty">
        <div class="log-line" *ngFor="let line of logs"
             [class.info]="isInfo(line)"
             [class.warning]="isWarning(line)"
             [class.error]="isError(line)">
          <span class="log-icon" *ngIf="isError(line)">
            <mat-icon>error</mat-icon>
          </span>
          <span class="log-icon" *ngIf="isWarning(line)">
            <mat-icon>warning</mat-icon>
          </span>
          <span class="log-text">{{ line }}</span>
        </div>
      </div>

      <ng-template #empty>
        <div class="empty-state">
          <mat-icon>description</mat-icon>
          <p>No logs available</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .logs-viewer {
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      overflow: hidden;
    }

    .logs-container {
      max-height: 300px;
      overflow-y: auto;
      padding: 12px;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 0.85rem;
    }

    .log-line {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 4px 8px;
      border-radius: 4px;
      color: var(--vp-c-text-2);
      line-height: 1.4;

      &:hover {
        background: rgba(255, 255, 255, 0.02);
      }

      &.warning {
        color: #f5a524;
        background: rgba(245, 165, 36, 0.05);
      }

      &.error {
        color: #ff3b30;
        background: rgba(255, 59, 48, 0.05);
      }
    }

    .log-icon {
      display: flex;
      align-items: center;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }

    .log-text {
      flex: 1;
      word-break: break-all;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      color: var(--vp-c-text-3);

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        margin-bottom: 8px;
        opacity: 0.5;
      }

      p {
        margin: 0;
      }
    }

    /* Custom scrollbar */
    .logs-container::-webkit-scrollbar {
      width: 8px;
    }

    .logs-container::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.02);
    }

    .logs-container::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;

      &:hover {
        background: rgba(255, 255, 255, 0.15);
      }
    }
  `]
})
export class LogsViewerComponent {
  @Input() logs: string[] = [];

  isInfo(line: string): boolean {
    return line.toLowerCase().includes('info');
  }

  isWarning(line: string): boolean {
    const lower = line.toLowerCase();
    return lower.includes('warn') || lower.includes('warning');
  }

  isError(line: string): boolean {
    const lower = line.toLowerCase();
    return lower.includes('error') || lower.includes('failed') || lower.includes('fatal');
  }
}
