import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ContentService, DocEntry } from '@core/services/content.service';

interface DocCard {
  title: string;
  docPath: string;
  description: string;
  category: string;
  icon: string;
}

@Component({
  selector: 'app-docs-page',
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
  templateUrl: './docs.page.html',
  styleUrl: './docs.page.scss'
})
export class DocsPageComponent implements OnInit {
  private contentService = inject(ContentService);
  private snackBar = inject(MatSnackBar);

  readonly cards = signal<DocCard[]>([]);
  readonly isLoading = signal(true);
  readonly lastRefresh = signal<Date | null>(null);

  readonly docCount = computed(() => this.cards().length);
  readonly categoryCount = computed(() => {
    const categories = new Set(this.cards().map(c => c.category));
    return categories.size;
  });

  ngOnInit(): void {
    this.loadDocs();
  }

  async refreshDocs() {
    await this.loadDocs(true);
  }

  trackByPath(_: number, card: DocCard) {
    return card.docPath;
  }

  private async loadDocs(forceRefresh = false) {
    this.isLoading.set(true);
    try {
      const docs = await this.contentService.listDocs(forceRefresh);
      const cards = docs.map(doc => this.toCard(doc));
      this.cards.set(cards);
      this.lastRefresh.set(new Date());
    } catch (error) {
      console.error('Unable to load documentation', error);
      this.cards.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private toCard(doc: DocEntry): DocCard {
    const iconMap: Record<string, string> = {
      'Guides': '📘',
      'Cheatsheets': '📝',
      'Configs': '⚙️',
      'Setup': '🚀',
      'Widgets': '🧩',
      'Tools': '🔧',
      'General': '📄'
    };

    return {
      title: doc.title,
      docPath: doc.path,
      description: `${doc.category} documentation`,
      category: doc.category,
      icon: iconMap[doc.category] || '📄'
    };
  }

  getCategoryCards(category: string): DocCard[] {
    return this.cards().filter(card => card.category === category);
  }

  get categories(): string[] {
    const cats = new Set(this.cards().map(c => c.category));
    return Array.from(cats).sort();
  }
}

