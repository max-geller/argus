import { Injectable, signal, inject, computed } from '@angular/core';
import { TauriService } from '@core/services/tauri.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  Snapshot,
  SnapshotDisplay,
  RepoStats,
  MountStatus,
  TimerStatus,
  FileNode,
  DiffResult,
  RestoreRequest,
  PrunePreview,
  CheckResult,
  ResticConfig,
  BackupHistoryEntry,
  HistoryStats,
  snapshotToDisplay,
  getDefaultConfig
} from '@core/models/restic.model';

@Injectable({
  providedIn: 'root'
})
export class ResticService {
  private tauriService = inject(TauriService);
  private snackBar = inject(MatSnackBar);

  // ========== Signals ==========

  // Core data
  readonly snapshots = signal<SnapshotDisplay[]>([]);
  readonly repoStats = signal<RepoStats | null>(null);
  readonly mountStatus = signal<MountStatus | null>(null);
  readonly config = signal<ResticConfig | null>(null);
  readonly initialConfig = signal<ResticConfig | null>(null);
  readonly timers = signal<TimerStatus[]>([]);

  // Browsing state
  readonly currentSnapshot = signal<SnapshotDisplay | null>(null);
  readonly currentPath = signal<string>('/');
  readonly currentFiles = signal<FileNode[]>([]);
  readonly selectedFiles = signal<FileNode[]>([]);

  // Diff state
  readonly diffSnapshot1 = signal<SnapshotDisplay | null>(null);
  readonly diffSnapshot2 = signal<SnapshotDisplay | null>(null);
  readonly diffResult = signal<DiffResult | null>(null);

  // Prune state
  readonly prunePreview = signal<PrunePreview | null>(null);

  // History data
  readonly historyEntries = signal<BackupHistoryEntry[]>([]);
  readonly historyStats = signal<HistoryStats | null>(null);

  // Logs
  readonly logs = signal<string[]>([]);

  // Loading states
  readonly isLoading = signal(false);
  readonly isLoadingSnapshots = signal(false);
  readonly isLoadingStats = signal(false);
  readonly isLoadingBrowse = signal(false);
  readonly isCreatingBackup = signal(false);
  readonly isRunningCheck = signal(false);
  readonly isPruning = signal(false);
  readonly isRestoring = signal(false);

  // Error state
  readonly error = signal<string | null>(null);

  // ========== Computed ==========

  readonly hasUnsavedChanges = computed(() => {
    const current = this.config();
    const initial = this.initialConfig();
    return current !== null && initial !== null &&
           JSON.stringify(current) !== JSON.stringify(initial);
  });

  readonly selectedSnapshots = computed(() =>
    this.snapshots().filter(s => s.isSelected)
  );

  readonly selectedCount = computed(() =>
    this.selectedSnapshots().length
  );

  readonly isNasMounted = computed(() =>
    this.mountStatus()?.mounted ?? false
  );

  readonly lastBackup = computed(() => {
    const snaps = this.snapshots();
    if (snaps.length === 0) return null;
    return snaps.reduce((latest, s) =>
      s.date > latest.date ? s : latest, snaps[0]);
  });

  readonly breadcrumbs = computed(() => {
    const path = this.currentPath();
    if (path === '/' || path === '') return [{ label: 'Root', path: '/' }];

    const parts = path.split('/').filter(p => p);
    const crumbs = [{ label: 'Root', path: '/' }];

    let accumulated = '';
    for (const part of parts) {
      accumulated += '/' + part;
      crumbs.push({ label: part, path: accumulated });
    }

    return crumbs;
  });

  constructor() {
    // Initialize service
    this.initialize();
  }

  // ========== Initialization ==========

  async initialize(): Promise<void> {
    if (!this.tauriService.isRunningInTauri()) {
      console.warn('ResticService: Not running in Tauri environment');
      return;
    }

    try {
      await Promise.all([
        this.loadConfig(),
        this.checkMountStatus(),
        this.loadSnapshots(),
        this.loadTimers()
      ]);
    } catch (err) {
      console.error('ResticService initialization error:', err);
    }
  }

  // ========== Config Operations ==========

