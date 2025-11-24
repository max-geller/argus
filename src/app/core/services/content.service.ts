import { Injectable } from '@angular/core';
import { TauriService } from './tauri.service';

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  constructor(private tauriService: TauriService) {}

  async getContent(path: string): Promise<string> {
    return this.tauriService.invoke<string>('get_content', { path });
  }
}

