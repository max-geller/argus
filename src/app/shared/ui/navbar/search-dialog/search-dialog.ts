import { Component, inject, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { SearchService, SearchResult } from '@core/services/search.service';

@Component({
  selector: 'app-search-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './search-dialog.html',
  styleUrl: './search-dialog.scss'
})
export class SearchDialogComponent implements AfterViewInit {
  results: SearchResult[] = [];
  selectedIndex = 0;
  private searchService = inject(SearchService);
  private dialogRef = inject(MatDialogRef<SearchDialogComponent>);
  private router = inject(Router);

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  ngAfterViewInit() {
    // Auto-focus the input
    setTimeout(() => this.searchInput.nativeElement.focus(), 0);
  }

  onSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.results = this.searchService.search(query);
    this.selectedIndex = 0;
  }

  onKeydown(event: KeyboardEvent) {
    if (!this.results.length) {
      return;
    }

    if (event.key === 'ArrowDown') {
      this.selectedIndex = (this.selectedIndex + 1) % this.results.length;
      event.preventDefault();
    } else if (event.key === 'ArrowUp') {
      this.selectedIndex = (this.selectedIndex - 1 + this.results.length) % this.results.length;
      event.preventDefault();
    } else if (event.key === 'Enter') {
      this.navigateTo(this.results[this.selectedIndex]);
    }
  }

  navigateTo(result: SearchResult) {
    if (Array.isArray(result.path)) {
      this.router.navigate(result.path);
    } else {
      this.router.navigate([result.path]);
    }
    this.dialogRef.close();
  }
}
