import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'registry-books',
    loadComponent: () => import('./features/registry-books/pages/document-list/registry-book-list.page').then(m => m.RegistryBookListPage)
  },
  // ต้องใส่ routes ที่เจาะจงก่อน routes ที่มี parameter
  {
    path: 'registry-books/create',
    loadComponent: () => import('./features/registry-books/pages/registry-book-form/registry-book-form.page').then(m => m.RegistryBookFormPage)
  },
  {
    path: 'registry-books/borrow',
    loadComponent: () => import('./features/registry-books/pages/borrow/borrow.page').then(m => m.BorrowPage)
  },
  {
    path: 'registry-books/return',
    loadComponent: () => import('./features/registry-books/pages/return/return.page').then(m => m.ReturnPage)
  },
  {
    path: 'registry-books/:id/edit',
    loadComponent: () => import('./features/registry-books/pages/registry-book-form/registry-book-form.page').then(m => m.RegistryBookFormPage)
  },
  {
    path: 'registry-books/:id/history',
    loadComponent: () => import('./features/registry-books/pages/registry-book-history/registry-book-history.page').then(m => m.RegistryBookHistoryPage)
  },
  {
    path: 'registry-books/:id',
    loadComponent: () => import('./features/registry-books/pages/registry-book-detail/registry-book-detail.page').then(m => m.RegistryBookDetailPage)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.page').then(m => m.DashboardPage)
  },
  {
    path: 'staff',
    loadComponent: () => import('./features/staff/pages/staff-list/staff-list.page').then(m => m.StaffListPage)
  },
  {
    path: 'staff/create',
    loadComponent: () => import('./features/staff/pages/staff-form/staff-form.page').then(m => m.StaffFormPage)
  },
  {
    path: 'staff/:id/edit',
    loadComponent: () => import('./features/staff/pages/staff-form/staff-form.page').then(m => m.StaffFormPage)
  },
  {
    path: 'staff/:id/history',
    loadComponent: () => import('./features/staff/pages/staff-history/staff-history.page').then(m => m.StaffHistoryPage)
  },
  {
    path: 'staff/:id',
    loadComponent: () => import('./features/staff/pages/staff-detail/staff-detail.page').then(m => m.StaffDetailPage)
  },
  {
    path: 'reports',
    loadComponent: () => import('./features/reports/pages/report/report.page').then(m => m.ReportPage)
  }
];
