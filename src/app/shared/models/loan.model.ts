import { Document } from './document.model';
import { Staff } from './staff.model';

export interface Loan {
  id: string;
  document: Document;
  borrower: Staff;
  borrowedAt: Date;
  expectedReturnAt: Date;
  returnedAt?: Date;
  status: 'active' | 'returned' | 'overdue';
}

