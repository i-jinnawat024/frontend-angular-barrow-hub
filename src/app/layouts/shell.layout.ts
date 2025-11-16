import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../shared/components/header/header.component';
import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './shell.layout.html',
//   styleUrl: './shell.layout.scss'
})
export class ShellLayoutComponent implements OnInit, OnDestroy {
  private readonly initialDesktop = this.isDesktopViewport();
  private readonly router = inject(Router);

  // Sidebar state - defaults based on viewport
  protected readonly sidebarOpen = signal(this.initialDesktop);
  protected readonly sidebarCollapsed = signal(false);
  protected readonly isDesktopScreen = signal(this.initialDesktop);
  protected readonly hideShellChrome = signal(false);

  private desktopCollapsedCache = false;
  private resizeListener?: () => void;
  private routerSubscription?: Subscription;
  private readonly authOnlyRoutes = new Set(['/login', '/forgot-password']);

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

    this.updateShellVisibility(this.router.url);
    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.updateShellVisibility(event.urlAfterRedirects);
      }
    });
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined' && this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }

    this.routerSubscription?.unsubscribe();
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
    if (this.hideShellChrome()) {
      return '0';
    }

    if (!this.isDesktopScreen() || !this.sidebarOpen()) {
      return '0';
    }

    if (this.sidebarCollapsed()) return '4rem'; // 64px for collapsed
    return '16rem'; // 256px for expanded
  }

  private updateShellVisibility(url: string): void {
    const normalizedUrl = this.normalizeUrl(url);
    const shouldHide = this.authOnlyRoutes.has(normalizedUrl);
    this.hideShellChrome.set(shouldHide);

    if (shouldHide) {
      this.sidebarOpen.set(false);
      this.sidebarCollapsed.set(false);
      return;
    }

    this.syncSidebarForViewport(this.isDesktopViewport());
  }

  private normalizeUrl(url: string): string {
    if (!url) {
      return '/';
    }

    const urlWithoutQuery = url.split('?')[0];
    const urlWithoutHash = urlWithoutQuery.split('#')[0];
    return urlWithoutHash || '/';
  }
}
