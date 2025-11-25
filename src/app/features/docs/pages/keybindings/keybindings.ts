import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSort, MatSortModule } from '@angular/material/sort';

interface Keybinding {
  category: string;
  key: string;
  action: string;
  description: string;
}

@Component({
  selector: 'app-keybindings',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSortModule
  ],
  templateUrl: './keybindings.html',
  styleUrl: './keybindings.scss'
})
export class KeybindingsComponent implements OnInit {
  displayedColumns: string[] = ['category', 'key', 'action', 'description'];
  dataSource = new MatTableDataSource<Keybinding>();
  private http = inject(HttpClient);

  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.http.get<Keybinding[]>('assets/keybindings.json').subscribe(data => {
      this.dataSource.data = data;
      this.dataSource.sort = this.sort;
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
