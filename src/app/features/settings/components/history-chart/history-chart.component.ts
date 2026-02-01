import { Component, Input, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';
import { HistoryStats, formatBytes } from '@core/models/restic.model';

@Component({
  selector: 'app-history-chart',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatButtonToggleModule, FormsModule],
  template: `
    <div class="history-chart">
      <div class="chart-header" *ngIf="stats">
        <div class="stat-summary">
          <div class="stat">
            <span class="value">{{ stats.total_backups }}</span>
            <span class="label">Backups</span>
          </div>
          <div class="stat">
            <span class="value">{{ formatBytes(stats.total_data_backed_up) }}</span>
            <span class="label">Total Data</span>
          </div>
          <div class="stat">
            <span class="value">{{ formatDuration(stats.average_duration) }}</span>
            <span class="label">Avg Duration</span>
          </div>
        </div>

        <mat-button-toggle-group [(ngModel)]="chartType" (change)="updateChart()">
          <mat-button-toggle value="size">Size</mat-button-toggle>
          <mat-button-toggle value="frequency">Frequency</mat-button-toggle>
        </mat-button-toggle-group>
      </div>

      <div class="chart-container" *ngIf="stats && hasData">
        <!-- Simple bar chart using CSS -->
        <div class="simple-chart" *ngIf="chartType === 'size'">
          <div class="chart-bars">
            <div class="bar-wrapper" *ngFor="let point of stats.size_over_time; let i = index">
              <div class="bar" [style.height.%]="getBarHeight(point.size)">
                <div class="bar-tooltip">
                  {{ point.date }}: {{ formatBytes(point.size) }}
                </div>
              </div>
              <span class="bar-label" *ngIf="i % labelStep === 0">{{ formatDate(point.date) }}</span>
            </div>
          </div>
        </div>

        <div class="simple-chart" *ngIf="chartType === 'frequency'">
          <div class="chart-bars">
            <div class="bar-wrapper" *ngFor="let week of stats.backups_per_week; let i = index">
              <div class="bar frequency" [style.height.%]="getFrequencyHeight(week.count)">
                <div class="bar-tooltip">
                  {{ week.week }}: {{ week.count }} backups
                </div>
              </div>
              <span class="bar-label">{{ formatWeek(week.week) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="!stats || !hasData">
        <mat-icon>insert_chart</mat-icon>
        <p>No backup history data available</p>
      </div>
    </div>
  `,
  styles: [`
    .history-chart {
      padding: 16px 0;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .stat-summary {
      display: flex;
      gap: 32px;
    }

    .stat {
      display: flex;
      flex-direction: column;

      .value {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--vp-c-text-1);
      }

      .label {
        font-size: 0.85rem;
        color: var(--vp-c-text-2);
      }
    }

    .chart-container {
      margin-top: 16px;
    }

    .simple-chart {
      height: 200px;
    }

    .chart-bars {
      display: flex;
      align-items: flex-end;
      height: 100%;
      gap: 4px;
      padding-bottom: 24px;
    }

    .bar-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      position: relative;
    }

    .bar {
      width: 100%;
      max-width: 40px;
      background: linear-gradient(180deg, var(--vp-c-brand) 0%, rgba(var(--vp-c-brand-rgb), 0.6) 100%);
      border-radius: 4px 4px 0 0;
      transition: all 0.3s ease;
      position: relative;
      cursor: pointer;

      &.frequency {
        background: linear-gradient(180deg, #34c759 0%, rgba(52, 199, 89, 0.6) 100%);
      }

      &:hover {
        opacity: 0.8;

        .bar-tooltip {
          opacity: 1;
          visibility: visible;
        }
      }
    }

    .bar-tooltip {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: var(--vp-c-bg);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition: all 0.2s ease;
      z-index: 10;
      margin-bottom: 8px;
    }

    .bar-label {
      position: absolute;
      bottom: 0;
      font-size: 0.7rem;
      color: var(--vp-c-text-3);
      white-space: nowrap;
      transform: translateY(100%);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      color: var(--vp-c-text-3);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 12px;
        opacity: 0.5;
      }

      p {
        margin: 0;
      }
    }
  `]
})
export class HistoryChartComponent implements OnChanges {
  @Input() stats: HistoryStats | null = null;

  chartType: 'size' | 'frequency' = 'size';
  maxSize = 0;
  maxFrequency = 0;
  labelStep = 1;

  formatBytes = formatBytes;

  get hasData(): boolean {
    if (!this.stats) return false;
    return this.stats.size_over_time.length > 0 || this.stats.backups_per_week.length > 0;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['stats'] && this.stats) {
      this.calculateMaxValues();
    }
  }

  calculateMaxValues() {
    if (!this.stats) return;

    if (this.stats.size_over_time.length > 0) {
      this.maxSize = Math.max(...this.stats.size_over_time.map(p => p.size));
      this.labelStep = Math.ceil(this.stats.size_over_time.length / 7);
    }

    if (this.stats.backups_per_week.length > 0) {
      this.maxFrequency = Math.max(...this.stats.backups_per_week.map(w => w.count));
    }
  }

  getBarHeight(size: number): number {
    if (this.maxSize === 0) return 0;
    return Math.max(5, (size / this.maxSize) * 100);
  }

  getFrequencyHeight(count: number): number {
    if (this.maxFrequency === 0) return 0;
    return Math.max(5, (count / this.maxFrequency) * 100);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  formatWeek(weekStr: string): string {
    // Format like "2024-W05" to "W5"
    const match = weekStr.match(/W(\d+)/);
    return match ? `W${parseInt(match[1])}` : weekStr;
  }

  formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds.toFixed(0)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  }

  updateChart() {
    // Chart type changed - recalculate if needed
    this.calculateMaxValues();
  }
}
