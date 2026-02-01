import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SnapshotDisplay } from '@core/models/restic.model';

@Component({
  selector: 'app-snapshot-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule
  ],
  template: `
    <div class="snapshot-table-container">
      <table mat-table [dataSource]="snapshots" class="snapshot-table">
        <!-- Checkbox Column -->
        <ng-container matColumnDef="select">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let snapshot">
            <mat-checkbox
              [checked]="snapshot.isSelected"
              (change)="toggle.emit(snapshot)"
              (click)="$event.stopPropagation()">
            </mat-checkbox>
          </td>
        </ng-container>

        <!-- Name Column -->
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let snapshot">
            <span class="snapshot-name" *ngIf="snapshot.name">{{ snapshot.name }}</span>
            <span class="snapshot-name no-name" *ngIf="!snapshot.name">—</span>
          </td>
        </ng-container>

        <!-- Source Column -->
        <ng-container matColumnDef="source">
          <th mat-header-cell *matHeaderCellDef>Source</th>
          <td mat-cell *matCellDef="let snapshot">
            <span class="source-badge" [class.manual]="snapshot.source === 'manual'"
                  [class.scheduled]="snapshot.source === 'scheduled'">
              {{ snapshot.source }}
            </span>
          </td>
        </ng-container>

        <!-- ID Column -->
        <ng-container matColumnDef="id">
          <th mat-header-cell *matHeaderCellDef>ID</th>
          <td mat-cell *matCellDef="let snapshot">
            <code class="snapshot-id">{{ snapshot.shortId }}</code>
          </td>
        </ng-container>

        <!-- Date Column -->
        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef>Date</th>
          <td mat-cell *matCellDef="let snapshot">
            {{ snapshot.date | date:'medium' }}
          </td>
        </ng-container>

        <!-- Actions Column -->
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let snapshot">
            <button mat-icon-button (click)="browse.emit(snapshot)" matTooltip="Browse files">
              <mat-icon>folder_open</mat-icon>
            </button>
            <button mat-icon-button [matMenuTriggerFor]="menu" matTooltip="More actions">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #menu="matMenu">
              <button mat-menu-item (click)="setDiff1.emit(snapshot)">
                <mat-icon>compare</mat-icon>
                <span>Set as Diff Base</span>
              </button>
              <button mat-menu-item (click)="setDiff2.emit(snapshot)">
                <mat-icon>compare_arrows</mat-icon>
                <span>Compare with Base</span>
              </button>
            </mat-menu>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"
            [class.selected]="row.isSelected"
            (click)="toggle.emit(row)"></tr>
      </table>
    </div>
  `,
  styles: [`
    .snapshot-table-container {
      overflow-x: auto;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
    }

    .snapshot-table {
      width: 100%;
      background: transparent;

      th.mat-header-cell {
        background: rgba(255, 255, 255, 0.02);
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 0.05em;
        color: var(--vp-c-text-2);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        padding: 16px;
      }

      td.mat-cell {
        padding: 12px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        color: var(--vp-c-text-1);
      }

      tr.mat-row {
        cursor: pointer;
        transition: background 0.2s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        &.selected {
          background: rgba(var(--vp-c-brand-rgb), 0.1);
        }
      }
    }

    .snapshot-name {
      font-weight: 500;

      &.no-name {
        color: var(--vp-c-text-3);
        font-style: italic;
      }
    }

    .snapshot-id {
      font-family: monospace;
      font-size: 0.85rem;
      padding: 2px 6px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 4px;
    }

    .source-badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;

      &.manual {
        background: rgba(33, 150, 243, 0.1);
        color: #2196f3;
      }

      &.scheduled {
        background: rgba(76, 175, 80, 0.1);
        color: #4caf50;
      }
    }
  `]
})
export class SnapshotTableComponent {
  @Input() snapshots: SnapshotDisplay[] = [];

  @Output() toggle = new EventEmitter<SnapshotDisplay>();
  @Output() browse = new EventEmitter<SnapshotDisplay>();
  @Output() setDiff1 = new EventEmitter<SnapshotDisplay>();
  @Output() setDiff2 = new EventEmitter<SnapshotDisplay>();

  displayedColumns = ['select', 'name', 'source', 'id', 'date', 'actions'];
}
