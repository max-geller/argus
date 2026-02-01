import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { ResticConfig } from '@core/models/restic.model';

@Component({
  selector: 'app-config-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatInputModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatIconModule,
    MatButtonModule,
    MatExpansionModule,
    MatChipsModule
  ],
  template: `
    <div class="config-editor">
      <!-- Repository Section -->
      <mat-expansion-panel expanded>
        <mat-expansion-panel-header>
          <mat-panel-title>
            <mat-icon>storage</mat-icon>
            Repository
          </mat-panel-title>
        </mat-expansion-panel-header>

        <div class="form-group">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Repository Path</mat-label>
            <input matInput [(ngModel)]="config.repository.path"
                   (ngModelChange)="onConfigChange()"
                   placeholder="/media/nas_backup/restic-repo">
            <mat-hint>Path to the restic repository</mat-hint>
          </mat-form-field>
        </div>

        <div class="form-group">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Password File</mat-label>
            <input matInput [(ngModel)]="config.repository.password_file"
                   (ngModelChange)="onConfigChange()"
                   placeholder="~/.config/restic/password.txt">
            <mat-hint>Path to the file containing the repository password</mat-hint>
          </mat-form-field>
        </div>
      </mat-expansion-panel>

      <!-- Mount Section -->
      <mat-expansion-panel>
        <mat-expansion-panel-header>
          <mat-panel-title>
            <mat-icon>dns</mat-icon>
            Mount Settings
          </mat-panel-title>
        </mat-expansion-panel-header>

        <div class="form-group">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Mount Path</mat-label>
            <input matInput [(ngModel)]="config.mount.path"
                   (ngModelChange)="onConfigChange()"
                   placeholder="/media/nas_backup">
          </mat-form-field>
        </div>

        <div class="form-group">
          <mat-slide-toggle [(ngModel)]="config.mount.auto_mount"
                            (ngModelChange)="onConfigChange()">
            Auto Mount
          </mat-slide-toggle>
        </div>

        <div class="form-group" *ngIf="config.mount.auto_mount">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Mount Command</mat-label>
            <input matInput [(ngModel)]="config.mount.mount_command"
                   (ngModelChange)="onConfigChange()"
                   placeholder="sudo mount /media/nas_backup">
          </mat-form-field>
        </div>
      </mat-expansion-panel>

      <!-- Backup Paths Section -->
      <mat-expansion-panel>
        <mat-expansion-panel-header>
          <mat-panel-title>
            <mat-icon>folder</mat-icon>
            Backup Paths
          </mat-panel-title>
        </mat-expansion-panel-header>

        <div class="form-group" *ngIf="config.backup.script">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Backup Script</mat-label>
            <input matInput [(ngModel)]="config.backup.script"
                   (ngModelChange)="onConfigChange()"
                   placeholder="~/.local/bin/backup-script.sh">
            <mat-hint>Script to run for backups (takes precedence over paths)</mat-hint>
          </mat-form-field>
        </div>

        <div class="list-section">
          <div class="list-header">
            <span>Paths to backup</span>
            <button mat-stroked-button (click)="addPath()">
              <mat-icon>add</mat-icon>
              Add Path
            </button>
          </div>

          <p class="hint-text" *ngIf="config.backup.script">
            Note: When a backup script is configured, paths are ignored. Remove the script to use direct paths.
          </p>

          <div class="path-list">
            <div class="path-item" *ngFor="let path of config.backup.paths; let i = index">
              <mat-form-field appearance="outline" class="flex-grow">
                <input matInput [(ngModel)]="config.backup.paths[i]"
                       (ngModelChange)="onConfigChange()"
                       placeholder="~/.config">
              </mat-form-field>
              <button mat-icon-button color="warn" (click)="removePath(i)">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
        </div>

        <div class="form-group">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Base Tag</mat-label>
            <input matInput [(ngModel)]="config.backup.tag"
                   (ngModelChange)="onConfigChange()"
                   placeholder="fedora">
            <mat-hint>Tag added to all backups (e.g., hostname)</mat-hint>
          </mat-form-field>
        </div>
      </mat-expansion-panel>

      <!-- Excludes Section -->
      <mat-expansion-panel>
        <mat-expansion-panel-header>
          <mat-panel-title>
            <mat-icon>block</mat-icon>
            Excludes
          </mat-panel-title>
        </mat-expansion-panel-header>

        <div class="list-section">
          <div class="list-header">
            <span>Patterns to exclude</span>
            <button mat-stroked-button (click)="addExclude()">
              <mat-icon>add</mat-icon>
              Add Exclude
            </button>
          </div>

          <div class="path-list">
            <div class="path-item" *ngFor="let exclude of config.backup.excludes; let i = index">
              <mat-form-field appearance="outline" class="flex-grow">
                <input matInput [(ngModel)]="config.backup.excludes[i]"
                       (ngModelChange)="onConfigChange()"
                       placeholder="node_modules">
              </mat-form-field>
              <button mat-icon-button color="warn" (click)="removeExclude(i)">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
        </div>
      </mat-expansion-panel>

      <!-- Retention Section -->
      <mat-expansion-panel>
        <mat-expansion-panel-header>
          <mat-panel-title>
            <mat-icon>schedule</mat-icon>
            Retention Policy
          </mat-panel-title>
        </mat-expansion-panel-header>

        <div class="retention-sliders">
          <div class="slider-group">
            <label>Keep Daily: {{ config.retention.daily }}</label>
            <mat-slider min="1" max="30" step="1" discrete showTickMarks>
              <input matSliderThumb [(ngModel)]="config.retention.daily"
                     (ngModelChange)="onConfigChange()">
            </mat-slider>
          </div>

          <div class="slider-group">
            <label>Keep Weekly: {{ config.retention.weekly }}</label>
            <mat-slider min="1" max="12" step="1" discrete showTickMarks>
              <input matSliderThumb [(ngModel)]="config.retention.weekly"
                     (ngModelChange)="onConfigChange()">
            </mat-slider>
          </div>

          <div class="slider-group">
            <label>Keep Monthly: {{ config.retention.monthly }}</label>
            <mat-slider min="1" max="24" step="1" discrete showTickMarks>
              <input matSliderThumb [(ngModel)]="config.retention.monthly"
                     (ngModelChange)="onConfigChange()">
            </mat-slider>
          </div>
        </div>
      </mat-expansion-panel>

      <!-- Systemd Section -->
      <mat-expansion-panel>
        <mat-expansion-panel-header>
          <mat-panel-title>
            <mat-icon>timer</mat-icon>
            Systemd Timer
          </mat-panel-title>
        </mat-expansion-panel-header>

        <div class="form-group">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Timer Unit</mat-label>
            <input matInput [(ngModel)]="config.systemd.timer"
                   (ngModelChange)="onConfigChange()"
                   placeholder="restic-backup.timer">
          </mat-form-field>
        </div>

        <div class="form-group">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Service Unit</mat-label>
            <input matInput [(ngModel)]="config.systemd.service"
                   (ngModelChange)="onConfigChange()"
                   placeholder="restic-backup.service">
          </mat-form-field>
        </div>
      </mat-expansion-panel>
    </div>
  `,
  styles: [`
    .config-editor {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    mat-expansion-panel {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);

      ::ng-deep .mat-expansion-panel-header-title {
        display: flex;
        align-items: center;
        gap: 12px;

        mat-icon {
          color: var(--vp-c-text-2);
        }
      }
    }

    .form-group {
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .full-width {
      width: 100%;
    }

    .flex-grow {
      flex: 1;
    }

    .list-section {
      margin-bottom: 20px;
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      span {
        font-weight: 500;
        color: var(--vp-c-text-1);
      }
    }

    .path-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .path-item {
      display: flex;
      align-items: center;
      gap: 8px;

      mat-form-field {
        margin-bottom: 0;

        ::ng-deep .mat-mdc-form-field-subscript-wrapper {
          display: none;
        }
      }
    }

    .retention-sliders {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .slider-group {
      display: flex;
      flex-direction: column;
      gap: 8px;

      label {
        font-size: 0.9rem;
        color: var(--vp-c-text-2);
      }

      mat-slider {
        width: 100%;
      }
    }

    mat-slide-toggle {
      margin: 12px 0;
    }

    .hint-text {
      font-size: 0.85rem;
      color: var(--vp-c-text-3);
      font-style: italic;
      margin: 8px 0 16px;
    }
  `]
})
export class ConfigEditorComponent {
  @Input() config!: ResticConfig;
  @Output() configChange = new EventEmitter<ResticConfig>();

  onConfigChange() {
    this.configChange.emit({ ...this.config });
  }

  addPath() {
    this.config.backup.paths.push('');
    this.onConfigChange();
  }

  removePath(index: number) {
    this.config.backup.paths.splice(index, 1);
    this.onConfigChange();
  }

  addExclude() {
    this.config.backup.excludes.push('');
    this.onConfigChange();
  }

  removeExclude(index: number) {
    this.config.backup.excludes.splice(index, 1);
    this.onConfigChange();
  }
}
