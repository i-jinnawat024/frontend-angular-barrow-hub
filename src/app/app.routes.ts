import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/registry-books',
    pathMatch: 'full'
  },
  {
    path: 'registry-books',
    loadComponent: () => import('./features/registry-books/pages/registry-book-list/registry-book-list.page').then(m => m.RegistryBookListPage)
  },
  {
    path: 'registry-books/create',
    loadComponent: () => import('./features/registry-books/pages/registry-book-form/registry-book-form.page').then(m => m.RegistryBookFormPage)
  },
  {
    path: 'registry-books/:id',
    loadComponent: () => import('./features/registry-books/pages/registry-book-detail/registry-book-detail.page').then(m => m.RegistryBookDetailPage)
  },
  {
    path: 'registry-books/:id/edit',
    loadComponent: () => import('./features/registry-books/pages/registry-book-form/registry-book-form.page').then(m => m.RegistryBookFormPage)
  },
  {
    path: 'registry-books/borrow',
    loadComponent: () => import('./features/registry-books/pages/borrow/borrow.page').then(m => m.BorrowPage)
  },
  {
    path: 'registry-books/return',
    loadComponent: () => import('./features/registry-books/pages/return/return.page').then(m => m.ReturnPage)
  }
];
