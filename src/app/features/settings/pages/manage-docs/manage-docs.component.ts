import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DocsConfigService } from '@core/services/config/docs-config.service';
import { ContentService } from '@core/services/content.service';
import { NavGroup, NavItem } from '@shared/ui/sidenav/sidenav';

@Component({
  selector: 'app-manage-docs',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    MatExpansionModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  templateUrl: './manage-docs.component.html',
  styleUrl: './manage-docs.component.scss'
})
export class ManageDocsComponent implements OnInit {
  private docsConfigService = inject(DocsConfigService);
  private contentService = inject(ContentService);
  private snackBar = inject(MatSnackBar);

  groups = signal<NavGroup[]>([]);

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      const docs = await this.contentService.listDocs();
      const ordered = this.docsConfigService.getOrderedGroups(docs);
      this.groups.set(ordered);
    } catch (error) {
      console.error('Failed to load docs for management', error);
      this.snackBar.open('Failed to load documentation list', 'Close', { duration: 3000 });
    }
  }

  dropGroup(event: CdkDragDrop<NavGroup[]>) {
    const currentGroups = this.groups();
    moveItemInArray(currentGroups, event.previousIndex, event.currentIndex);
    this.groups.set([...currentGroups]); // Trigger signal update
    this.save();
  }

  dropItem(event: CdkDragDrop<NavItem[]>, group: NavGroup) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    this.save();
  }

  save() {
    this.docsConfigService.saveOrder(this.groups());
    // Optional: Show a small toast or just auto-save silently
    // this.snackBar.open('Order saved', undefined, { duration: 1000 });
  }

  resetToDefault() {
    localStorage.removeItem('maxos_docs_order');
    this.loadData();
    this.snackBar.open('Reset to default order', 'Close', { duration: 2000 });
  }
}

