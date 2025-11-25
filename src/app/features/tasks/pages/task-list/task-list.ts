import { Component, inject, ViewChild, AfterViewInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TaskService } from '@core/services/task.service';
import { Task, TaskStatus } from '@core/models/task.model';
import { AddTaskDialogComponent } from '../../components/add-task-dialog/add-task-dialog';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    MatDividerModule,
    MatDialogModule
  ],
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss'
})
export class TaskListComponent implements AfterViewInit {
  taskService = inject(TaskService);
  private dialog = inject(MatDialog);
  
  displayedColumns: string[] = ['status', 'title', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<Task>([]);
  
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    effect(() => {
      this.dataSource.data = this.taskService.activeTasks();
    });
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    
    // Custom sorting for status to group logic correctly
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch(property) {
        case 'status': 
          // Custom order: todo -> in_progress -> done
          const order = { 'todo': 1, 'in_progress': 2, 'done': 3 };
          return order[item.status];
        default: 
          // @ts-ignore
          return item[property];
      }
    };
  }

  formatStatus(status: string): string {
    return status.replace('_', ' ');
  }

  async updateStatus(task: Task, status: TaskStatus) {
    await this.taskService.updateTaskStatus(task.id, status);
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
}

