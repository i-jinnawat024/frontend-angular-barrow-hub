import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../shared/components/header/header.component';
import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './shell.layout.html',
//   styleUrl: './shell.layout.scss'
})
export class ShellLayoutComponent implements OnInit, OnDestroy {
  private readonly initialDesktop = this.isDesktopViewport();

  // Sidebar state - defaults based on viewport
  protected readonly sidebarOpen = signal(this.initialDesktop);
  protected readonly sidebarCollapsed = signal(false);
  protected readonly isDesktopScreen = signal(this.initialDesktop);

  private desktopCollapsedCache = false;
  private resizeListener?: () => void;

  ngOnInit(): void {
    this.syncSidebarForViewport(this.isDesktopScreen());

    if (typeof window === 'undefined') {
      return;
    }

    this.resizeListener = () => {
      const isDesktop = this.isDesktopViewport();
      if (isDesktop !== this.isDesktopScreen()) {
        this.isDesktopScreen.set(isDesktop);
        this.syncSidebarForViewport(isDesktop);
      }
    };

    window.addEventListener('resize', this.resizeListener);
  }

  ngOnDestroy(): void {
    if (typeof window === 'undefined' || !this.resizeListener) {
      return;
    }

    window.removeEventListener('resize', this.resizeListener);
  }

  private isDesktopViewport(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;
  }

  private syncSidebarForViewport(isDesktop: boolean): void {
    if (isDesktop) {
      this.sidebarOpen.set(true);
      this.sidebarCollapsed.set(this.desktopCollapsedCache);
      return;
    }

    this.desktopCollapsedCache = this.sidebarCollapsed();
    this.sidebarOpen.set(false);
    this.sidebarCollapsed.set(false);
  }

  protected toggleSidebar(): void {
    const isDesktop = this.isDesktopScreen();

    if (isDesktop) {
      if (!this.sidebarOpen()) {
        this.sidebarOpen.set(true);
        this.sidebarCollapsed.set(false);
        this.desktopCollapsedCache = false;
        return;
      }

      const collapsed = this.sidebarCollapsed();
      this.sidebarCollapsed.set(!collapsed);
      this.desktopCollapsedCache = !collapsed;
      return;
    }

    const shouldOpen = !this.sidebarOpen();
    this.sidebarOpen.set(shouldOpen);

    if (shouldOpen) {
      this.sidebarCollapsed.set(false);
    }
  }

  protected closeSidebar(): void {
    if (this.isDesktopScreen()) {
      return;
    }

    this.sidebarOpen.set(false);
    this.sidebarCollapsed.set(false);
  }

  protected getMainMarginLeft(): string {
    if (!this.isDesktopScreen() || !this.sidebarOpen()) {
      return '0';
    }

    if (this.sidebarCollapsed()) return '4rem'; // 64px for collapsed
    return '16rem'; // 256px for expanded
  }
}
