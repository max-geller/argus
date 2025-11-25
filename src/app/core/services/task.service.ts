import { Injectable, computed, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { readFile, writeFile, exists } from '@tauri-apps/plugin-fs';
import { Task, Release, TaskData, TaskStatus } from '../models/task.model';

const TASKS_FILE_PATH = '/home/maxgeller/Code/Angular/MaxOS/argus/src/assets/tasks/tasks.json';

const INITIAL_DATA: TaskData = {
  tasks: [],
  releases: [
    {
      id: 'initial-release',
      version: 'v0.0.1',
      status: 'active'
    }
  ],
  currentVersion: 'v0.0.1'
};

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  // State signals
  private state = signal<TaskData>(INITIAL_DATA);
  private platformId = inject(PLATFORM_ID);
  
  // Computed selectors
  tasks = computed(() => this.state().tasks);
  releases = computed(() => this.state().releases);
  currentVersion = computed(() => this.state().currentVersion);
  activeRelease = computed(() => this.state().releases.find(r => r.status === 'active'));
  activeReleaseId = computed(() => this.activeRelease()?.id);
  
  // Filter tasks that belong to the active release
  activeTasks = computed(() => {
    const activeId = this.activeReleaseId();
    if (!activeId) return this.tasks();
    return this.tasks().filter(t => t.releaseId === activeId);
  });
  
  // Filtered tasks
  todoTasks = computed(() => this.activeTasks().filter(t => t.status === 'todo').sort((a, b) => (a.order || 0) - (b.order || 0)));
  inProgressTasks = computed(() => this.activeTasks().filter(t => t.status === 'in_progress').sort((a, b) => (a.order || 0) - (b.order || 0)));
  doneTasks = computed(() => this.activeTasks().filter(t => t.status === 'done').sort((a, b) => (a.order || 0) - (b.order || 0)));

  constructor() {
    // Only load data if in a browser environment (Angular Universal safety)
    if (isPlatformBrowser(this.platformId)) {
      this.loadData();
    }
  }

  private get isTauri(): boolean {
    // Check if the Tauri global object exists
    return !!(window as any).__TAURI_INTERNALS__;
  }

  async loadData() {
    if (!this.isTauri) {
      console.warn('TaskService: Not running in Tauri environment. Persistence disabled.');
      return;
    }

    try {
      const fileExists = await exists(TASKS_FILE_PATH);
      if (fileExists) {
        const contents = await readFile(TASKS_FILE_PATH);
        const text = new TextDecoder().decode(contents);
        const data = JSON.parse(text) as TaskData;
        this.state.set(data);
      } else {
        await this.saveData(INITIAL_DATA);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }

  async saveData(data: TaskData) {
    if (!this.isTauri) {
      console.warn('TaskService: Not running in Tauri environment. Cannot save.');
      this.state.set(data); // Update local state anyway for session persistence
      return;
    }

    try {
      const text = JSON.stringify(data, null, 2);
      const bytes = new TextEncoder().encode(text);
      await writeFile(TASKS_FILE_PATH, bytes);
      this.state.set(data);
    } catch (error) {
      console.error('Failed to save tasks:', error);
    }
  }

  async addTask(title: string, description?: string) {
    const current = this.state();
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      description,
      status: 'todo',
      releaseId: this.activeRelease()?.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: current.tasks.length
    };

    const newData = {
      ...current,
      tasks: [...current.tasks, newTask]
    };

    await this.saveData(newData);
  }

  async updateTaskStatus(taskId: string, status: TaskStatus) {
    const current = this.state();
    const newData = {
      ...current,
      tasks: current.tasks.map(t => 
        t.id === taskId 
          ? { ...t, status, updatedAt: new Date().toISOString() } 
          : t
      )
    };
    await this.saveData(newData);
  }

  async updateTask(updatedTask: Task) {
    const current = this.state();
    const newData = {
      ...current,
      tasks: current.tasks.map(t => 
        t.id === updatedTask.id ? updatedTask : t
      )
    };
    await this.saveData(newData);
  }

  async deleteTask(taskId: string) {
    const current = this.state();
    const newData = {
      ...current,
      tasks: current.tasks.filter(t => t.id !== taskId)
    };
    await this.saveData(newData);
  }

  async completeRelease(nextVersion: string) {
    const current = this.state();
    const active = this.activeRelease();
    
    if (!active) return;

    const completedRelease: Release = {
      ...active,
      status: 'released',
      releasedAt: new Date().toISOString()
    };

    const newRelease: Release = {
      id: crypto.randomUUID(),
      version: nextVersion,
      status: 'active'
    };

    const newData: TaskData = {
      tasks: current.tasks, // Keep tasks, or maybe archive them? User didn't specify archiving logic details, keeping them is safer.
      releases: current.releases.map(r => r.id === active.id ? completedRelease : r).concat(newRelease),
      currentVersion: nextVersion
    };

    await this.saveData(newData);
  }
}
