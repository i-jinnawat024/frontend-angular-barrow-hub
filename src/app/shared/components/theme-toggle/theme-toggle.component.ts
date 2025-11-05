import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, effect, inject } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThemeToggleComponent {
  private readonly themeService = inject(ThemeService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly theme = computed(() => this.themeService.theme());

  constructor() {
    // Trigger change detection when the theme changes
    effect(() => {
      this.themeService.theme();
      this.cdr.markForCheck();
    });
  }

  protected readonly icon = computed<'sun' | 'moon'>(() => {
    return this.theme() === 'dark' ? 'moon' : 'sun';
  });

  protected readonly label = computed(() => {
    return this.theme() === 'dark'
      ? 'Switch to light mode'
      : 'Switch to dark mode';
  });

  protected onToggle(): void {
    this.themeService.toggleTheme();
    this.cdr.markForCheck();
  }

  protected getPreferenceLabel(): string {
    return this.theme() === 'dark' ? 'Dark mode' : 'Light mode';
  }
}
