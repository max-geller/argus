// ============================================================================
// Restic Backup Management Types
// ============================================================================

export interface Snapshot {
  id: string;
  short_id: string;
  time: string;
  hostname: string;
  paths: string[];
  tags: string[];
}

export interface SnapshotDisplay {
  id: string;
  shortId: string;
  name: string;           // From "name:X" tag
  source: 'manual' | 'scheduled';
  date: Date;
  paths: string[];
  tags: string[];
  isSelected: boolean;
}

export interface RepoStats {
  total_size: number;
  total_file_count: number;
  snapshots_count: number;
}

export interface MountStatus {
  mounted: boolean;
  path: string;
  device?: string;
  fs_type?: string;
}

export interface TimerStatus {
  name: string;
  enabled: boolean;
  active: boolean;
  next_run?: string;
  last_run?: string;
  last_result?: string;
}

export interface FileNode {
  name: string;
  type: string;  // 'file' | 'dir'
  path: string;
  size?: number;
  mtime?: string;
}

export interface DiffResult {
  added: string[];
  removed: string[];
  modified: string[];
}

export interface RestoreRequest {
  snapshot_id: string;
  source_paths: string[];      // Paths within snapshot to restore
  target_dir: string;          // Where to restore to
  overwrite: boolean;
}

export interface PrunePreview {
  keep: string[];
  remove: string[];
  total_to_remove: number;
}

export interface CheckResult {
  success: boolean;
  message: string;
}

// ============================================================================
// Config Types (matching restic-tui config.toml structure)
// ============================================================================

export interface ResticConfig {
  repository: RepositoryConfig;
  mount: MountConfig;
  backup: BackupConfig;
  systemd: SystemdConfig;
  retention: RetentionConfig;
}

export interface RepositoryConfig {
  path: string;
  password_file: string;
}

export interface MountConfig {
  path: string;
  auto_mount: boolean;
  mount_command: string;
}

export interface BackupConfig {
  script?: string;
  paths: string[];
  excludes: string[];
  tag: string;
}

export interface SystemdConfig {
  timer: string;
  service: string;
}

export interface RetentionConfig {
  daily: number;
  weekly: number;
  monthly: number;
}

// ============================================================================
// History Types
// ============================================================================

export interface BackupHistoryEntry {
  id?: number;
  timestamp: string;
  snapshot_id: string;
  source: 'manual' | 'scheduled';
  total_size: number;
  files_count: number;
  data_added: number;
  duration: number;           // seconds
}

export interface HistoryStats {
  total_backups: number;
  total_data_backed_up: number;
  average_duration: number;
  size_over_time: SizeDataPoint[];
  backups_per_week: WeeklyCount[];
}

export interface SizeDataPoint {
  date: string;
  size: number;
}

export interface WeeklyCount {
  week: string;
  count: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

export function snapshotToDisplay(snapshot: Snapshot): SnapshotDisplay {
  // Extract name from tags (looking for "name:XXX" pattern)
  const nameTag = snapshot.tags.find(t => t.startsWith('name:'));
  const name = nameTag ? nameTag.substring(5) : '';

  // Determine source from tags
  const isManual = snapshot.tags.includes('manual');
  const source: 'manual' | 'scheduled' = isManual ? 'manual' : 'scheduled';

  return {
    id: snapshot.id,
    shortId: snapshot.short_id,
    name,
    source,
    date: new Date(snapshot.time),
    paths: snapshot.paths,
    tags: snapshot.tags,
    isSelected: false
  };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

export function getDefaultConfig(): ResticConfig {
  return {
    repository: {
      path: '/media/nas_backup/restic-repo',
      password_file: '~/.config/restic/password.txt'
    },
    mount: {
      path: '/media/nas_backup',
      auto_mount: true,
      mount_command: 'sudo mount /media/nas_backup'
    },
    backup: {
      paths: ['~/.config', '~/.local/bin'],
      excludes: ['*.cache', 'node_modules', '.venv'],
      tag: 'fedora'
    },
    systemd: {
      timer: 'restic-backup.timer',
      service: 'restic-backup.service'
    },
    retention: {
      daily: 7,
      weekly: 4,
      monthly: 6
    }
  };
}
