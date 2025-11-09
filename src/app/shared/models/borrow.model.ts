import { Document } from './registry-book.model';

export interface Borrow {
  id: string;
  document: Document;
  borrowerName: string;
  borrowedAt: Date;
  reason?: string;
  status: 'active' | 'returned';
  returnedAt?: Date;
}

export interface BorrowCreateDto {
  registryBookId: number;
  borrowerName: string;
  borrowedAt: Date;
  reason?: string;
}

