import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

type SidebarIcon = 'dashboard' | 'registry' | 'borrow' | 'return' | 'report';

interface SidebarNavItem {
  label: string;
  route: string;
  icon: SidebarIcon;
  description?: string;
  badge?: string;
  exact?: boolean;
}

interface SidebarNavGroup {
  title?: string;
  items: SidebarNavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  isOpen = input.required<boolean>();
  isCollapsed = input<boolean>(false);
  closeSidebar = output<void>();

  protected readonly navGroups: SidebarNavGroup[] = [
    {
      title: 'Overview',
      items: [
        {
          label: 'หน้าหลัก',
          route: '/dashboard',
          icon: 'dashboard',
          description: 'ภาพรวมระบบ',
          exact: true
        }
      ]
    },
    {
      title: 'Catalog',
      items: [
        {
          label: 'แจ้งการยืม',
          route: '/registry-books/borrow',
          icon: 'borrow',
          description: 'จัดการการยืม',
          exact: true
        },
        {
          label: 'แจ้งการคืน',
          route: '/registry-books/return',
          icon: 'return',
          description: 'จัดการการคืน',
          exact: true,
          badge: 'New'
        },
      ]
    },
    {
      title: 'Manage',
       items: [
        {
          label: 'รายการเล่มทะเบียน',
          route: '/registry-books',
          icon: 'registry',
          description: 'จัดการทะเบียนเล่ม',
          exact: false
        },
        {
          label: 'รายชื่อเจ้าหน้าที่',
          route: '/staff',
          icon: 'borrow',
          description: 'จัดการเจ้าหน้าที่',
          exact: false
        },
      ]
    },
    {
      title: 'Reports',
      items: [
        {
          label: 'รายงาน',
          route: '/reports',
          icon: 'report',
          description: 'รายงานสรุปข้อมูล',
          exact: true
        }
      ]
    }
  ];

  protected readonly currentUser = {
    initials: 'JI',
    name: 'Jinnawat Inyos',
    email: 'user@example.com'
  };

  protected onOverlayClick(): void {
    this.closeSidebar.emit();
  }

  protected onNavigate(): void {
    if (typeof window === 'undefined') return;

    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      this.closeSidebar.emit();
    }
  }

  protected getSidebarWidth(): string {
    if (!this.isOpen()) return '0';
    if (this.isCollapsed()) return '4rem'; // 64px for collapsed
    return '16rem'; // 256px for expanded
  }
}
