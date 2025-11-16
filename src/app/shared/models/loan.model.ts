import { IDocument } from './document.model';
import { Staff } from './staff.model';

export interface Loan {
  id: string;
  userId: string;
  name: string;
  document: IDocument;
  description: string | null;
  createdAt: Date;
  updatedAt: Date|null;
}

