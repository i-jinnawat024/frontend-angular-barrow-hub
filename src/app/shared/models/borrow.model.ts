import { Document } from './registry-book.model';

export interface Borrow {
  id: string;
  document: Document;
  name: string;
  description?: string;
  status: 'BORROWED' | 'RETURNED';
  createdAt: Date
}

export interface BorrowCreateDto {
  registryBookId: number;
  borrowerName: string;
  borrowedAt: Date;
  reason?: string;
}

