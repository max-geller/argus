export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  releaseId?: string;
  createdAt: string;
  updatedAt: string;
  order?: number;
}

export interface Release {
  id: string;
  version: string; // e.g., "v0.1.0"
  status: 'active' | 'released';
  releasedAt?: string;
  description?: string;
}

export interface TaskData {
  tasks: Task[];
  releases: Release[];
  currentVersion: string;
}

