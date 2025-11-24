import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';

@Injectable({
  providedIn: 'root'
})
export class TauriService {
  async invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
    return await invoke<T>(cmd, args);
  }
}

