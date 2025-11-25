import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { TaskService } from '@core/services/task.service';

@Component({
  selector: 'app-add-task-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatButtonModule, 
    MatInputModule, 
    MatFormFieldModule, 
    MatDialogModule,
    MatSelectModule
  ],
  templateUrl: './add-task-dialog.html',
  styles: [`
    .dialog-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding-top: 1rem;
    }
    mat-form-field {
      width: 100%;
    }
  `]
})
export class AddTaskDialogComponent {
  title = '';
  description = '';
  selectedReleaseId = '';
  
  taskService = inject(TaskService);
  dialogRef = inject(MatDialogRef<AddTaskDialogComponent>);

  constructor() {
    const active = this.taskService.activeRelease();
    if (active) {
      this.selectedReleaseId = active.id;
    }
  }

  async save() {
    if (!this.title.trim()) return;
    
    await this.taskService.addTask(this.title, this.description, this.selectedReleaseId);
    this.dialogRef.close(true);
  }
}
