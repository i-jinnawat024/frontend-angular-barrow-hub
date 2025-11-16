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
        path: 'documents',
        loadComponent: () =>
          import('./features/document/pages/document-list/document-list.page').then(
            (m) => m.DocumentListPage,
          ),
      },
      {
        path: 'documents/create',
        loadComponent: () =>
          import('./features/document/pages/document-form/document-form.page').then(
            (m) => m.DocumentFormPage,
          ),
      },
      {
        path: 'documents/borrow',
        loadComponent: () =>
          import('./features/document/pages/borrow/borrow.page').then(
            (m) => m.BorrowPage,
          ),
      },
      {
        path: 'document/return',
        loadComponent: () =>
          import('./features/document/pages/return/return.page').then(
            (m) => m.ReturnPage,
          ),
      },
      {
        path: 'document/:id/edit',
        loadComponent: () =>
          import('./features/document/pages/document-form/document-form.page').then(
            (m) => m.DocumentFormPage,
          ),
      },
      {
        path: 'document/:id/history',
        loadComponent: () =>
          import('./features/document/pages/document-history/document-history.page').then(
            (m) => m.DocumentHistoryPage,
          ),
      },
      {
        path: 'document/:id',
        loadComponent: () =>
          import('./features/document/pages/document-detail/documentdetail.page').then(
            (m) => m.DocumentDetailPage,
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
