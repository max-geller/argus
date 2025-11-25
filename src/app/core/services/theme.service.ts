import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  isDark = signal<boolean>(true);

  constructor() {
    // Load saved theme preference or default to dark
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.isDark.set(savedTheme === 'dark');
    } else {
      // No saved preference, apply dark theme immediately
      document.documentElement.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    }

    effect(() => {
      const isDark = this.isDark();
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      if (isDark) {
        document.documentElement.classList.add('dark-theme');
      } else {
        document.documentElement.classList.remove('dark-theme');
      }
    });
  }

  toggleTheme() {
    this.isDark.update(d => !d);
  }
}

