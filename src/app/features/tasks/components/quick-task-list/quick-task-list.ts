import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TaskService } from '@core/services/task.service';
import { LayoutService } from '@core/services/layout.service';
import { Task } from '@core/models/task.model';

@Component({
  selector: 'app-quick-task-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCheckboxModule],
  templateUrl: './quick-task-list.html',
  styleUrl: './quick-task-list.scss'
})
export class QuickTaskListComponent {
  taskService = inject(TaskService);
  layoutService = inject(LayoutService);
  private router = inject(Router);

  close() {
    this.layoutService.closeTaskSidenav();
  }

  viewBoard() {
    this.router.navigate(['/tasks']);
    this.close();
  }

  async completeTask(task: Task) {
    await this.taskService.updateTaskStatus(task.id, 'done');
  }

  async startTask(task: Task) {
    await this.taskService.updateTaskStatus(task.id, 'in_progress');
  }

  async addTask(title: string) {
    if (!title.trim()) return;
    await this.taskService.addTask(title);
  }
}

