import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ContentService, DocEntry } from '../../../core/services/content.service';

type ConfigStatus = 'managed' | 'manual' | 'experimental';

interface ConfigCard {
  title: string;
  docPath: string;
  description: string;
  tags: string[];
  icon: string;
  lastUpdated?: string;
  status: ConfigStatus;
  anchor?: string;
}

interface ConfigMetadata extends Partial<ConfigCard> {
  anchor?: string;
}

const CONFIG_METADATA: Record<string, ConfigMetadata> = {
  'configs/hyprland.md': {
    icon: '🌀',
    tags: ['Wayland', 'Displays', 'Animations'],
    description: 'Primary Hyprland configuration covering monitors, window rules, and animations.',
    status: 'managed',
    lastUpdated: 'This week',
    anchor: 'hyprland'
  }
};

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss'
})
export class SettingsComponent implements OnInit {
  private contentService = inject(ContentService);
  private snackBar = inject(MatSnackBar);

  readonly cards = signal<ConfigCard[]>([]);
  readonly isLoading = signal(true);
  readonly lastRefresh = signal<Date | null>(null);

  readonly configCount = computed(() => this.cards().length);

  ngOnInit(): void {
    this.loadConfigs();
  }

  async refreshConfigs() {
    await this.loadConfigs(true);
  }

  trackByPath(_: number, card: ConfigCard) {
    return card.docPath;
  }

  async copyPath(docPath: string) {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('Clipboard API unavailable');
      }

      await navigator.clipboard.writeText(docPath);
      this.snackBar.open('Copied config path to clipboard', 'Dismiss', { duration: 2500 });
    } catch (error) {
      console.warn('Failed to copy config path', { docPath, error });
      this.snackBar.open('Copy failed. Check console for the path.', 'Dismiss', { duration: 3500 });
    }
  }

  private async loadConfigs(forceRefresh = false) {
    this.isLoading.set(true);
    try {
      const docs = await this.contentService.listDocs(forceRefresh);
      const configDocs = docs.filter(doc => doc.category.toLowerCase() === 'configs');

      const cards = configDocs.map(doc => this.toCard(doc));
      this.cards.set(cards);
      this.lastRefresh.set(new Date());
    } catch (error) {
      console.error('Unable to load config docs', error);
      this.cards.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  getAnchorId(card: ConfigCard) {
    return card.anchor ?? this.slugify(card.title);
  }

  private toCard(doc: DocEntry): ConfigCard {
    const metadata =
      CONFIG_METADATA[doc.path] ??
      CONFIG_METADATA[doc.path.toLowerCase()] ??
      {};

    return {
      title: metadata.title ?? doc.title,
      docPath: doc.path,
      description: metadata.description ?? 'Open the configuration file for the full reference.',
      tags: metadata.tags ?? ['dotfiles'],
      icon: metadata.icon ?? '🛠️',
      status: metadata.status ?? 'manual',
      lastUpdated: metadata.lastUpdated,
      anchor: metadata.anchor ?? this.slugify(doc.title)
    };
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }
}


