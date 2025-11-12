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
  userId: string;
  documentId: number[];
  description?: string;
}

