import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TaskService } from '@core/services/task.service';
import { Release } from '@core/models/task.model';
// import { ReleaseDialogComponent } from './release-dialog/release-dialog'; // To be created

@Component({
  selector: 'app-releases-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './releases.html',
  styleUrl: './releases.scss'
})
export class ReleasesPageComponent {
  taskService = inject(TaskService);
  private dialog = inject(MatDialog);

  // Computed lists
  plannedReleases = computed(() => 
    this.taskService.releases().filter(r => r.status === 'active' && r.id !== this.taskService.activeRelease()?.id)
    // Note: In current model, only ONE active release. We might need to introduce 'planned' status.
    // For now, we'll assume 'active' is the current one, and we need a new status 'planned'.
  );

  pastReleases = computed(() => 
    this.taskService.releases().filter(r => r.status === 'released').sort((a, b) => 
      new Date(b.releasedAt!).getTime() - new Date(a.releasedAt!).getTime()
    )
  );

  activeTaskCount = computed(() => this.taskService.activeTasks().length);
  
  activeProgress = computed(() => {
    const tasks = this.taskService.activeTasks();
    if (tasks.length === 0) return 0;
    const done = tasks.filter(t => t.status === 'done').length;
    return (done / tasks.length) * 100;
  });

  canShip = computed(() => {
    const tasks = this.taskService.activeTasks();
    return tasks.length > 0 && tasks.every(t => t.status === 'done');
  });

  openAddRelease() {
    // TODO: Open dialog to create new planned release
    const version = prompt('Enter version for new release (e.g. v0.2.0):');
    if (version) {
      this.taskService.addRelease(version);
    }
  }

  editRelease(release: Release) {
    // TODO: Open dialog
  }

  deleteRelease(release: Release) {
    if (confirm(`Delete release ${release.version}?`)) {
      this.taskService.deleteRelease(release.id);
    }
  }

  async shipRelease() {
    if (confirm('Ship current release?')) {
      // Logic to ship
      const nextVersion = prompt('Enter next version:');
      if (nextVersion) {
        await this.taskService.completeRelease(nextVersion);
      }
    }
  }
}

