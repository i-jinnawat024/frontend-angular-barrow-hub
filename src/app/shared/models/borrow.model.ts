import { RegistryBook } from './registry-book.model';

export interface Borrow {
  id: string;
  registryBook: RegistryBook;
  borrowerName: string;
  borrowedAt: Date;
  reason?: string;
  status: 'active' | 'returned';
  returnedAt?: Date;
}

export interface BorrowCreateDto {
  registryBookId: string;
  borrowerName: string;
  borrowedAt: Date;
  reason?: string;
}

