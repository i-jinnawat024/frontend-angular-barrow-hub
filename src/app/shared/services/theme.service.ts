import { DOCUMENT } from '@angular/common';
import { Injectable, OnDestroy, computed, effect, inject, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService implements OnDestroy {
  private readonly storageKey = 'theme-preference';
  private readonly document = inject(DOCUMENT);

  private readonly themePreference = signal<ThemePreference>('system');
  private readonly systemPrefersDark = signal(false);

  private readonly mediaQueryList = this.isBrowser()
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : undefined;

  readonly preference = computed(() => this.themePreference());

  readonly theme = computed<ThemeMode>(() => {
    const preference = this.themePreference();
    if (preference === 'system') {
      return this.systemPrefersDark() ? 'dark' : 'light';
    }

    return preference;
  });

  constructor() {
    if (this.isBrowser()) {
      const storedPreference = window.localStorage.getItem(this.storageKey) as ThemePreference | null;
      if (storedPreference === 'light' || storedPreference === 'dark' || storedPreference === 'system') {
        this.themePreference.set(storedPreference);
      }

      if (this.mediaQueryList) {
        this.systemPrefersDark.set(this.mediaQueryList.matches);
        this.mediaQueryList.addEventListener('change', this.onSystemPreferenceChange);
      }
    }

    effect(() => {
      const theme = this.theme();
      this.applyTheme(theme);
    });
  }

  ngOnDestroy(): void {
    if (this.mediaQueryList) {
      this.mediaQueryList.removeEventListener('change', this.onSystemPreferenceChange);
    }
  }

  setPreference(preference: ThemePreference): void {
    this.themePreference.set(preference);

    if (!this.isBrowser()) {
      return;
    }

    if (preference === 'system') {
      window.localStorage.removeItem(this.storageKey);
      return;
    }

    window.localStorage.setItem(this.storageKey, preference);
  }

  toggleTheme(): void {
    const current = this.theme();
    this.setPreference(current === 'dark' ? 'light' : 'dark');
  }

  cyclePreference(): void {
    const currentPreference = this.themePreference();

    if (currentPreference === 'light') {
      this.setPreference('dark');
    } else if (currentPreference === 'dark') {
      this.setPreference('system');
    } else {
      this.setPreference('light');
    }
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

    // Toggle the dark class once on both <html> and <body>
    rootElement.classList.toggle('dark', useDark);
    bodyElement.classList.toggle('dark', useDark);

    // Store the active mode so CSS and third-party libraries can react
    rootElement.setAttribute('data-theme', mode);
    bodyElement.setAttribute('data-theme', mode);

    rootElement.setAttribute('data-mode', mode);
    bodyElement.setAttribute('data-mode', mode);

    rootElement.setAttribute('data-color-scheme', mode);
    bodyElement.setAttribute('data-color-scheme', mode);

    rootElement.style.colorScheme = mode;
    bodyElement.style.colorScheme = mode;
  }

  private onSystemPreferenceChange = (event: MediaQueryListEvent): void => {
    this.systemPrefersDark.set(event.matches);
  };

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }
}
