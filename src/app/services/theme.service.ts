import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'timeblock-theme';
  isDarkMode = signal<boolean>(false);

  constructor() {
    this.loadTheme();
  }

  toggleTheme(): void {
    this.isDarkMode.update(dark => !dark);
    this.applyTheme();
  }

  private loadTheme(): void {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem(this.THEME_KEY);
      if (savedTheme) {
        this.isDarkMode.set(savedTheme === 'dark');
      } else {
        // Fallback to system preference
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.isDarkMode.set(systemPrefersDark);
      }
      this.applyTheme();
    }
  }

  private applyTheme(): void {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      if (this.isDarkMode()) {
        root.classList.add('dark');
        localStorage.setItem(this.THEME_KEY, 'dark');
      } else {
        root.classList.remove('dark');
        localStorage.setItem(this.THEME_KEY, 'light');
      }
    }
  }
}
