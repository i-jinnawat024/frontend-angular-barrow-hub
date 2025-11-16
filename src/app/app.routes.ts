import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/pages/forgot-password/forgot-password.page').then(
        (m) => m.ForgotPasswordPage,
      ),
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'registry-books',
        loadComponent: () =>
          import('./features/registry-books/pages/document-list/registry-book-list.page').then(
            (m) => m.RegistryBookListPage,
          ),
      },
      {
        path: 'registry-books/create',
        loadComponent: () =>
          import('./features/registry-books/pages/registry-book-form/registry-book-form.page').then(
            (m) => m.RegistryBookFormPage,
          ),
      },
      {
        path: 'registry-books/borrow',
        loadComponent: () =>
          import('./features/registry-books/pages/borrow/borrow.page').then(
            (m) => m.BorrowPage,
          ),
      },
      {
        path: 'documents/return',
        loadComponent: () =>
          import('./features/registry-books/pages/return/return.page').then(
            (m) => m.ReturnPage,
          ),
      },
      {
        path: 'registry-books/:id/edit',
        loadComponent: () =>
          import('./features/registry-books/pages/registry-book-form/registry-book-form.page').then(
            (m) => m.RegistryBookFormPage,
          ),
      },
      {
        path: 'registry-books/:id/history',
        loadComponent: () =>
          import('./features/registry-books/pages/registry-book-history/registry-book-history.page').then(
            (m) => m.RegistryBookHistoryPage,
          ),
      },
      {
        path: 'registry-books/:id',
        loadComponent: () =>
          import('./features/registry-books/pages/registry-book-detail/registry-book-detail.page').then(
            (m) => m.RegistryBookDetailPage,
          ),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'staff',
        loadComponent: () =>
          import('./features/staff/pages/staff-list/staff-list.page').then((m) => m.StaffListPage),
      },
      {
        path: 'staff/create',
        loadComponent: () =>
          import('./features/staff/pages/staff-form/staff-form.page').then((m) => m.StaffFormPage),
      },
      {
        path: 'staff/:id/edit',
        loadComponent: () =>
          import('./features/staff/pages/staff-form/staff-form.page').then((m) => m.StaffFormPage),
      },
      {
        path: 'staff/:id/history',
        loadComponent: () =>
          import('./features/staff/pages/staff-history/staff-history.page').then(
            (m) => m.StaffHistoryPage,
          ),
      },
      {
        path: 'staff/:id',
        loadComponent: () =>
          import('./features/staff/pages/staff-detail/staff-detail.page').then(
            (m) => m.StaffDetailPage,
          ),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/pages/report/report.page').then((m) => m.ReportPage),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
