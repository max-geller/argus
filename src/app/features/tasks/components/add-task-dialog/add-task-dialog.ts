import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TaskService } from '@core/services/task.service';

@Component({
  selector: 'app-add-task-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatInputModule, MatFormFieldModule, MatDialogModule],
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
  
  taskService = inject(TaskService);
  dialogRef = inject(MatDialogRef<AddTaskDialogComponent>);

  async save() {
    if (!this.title.trim()) return;
    
    await this.taskService.addTask(this.title, this.description);
    this.dialogRef.close(true);
  }
}

