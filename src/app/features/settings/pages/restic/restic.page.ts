import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { ResticService } from '@core/services/config/restic.service';
import { SnapshotDisplay, FileNode, formatBytes, formatDuration } from '@core/models/restic.model';
import { SnapshotTableComponent } from '../../components/snapshot-table/snapshot-table.component';
import { CreateBackupDialogComponent } from '../../components/create-backup-dialog/create-backup-dialog.component';
import { SnapshotBrowserComponent } from '../../components/snapshot-browser/snapshot-browser.component';
import { RestoreDialogComponent } from '../../components/restore-dialog/restore-dialog.component';
import { SnapshotDiffComponent } from '../../components/snapshot-diff/snapshot-diff.component';
import { ConfigEditorComponent } from '../../components/config-editor/config-editor.component';
import { LogsViewerComponent } from '../../components/logs-viewer/logs-viewer.component';
import { HistoryChartComponent } from '../../components/history-chart/history-chart.component';

@Component({
  selector: 'app-restic-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatTabsModule,
    MatExpansionModule,
    MatSnackBarModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatDialogModule,
    MatTableModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    SnapshotTableComponent,
    CreateBackupDialogComponent,
    SnapshotBrowserComponent,
    RestoreDialogComponent,
    SnapshotDiffComponent,
    ConfigEditorComponent,
    LogsViewerComponent,
    HistoryChartComponent
  ],
  templateUrl: './restic.page.html',
  styleUrl: './restic.page.scss'
})
export class ResticPageComponent implements OnInit {
  resticService = inject(ResticService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // Expose service signals
  snapshots = this.resticService.snapshots;
  repoStats = this.resticService.repoStats;
  mountStatus = this.resticService.mountStatus;
  config = this.resticService.config;
  timers = this.resticService.timers;
  logs = this.resticService.logs;
  historyStats = this.resticService.historyStats;
  prunePreview = this.resticService.prunePreview;

  // Loading states
  isLoading = this.resticService.isLoading;
  isLoadingSnapshots = this.resticService.isLoadingSnapshots;
  isLoadingStats = this.resticService.isLoadingStats;
  isCreatingBackup = this.resticService.isCreatingBackup;
  isRunningCheck = this.resticService.isRunningCheck;
  isPruning = this.resticService.isPruning;

  // Browser state
  currentSnapshot = this.resticService.currentSnapshot;
  currentFiles = this.resticService.currentFiles;
  currentPath = this.resticService.currentPath;
  breadcrumbs = this.resticService.breadcrumbs;
  selectedFiles = this.resticService.selectedFiles;

  // Diff state
  diffSnapshot1 = this.resticService.diffSnapshot1;
  diffSnapshot2 = this.resticService.diffSnapshot2;
  diffResult = this.resticService.diffResult;

  // Config state
  hasUnsavedChanges = this.resticService.hasUnsavedChanges;
  error = this.resticService.error;

  // Computed
  selectedCount = this.resticService.selectedCount;
  isNasMounted = this.resticService.isNasMounted;
  lastBackup = this.resticService.lastBackup;

  // Helper for formatting
  formatBytes = formatBytes;
  formatDuration = formatDuration;

  // Computed for overview cards
  nextScheduledRun = computed(() => {
    const timer = this.timers()[0];
    return timer?.next_run || null;
  });

  timerEnabled = computed(() => {
    const timer = this.timers()[0];
    return timer?.enabled ?? false;
  });

  async ngOnInit() {
    await this.resticService.initialize();
    await this.resticService.loadStats();
    await this.resticService.loadLogs(50);
    await this.resticService.loadHistoryStats(30);
  }

  // ========== Actions ==========

  async refresh() {
    await this.resticService.refreshAll();
    this.snackBar.open('Refreshed', 'Dismiss', { duration: 2000 });
  }

  async openCreateBackupDialog() {
    const dialogRef = this.dialog.open(CreateBackupDialogComponent, {
      width: '500px',
      data: { config: this.config() }
    });

    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      await this.resticService.createBackup(result.name);
    }
  }

  async deleteSelected() {
    const selected = this.snapshots().filter(s => s.isSelected);
    if (selected.length === 0) return;

    const confirmed = confirm(`Delete ${selected.length} snapshot(s)? This cannot be undone.`);
    if (!confirmed) return;

    const ids = selected.map(s => s.id);
    await this.resticService.deleteSnapshots(ids);
  }

  toggleSelection(snapshot: SnapshotDisplay) {
    this.resticService.toggleSnapshotSelection(snapshot.id);
  }

  selectAll(selected: boolean) {
    this.resticService.selectAllSnapshots(selected);
  }

  // ========== Browse ==========

  async browseSnapshot(snapshot: SnapshotDisplay) {
    await this.resticService.browseSnapshot(snapshot);
  }

  async navigateToPath(path: string) {
    this.resticService.navigateToPath(path);
  }

  closeBrowser() {
    this.resticService.closeBrowser();
  }

  toggleFileSelection(file: FileNode) {
    this.resticService.toggleFileSelection(file);
  }

  async openRestoreDialog() {
    const snapshot = this.currentSnapshot();
    const files = this.selectedFiles();
    if (!snapshot || files.length === 0) return;

    const dialogRef = this.dialog.open(RestoreDialogComponent, {
      width: '600px',
      data: { snapshot, files }
    });

    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      await this.resticService.restore({
        snapshot_id: snapshot.id,
        source_paths: files.map(f => f.path),
        target_dir: result.targetDir,
        overwrite: result.overwrite
      });
      this.closeBrowser();
    }
  }

  // ========== Diff ==========

  setDiffSnapshot(snapshot: SnapshotDisplay, position: 1 | 2) {
    if (position === 1) {
      this.resticService.setDiffSnapshot1(snapshot);
    } else {
      this.resticService.setDiffSnapshot2(snapshot);
    }
  }

  async computeDiff() {
    await this.resticService.computeDiff();
  }

  clearDiff() {
    this.resticService.clearDiff();
  }

  // ========== Repository ==========

  async checkRepository() {
    await this.resticService.checkRepository();
  }

  async unlockRepository() {
    await this.resticService.unlockRepository();
  }

  async loadPrunePreview() {
    await this.resticService.loadPrunePreview();
  }

  async executePrune() {
    const preview = this.prunePreview();
    if (!preview) return;

    const confirmed = confirm(`This will remove ${preview.total_to_remove} snapshot(s). Continue?`);
    if (!confirmed) return;

    await this.resticService.prune();
  }

  // ========== Timer ==========

  async toggleTimer() {
    const timer = this.timers()[0];
    if (!timer) return;

    if (timer.enabled) {
      await this.resticService.disableTimer(timer.name);
    } else {
      await this.resticService.enableTimer(timer.name);
    }
  }

  // ========== Config ==========

  async saveConfig() {
    await this.resticService.saveConfig();
  }

  resetConfig() {
    this.resticService.resetConfig();
  }

  onConfigChange(newConfig: any) {
    this.resticService.updateConfig(() => newConfig);
  }

  // ========== Logs ==========

  async refreshLogs() {
    await this.resticService.loadLogs(100);
  }
}
