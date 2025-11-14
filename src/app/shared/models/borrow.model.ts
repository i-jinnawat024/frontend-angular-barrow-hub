import { Document } from './registry-book.model';

export interface Borrow {
  id: string;
  document: Document;
  name: string;
  description?: string;
  status: 'BORROWED' | 'RETURNED';
  createdAt: Date;
  updatedAt?: Date | null;
  deletedAt?: Date | null;
}

export interface BorrowCreateDto {
  userId: string;
  documentId: number[];
  description?: string;
}

