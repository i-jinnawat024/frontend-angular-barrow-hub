import { IDocument } from './document.model';
import { Staff } from './staff.model';

export interface Loan {
  id: string;
  document: IDocument;
  borrower: Staff;
  borrowedAt: Date;
  expectedReturnAt: Date;
  returnedAt?: Date;
  status: 'active' | 'returned' | 'overdue';
}

