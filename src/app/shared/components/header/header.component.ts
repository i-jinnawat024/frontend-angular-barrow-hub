import { CommonModule } from '@angular/common';
import { Component, input, output, signal, OnInit, OnDestroy, effect, computed } from '@angular/core';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ThemeToggleComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  sidebarOpen = input<boolean>(false);
  toggleSidebar = output<void>();
  closeSidebar = output<void>();

  private readonly isDesktopScreen = signal(this.checkIsDesktop());
  private resizeListener?: () => void;

  protected readonly headerMarginLeft = signal('0');
  protected readonly isDesktopView = computed(() => this.isDesktopScreen());

  sidebarCollapsed = input<boolean>(false);

  protected readonly toggleIcon = computed(() => {
    const isDesktop = this.isDesktopView();
    const isOpen = this.sidebarOpen();
    const isCollapsed = this.sidebarCollapsed();

    if (!isDesktop) {
      return isOpen ? 'close' : 'menu';
    }

    if (!isOpen) {
      return 'menu';
    }

    return isCollapsed ? 'expand' : 'collapse';
  });

  protected readonly toggleLabel = computed(() => {
    const icon = this.toggleIcon();

    switch (icon) {
      case 'close':
        return 'Close navigation menu';
      case 'expand':
        return 'Expand sidebar';
      case 'collapse':
        return 'Collapse sidebar';
      default:
        return 'Open navigation menu';
    }
  });

  constructor() {
    // Update header margin when sidebar state or screen size changes
    effect(() => {
      const sidebarOpen = this.sidebarOpen();
      const sidebarCollapsed = this.sidebarCollapsed();
      const isDesktop = this.isDesktopScreen();
      
      if (isDesktop && sidebarOpen) {
        if (sidebarCollapsed) {
          this.headerMarginLeft.set('4rem'); // 64px for collapsed
        } else {
          this.headerMarginLeft.set('16rem'); // 256px for expanded
        }
      } else {
        this.headerMarginLeft.set('0');
      }
    });
  }

  ngOnInit(): void {
    this.resizeListener = () => {
      this.isDesktopScreen.set(this.checkIsDesktop());
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.resizeListener);
    }
  }

  ngOnDestroy(): void {
    if (this.resizeListener && typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  protected onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  protected getHeaderMarginLeft(): string {
    return this.headerMarginLeft();
  }

  private checkIsDesktop(): boolean {
    return typeof window !== 'undefined' && window.innerWidth >= 768;
  }
}
