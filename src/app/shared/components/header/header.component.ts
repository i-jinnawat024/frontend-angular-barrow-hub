import { CommonModule } from '@angular/common';
import { Component, input, output, signal, OnInit, OnDestroy, effect } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
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

  sidebarCollapsed = input<boolean>(false);

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

  protected getToggleButtonWidth(): string {
    // Add margin to nav to account for toggle button width
    return '3.5rem'; // 56px (h-14)
  }

  private checkIsDesktop(): boolean {
    return typeof window !== 'undefined' && window.innerWidth >= 768;
  }
}
