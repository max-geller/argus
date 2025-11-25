import { Injectable } from '@angular/core';

// Dynamically import Tauri API only if available
declare global {
  interface Window {
    __TAURI__?: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class TauriService {
  private isTauriAvailable(): boolean {
    return typeof window !== 'undefined' && window.__TAURI__ !== undefined;
  }

  async invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
    if (!this.isTauriAvailable()) {
      throw new Error('Tauri API is not available. Make sure you are running the app with `npm run tauri dev` or as a built desktop application.');
    }

    // Dynamically import the invoke function from Tauri
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<T>(cmd, args);
  }

  isRunningInTauri(): boolean {
    return this.isTauriAvailable();
  }
}

