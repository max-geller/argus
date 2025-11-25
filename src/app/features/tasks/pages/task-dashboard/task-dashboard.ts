import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TaskService } from '@core/services/task.service';
import { Task, TaskStatus } from '@core/models/task.model';
import { AddTaskDialogComponent } from '../../components/add-task-dialog/add-task-dialog';

@Component({
  selector: 'app-task-dashboard',
  standalone: true,
  imports: [CommonModule, DragDropModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './task-dashboard.html',
  styleUrl: './task-dashboard.scss'
})
export class TaskDashboardComponent {
  taskService = inject(TaskService);
  private dialog = inject(MatDialog);

  canRelease = computed(() => {
    const todo = this.taskService.todoTasks().length;
    const inProgress = this.taskService.inProgressTasks().length;
    const done = this.taskService.doneTasks().length;
    // Can release if there are done tasks and no pending tasks
    return todo === 0 && inProgress === 0 && done > 0;
  });

  async drop(event: CdkDragDrop<Task[]>, status: string) {
    const newStatus = status as TaskStatus;
    if (event.previousContainer === event.container) {
      // Reordering logic would go here
    } else {
      const task = event.item.data as Task;
      await this.taskService.updateTaskStatus(task.id, newStatus);
    }
  }

  async deleteTask(task: Task) {
    if (confirm('Are you sure you want to delete this task?')) {
      await this.taskService.deleteTask(task.id);
    }
  }

  openAddTask() {
    this.dialog.open(AddTaskDialogComponent, {
      width: '400px',
      panelClass: 'task-dialog-panel'
    });
  }

  async completeRelease() {
    const currentVersion = this.taskService.currentVersion();
    const parts = currentVersion.replace('v', '').split('.').map(Number);
    if (parts.length === 3) {
        parts[2]++;
    } else {
        // Fallback if version format is weird
        parts.length = 0; 
        parts.push(0, 0, 1);
    }
    const nextVersion = `v${parts.join('.')}`;
    
    if (confirm(`Ship release ${currentVersion} and start ${nextVersion}?`)) {
        await this.taskService.completeRelease(nextVersion);
    }
  }
}

