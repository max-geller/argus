import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MarkdownComponent } from 'ngx-markdown';
import { ContentService } from '../../../core/services/content.service';

@Component({
  selector: 'app-doc-viewer',
  standalone: true,
  imports: [CommonModule, MarkdownComponent],
  templateUrl: './doc-viewer.html',
  styleUrl: './doc-viewer.css'
})
export class DocViewerComponent implements OnInit {
  content: string = 'Loading...';
  private route = inject(ActivatedRoute);
  private contentService = inject(ContentService);

  ngOnInit() {
    this.route.params.subscribe(params => {
      const docId = params['id'];
      if (docId) {
        this.loadDoc(docId);
      }
    });
  }

  async loadDoc(path: string) {
    try {
        // Decoding the path if it was encoded in URL
        const decodedPath = decodeURIComponent(path);
        this.content = await this.contentService.getContent(decodedPath);
    } catch (e) {
        this.content = `# Error loading document\n\nCould not load ${path}.\n\nError: ${e}`;
    }
  }
}
