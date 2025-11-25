import { Injectable, signal, inject } from '@angular/core';
import { TauriService } from '@core/services/tauri.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface SnapshotMetadata {
  id: string;
  timestamp: number;
  description: string;
  configType: string;
  filename: string;
}

export interface Snapshot extends SnapshotMetadata {
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class SnapshotService {
  private tauriService = inject(TauriService);
  private snackBar = inject(MatSnackBar);

  readonly snapshots = signal<SnapshotMetadata[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  /**
   * Create a snapshot of the current configuration
   */
  async createSnapshot(
    configType: string,
    description: string,
    content: string
  ): Promise<string> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const snapshotId = await this.tauriService.invoke<string>('create_snapshot', {
        configType,
        description,
        content
      });

      this.snackBar.open('Snapshot created successfully', 'Dismiss', { duration: 2000 });
      
      // Refresh the list
      await this.listSnapshots(configType);
      
      return snapshotId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create snapshot';
      this.error.set(errorMessage);
      this.snackBar.open(`Error: ${errorMessage}`, 'Dismiss', { duration: 5000 });
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * List all snapshots for a given config type
   */
  async listSnapshots(configType: string): Promise<SnapshotMetadata[]> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const snapshots = await this.tauriService.invoke<SnapshotMetadata[]>('list_snapshots', {
        configType
      });

      this.snapshots.set(snapshots);
      return snapshots;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to list snapshots';
      this.error.set(errorMessage);
      console.error('Error listing snapshots:', err);
      this.snapshots.set([]);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Restore a snapshot by ID
   */
  async restoreSnapshot(configType: string, snapshotId: string): Promise<string> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const content = await this.tauriService.invoke<string>('restore_snapshot', {
        configType,
        snapshotId
      });

      this.snackBar.open('Snapshot restored successfully', 'Dismiss', { duration: 2000 });
      return content;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restore snapshot';
      this.error.set(errorMessage);
      this.snackBar.open(`Error: ${errorMessage}`, 'Dismiss', { duration: 5000 });
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Delete a snapshot by ID
   */
  async deleteSnapshot(configType: string, snapshotId: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.tauriService.invoke('delete_snapshot', {
        configType,
        snapshotId
      });

      this.snackBar.open('Snapshot deleted', 'Dismiss', { duration: 2000 });
      
      // Refresh the list
      await this.listSnapshots(configType);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete snapshot';
      this.error.set(errorMessage);
      this.snackBar.open(`Error: ${errorMessage}`, 'Dismiss', { duration: 5000 });
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Get a specific snapshot's content
   */
  async getSnapshot(configType: string, snapshotId: string): Promise<Snapshot | null> {
    try {
      const content = await this.restoreSnapshot(configType, snapshotId);
      const metadata = this.snapshots().find(s => s.id === snapshotId);
      
      if (!metadata) {
        return null;
      }

      return {
        ...metadata,
        content
      };
    } catch (err) {
      console.error('Error getting snapshot:', err);
      return null;
    }
  }
}