  async loadConfig(): Promise<void> {
    try {
      const config = await this.tauriService.invoke<ResticConfig>('restic_load_config');
      this.config.set(config);
      this.initialConfig.set(JSON.parse(JSON.stringify(config)));
    } catch (err) {
      console.error('Failed to load restic config:', err);
      // Use default config as fallback
      const defaultConfig = getDefaultConfig();
      this.config.set(defaultConfig);
      this.initialConfig.set(JSON.parse(JSON.stringify(defaultConfig)));
    }
  }

  async saveConfig(): Promise<void> {
    const currentConfig = this.config();
    if (!currentConfig) {
      throw new Error('No configuration to save');
    }

    this.isLoading.set(true);
    try {
      await this.tauriService.invoke('restic_save_config', { config: currentConfig });
      this.initialConfig.set(JSON.parse(JSON.stringify(currentConfig)));
      this.snackBar.open('Configuration saved successfully', 'Dismiss', { duration: 3000 });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save configuration';
      this.error.set(message);
      this.snackBar.open(`Error: ${message}`, 'Dismiss', { duration: 5000 });
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  updateConfig(updater: (config: ResticConfig) => ResticConfig): void {
    const current = this.config();
    if (current) {
      this.config.set(updater(current));
    }
  }

  resetConfig(): void {
    const initial = this.initialConfig();
    if (initial) {
      this.config.set(JSON.parse(JSON.stringify(initial)));
      this.snackBar.open('Configuration reset', 'Dismiss', { duration: 2000 });
    }
  }

  // ========== Mount Operations ==========

  async checkMountStatus(): Promise<void> {
    try {
      const status = await this.tauriService.invoke<MountStatus>('mount_check_nas_status');
      this.mountStatus.set(status);
    } catch (err) {
      console.error('Failed to check mount status:', err);
      this.mountStatus.set({ mounted: false, path: '' });
    }
  }

  // ========== Snapshot Operations ==========

  async loadSnapshots(): Promise<void> {
    this.isLoadingSnapshots.set(true);
    this.error.set(null);

    try {
      const snapshots = await this.tauriService.invoke<Snapshot[]>('restic_list_snapshots');
      const displaySnapshots = snapshots.map(snapshotToDisplay);
      // Sort by date descending (newest first)
      displaySnapshots.sort((a, b) => b.date.getTime() - a.date.getTime());
      this.snapshots.set(displaySnapshots);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load snapshots';
      this.error.set(message);
      this.snackBar.open(`Error: ${message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.isLoadingSnapshots.set(false);
    }
  }

  async createBackup(name?: string): Promise<void> {
    this.isCreatingBackup.set(true);
    this.error.set(null);

    try {
      const snapshot = await this.tauriService.invoke<Snapshot>('restic_create_backup', { name });
      this.snackBar.open('Backup created successfully', 'Dismiss', { duration: 3000 });

      // Send notification
      await this.sendNotification('Backup Complete', `Snapshot ${snapshot.short_id} created successfully`);

      // Refresh snapshots list
      await this.loadSnapshots();
      await this.loadStats();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create backup';
      this.error.set(message);
      this.snackBar.open(`Backup failed: ${message}`, 'Dismiss', { duration: 5000 });

      // Send failure notification
      await this.sendNotification('Backup Failed', message);
      throw err;
    } finally {
      this.isCreatingBackup.set(false);
    }
  }

  async deleteSnapshots(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    this.isLoading.set(true);
    try {
      await this.tauriService.invoke('restic_delete_snapshots', { ids });
      this.snackBar.open(`Deleted ${ids.length} snapshot(s)`, 'Dismiss', { duration: 3000 });
      await this.loadSnapshots();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete snapshots';
      this.error.set(message);
      this.snackBar.open(`Error: ${message}`, 'Dismiss', { duration: 5000 });
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleSnapshotSelection(snapshotId: string): void {
    this.snapshots.update(snapshots =>
      snapshots.map(s =>
        s.id === snapshotId ? { ...s, isSelected: !s.isSelected } : s
      )
    );
  }

  selectAllSnapshots(selected: boolean): void {
    this.snapshots.update(snapshots =>
      snapshots.map(s => ({ ...s, isSelected: selected }))
    );
  }

  clearSelection(): void {
    this.selectAllSnapshots(false);
  }

  // ========== Browse Operations ==========

  async browseSnapshot(snapshot: SnapshotDisplay, path: string = '/'): Promise<void> {
    this.isLoadingBrowse.set(true);
    this.currentSnapshot.set(snapshot);
    this.currentPath.set(path);
    this.selectedFiles.set([]);

    try {
      const files = await this.tauriService.invoke<FileNode[]>('restic_browse_snapshot', {
        id: snapshot.id,
        path
      });

      // Filter to only direct children of the current path
      const pathDepth = path === '/' ? 0 : path.split('/').filter(p => p).length;
      const directChildren = files.filter(f => {
        const fileParts = f.path.split('/').filter(p => p);
        return fileParts.length === pathDepth + 1;
      });

      // Sort: directories first, then by name
      directChildren.sort((a, b) => {
        if (a.type === 'dir' && b.type !== 'dir') return -1;
        if (a.type !== 'dir' && b.type === 'dir') return 1;
        return a.name.localeCompare(b.name);
      });

      this.currentFiles.set(directChildren);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to browse snapshot';
      this.error.set(message);
      this.snackBar.open(`Error: ${message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.isLoadingBrowse.set(false);
    }
  }

  navigateToPath(path: string): void {
    const snapshot = this.currentSnapshot();
    if (snapshot) {
      this.browseSnapshot(snapshot, path);
    }
  }

  toggleFileSelection(file: FileNode): void {
    this.selectedFiles.update(selected => {
      const index = selected.findIndex(f => f.path === file.path);
      if (index === -1) {
        return [...selected, file];
      } else {
        return selected.filter(f => f.path !== file.path);
      }
    });
  }

  clearFileSelection(): void {
    this.selectedFiles.set([]);
  }

  closeBrowser(): void {
    this.currentSnapshot.set(null);
    this.currentPath.set('/');
    this.currentFiles.set([]);
    this.selectedFiles.set([]);
  }

  // ========== Restore Operations ==========

  async restore(request: RestoreRequest): Promise<void> {
    this.isRestoring.set(true);
    try {
      await this.tauriService.invoke('restic_restore', { request });
      this.snackBar.open('Files restored successfully', 'Dismiss', { duration: 3000 });
      await this.sendNotification('Restore Complete', `Files restored to ${request.target_dir}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to restore files';
      this.error.set(message);
      this.snackBar.open(`Error: ${message}`, 'Dismiss', { duration: 5000 });
      throw err;
    } finally {
      this.isRestoring.set(false);
    }
  }

  // ========== Diff Operations ==========

  setDiffSnapshot1(snapshot: SnapshotDisplay | null): void {
    this.diffSnapshot1.set(snapshot);
    this.diffResult.set(null);
  }

  setDiffSnapshot2(snapshot: SnapshotDisplay | null): void {
    this.diffSnapshot2.set(snapshot);
    this.diffResult.set(null);
  }

  async computeDiff(): Promise<void> {
    const snap1 = this.diffSnapshot1();
    const snap2 = this.diffSnapshot2();

    if (!snap1 || !snap2) {
      this.snackBar.open('Please select two snapshots to compare', 'Dismiss', { duration: 3000 });
      return;
    }

    this.isLoading.set(true);
    try {
      const result = await this.tauriService.invoke<DiffResult>('restic_diff_snapshots', {
        id1: snap1.id,
        id2: snap2.id
      });
      this.diffResult.set(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to compute diff';
      this.error.set(message);
      this.snackBar.open(`Error: ${message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.isLoading.set(false);
    }
  }

  clearDiff(): void {
    this.diffSnapshot1.set(null);
    this.diffSnapshot2.set(null);
    this.diffResult.set(null);
  }

  // ========== Repository Operations ==========

  async loadStats(): Promise<void> {
    this.isLoadingStats.set(true);
    try {
      const stats = await this.tauriService.invoke<RepoStats>('restic_get_stats');
      this.repoStats.set(stats);
    } catch (err) {
      console.error('Failed to load repo stats:', err);
    } finally {
      this.isLoadingStats.set(false);
    }
  }

  async checkRepository(): Promise<CheckResult> {
    this.isRunningCheck.set(true);
    try {
      const result = await this.tauriService.invoke<CheckResult>('restic_check_repo');
      if (result.success) {
        this.snackBar.open('Repository check passed', 'Dismiss', { duration: 3000 });
      } else {
        this.snackBar.open(`Repository issues found: ${result.message}`, 'Dismiss', { duration: 5000 });
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check repository';
      this.error.set(message);
      this.snackBar.open(`Error: ${message}`, 'Dismiss', { duration: 5000 });
      throw err;
    } finally {
      this.isRunningCheck.set(false);
    }
  }

  async unlockRepository(): Promise<void> {
    try {
      await this.tauriService.invoke('restic_unlock_repo');
      this.snackBar.open('Repository unlocked', 'Dismiss', { duration: 3000 });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unlock repository';
      this.error.set(message);
      this.snackBar.open(`Error: ${message}`, 'Dismiss', { duration: 5000 });
      throw err;
    }
  }

  async loadPrunePreview(): Promise<void> {
    this.isLoading.set(true);
    try {
      const preview = await this.tauriService.invoke<PrunePreview>('restic_prune_preview');
      this.prunePreview.set(preview);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load prune preview';
      this.error.set(message);
      this.snackBar.open(`Error: ${message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.isLoading.set(false);
    }
  }

  async prune(): Promise<void> {
    this.isPruning.set(true);
    try {
      await this.tauriService.invoke('restic_prune');
      this.snackBar.open('Prune completed successfully', 'Dismiss', { duration: 3000 });
      this.prunePreview.set(null);
      await this.loadSnapshots();
      await this.loadStats();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to prune repository';
      this.error.set(message);
      this.snackBar.open(`Error: ${message}`, 'Dismiss', { duration: 5000 });
      throw err;
    } finally {
      this.isPruning.set(false);
    }
  }

  // ========== Timer Operations ==========

  async loadTimers(): Promise<void> {
    try {
      const timers = await this.tauriService.invoke<TimerStatus[]>('systemd_list_timers');
      this.timers.set(timers);
    } catch (err) {
      console.error('Failed to load timers:', err);
    }
  }

  async enableTimer(name: string): Promise<void> {
    try {
      await this.tauriService.invoke('systemd_enable_timer', { name });
      this.snackBar.open('Timer enabled', 'Dismiss', { duration: 3000 });
      await this.loadTimers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to enable timer';
      this.error.set(message);
      this.snackBar.open(`Error: ${message}`, 'Dismiss', { duration: 5000 });
      throw err;
    }
  }

  async disableTimer(name: string): Promise<void> {
    try {
      await this.tauriService.invoke('systemd_disable_timer', { name });
      this.snackBar.open('Timer disabled', 'Dismiss', { duration: 3000 });
      await this.loadTimers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disable timer';
      this.error.set(message);
      this.snackBar.open(`Error: ${message}`, 'Dismiss', { duration: 5000 });
      throw err;
    }
  }

  // ========== Logs Operations ==========

  async loadLogs(lines: number = 100): Promise<void> {
    try {
      const logs = await this.tauriService.invoke<string[]>('systemd_get_service_logs', { lines });
      this.logs.set(logs);
    } catch (err) {
      console.error('Failed to load logs:', err);
    }
  }

  // ========== History Operations ==========

  async loadHistory(limit: number = 100): Promise<void> {
    try {
      const entries = await this.tauriService.invoke<BackupHistoryEntry[]>('history_get_entries', { limit });
      this.historyEntries.set(entries);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }

  async loadHistoryStats(days: number = 30): Promise<void> {
    try {
      const stats = await this.tauriService.invoke<HistoryStats>('history_get_stats', { days });
      this.historyStats.set(stats);
    } catch (err) {
      console.error('Failed to load history stats:', err);
    }
  }

  // ========== Notifications ==========

  private async sendNotification(title: string, body: string): Promise<void> {
    try {
      await this.tauriService.invoke('send_notification', { title, body });
    } catch (err) {
      console.error('Failed to send notification:', err);
    }
  }

  // ========== Refresh All ==========

  async refreshAll(): Promise<void> {
    this.isLoading.set(true);
    try {
      await Promise.all([
        this.checkMountStatus(),
        this.loadSnapshots(),
        this.loadStats(),
        this.loadTimers()
      ]);
    } finally {
      this.isLoading.set(false);
    }
  }
}
