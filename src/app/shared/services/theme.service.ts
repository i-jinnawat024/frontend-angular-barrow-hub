import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storageKey = 'theme-preference';
  private readonly document = inject(DOCUMENT);

  private readonly themePreference = signal<ThemeMode>('light');

  readonly theme = computed(() => this.themePreference());

  constructor() {
    if (this.isBrowser()) {
      const storedPreference = window.localStorage.getItem(this.storageKey) as ThemeMode | null;

      let initialTheme: ThemeMode;
      if (storedPreference === 'light' || storedPreference === 'dark') {
        initialTheme = storedPreference;
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        initialTheme = prefersDark ? 'dark' : 'light';
      }
      
      this.themePreference.set(initialTheme);
      // Apply theme immediately on initialization
      this.applyTheme(initialTheme);
    }

    effect(() => {
      const theme = this.theme();
      this.applyTheme(theme);
    });
  }

  setPreference(preference: ThemeMode): void {
    this.themePreference.set(preference);

    if (!this.isBrowser()) {
      return;
    }

    window.localStorage.setItem(this.storageKey, preference);
  }

  toggleTheme(): void {
    const current = this.theme();
    this.setPreference(current === 'dark' ? 'light' : 'dark');
  }

  private applyTheme(mode: ThemeMode): void {
    if (!this.isBrowser()) {
      return;
    }

    const doc = this.document;
    const rootElement = doc?.documentElement;
    const bodyElement = doc?.body;

    if (!rootElement || !bodyElement) {
      return;
    }

    const useDark = mode === 'dark';

    rootElement.classList.toggle('dark', useDark);
    bodyElement.classList.toggle('dark', useDark);

    rootElement.setAttribute('data-theme', mode);
    bodyElement.setAttribute('data-theme', mode);

    rootElement.setAttribute('data-mode', mode);
    bodyElement.setAttribute('data-mode', mode);

    rootElement.setAttribute('data-color-scheme', mode);
    bodyElement.setAttribute('data-color-scheme', mode);

    rootElement.style.colorScheme = mode;
    bodyElement.style.colorScheme = mode;
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }
}
