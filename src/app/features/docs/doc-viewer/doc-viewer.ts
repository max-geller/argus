import { Component, ElementRef, ViewChild, inject, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MarkdownComponent } from 'ngx-markdown';
import { ContentService } from '../../../core/services/content.service';
import { TocComponent } from '../toc/toc';

@Component({
  selector: 'app-doc-viewer',
  standalone: true,
  imports: [CommonModule, MarkdownComponent, TocComponent],
  templateUrl: './doc-viewer.html',
  styleUrl: './doc-viewer.css'
})
export class DocViewerComponent implements OnInit, AfterViewInit {
  content: string = 'Loading...';
  private route = inject(ActivatedRoute);
  private contentService = inject(ContentService);
  @ViewChild('markdownHost') markdownHost?: ElementRef<HTMLElement>;

  ngOnInit() {
    this.route.params.subscribe(params => {
      const docId = params['id'];
      if (docId) {
        this.loadDoc(docId);
      }
    });
  }

  ngAfterViewInit(): void {
    // Ensure headings get IDs on initial load if content already present
    setTimeout(() => this.applyHeadingAnchors(), 0);
  }

  async loadDoc(path: string) {
    try {
        // Decoding the path if it was encoded in URL
        const decodedPath = decodeURIComponent(path);
        this.content = await this.contentService.getContent(decodedPath);
        setTimeout(() => this.applyHeadingAnchors(), 0);
    } catch (e) {
        this.content = `# Error loading document\n\nCould not load ${path}.\n\nError: ${e}`;
    }
  }

  private applyHeadingAnchors() {
    const host = this.markdownHost?.nativeElement;
    if (!host) return;
    const headings = host.querySelectorAll('h2, h3');
    headings.forEach(heading => {
      const text = heading.textContent?.trim() ?? '';
      if (!text) return;
      heading.id = this.slugify(text);
    });
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }
}
