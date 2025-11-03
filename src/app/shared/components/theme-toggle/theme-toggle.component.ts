import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, effect, inject } from '@angular/core';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThemeToggleComponent {
  private readonly themeService = inject(ThemeService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly preference = computed(() => this.themeService.preference());
  protected readonly currentTheme = computed(() => this.themeService.theme());

  constructor() {
    // Trigger change detection when the theme changes
    effect(() => {
      this.themeService.theme();
      this.themeService.preference();
      this.cdr.markForCheck();
    });
  }

  protected readonly icon = computed<'sun' | 'moon' | 'laptop'>(() => {
    const preference = this.preference();

    if (preference === 'light') {
      return 'sun';
    }

    if (preference === 'dark') {
      return 'moon';
    }

    return 'laptop';
  });

  protected readonly label = computed(() => {
    const preference = this.preference();

    switch (preference) {
      case 'light':
        return 'Toggle theme (currently light mode)';
      case 'dark':
        return 'Toggle theme (currently dark mode)';
      default:
        return 'Toggle theme (currently following system)';
    }
  });

  protected onToggle(): void {
    this.themeService.cyclePreference();
    this.cdr.markForCheck();
  }

  protected getPreferenceLabel(): string {
    const preference = this.preference();
    switch (preference) {
      case 'light':
        return 'Light mode';
      case 'dark':
        return 'Dark mode';
      default:
        return 'System default';
    }
  }
}
