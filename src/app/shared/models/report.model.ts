import { IDocument } from './document.model';
import { Borrow } from './borrow.model';
import { Staff } from './staff.model';

export interface BorrowReport {
  totalBorrows: number;
  activeBorrows: number;
  returnedBorrows: number;
  overdueBorrows: number;
  recentBorrows: Borrow[];
}

export interface DocumentReport {
  totalDocuments: number;
  availableDocuments: number;
  borrowedDocuments: number;
  archivedDocuments: number;
  popularDocuments: Array<{
    document: IDocument;
    borrowCount: number;
  }>;
}

export interface StaffReport {
  totalStaff: number;
  activeStaff: number;
  inactiveStaff: number;
  staffByDepartment: Array<{
    department: string;
    count: number;
  }>;
}

export interface OverallReport {
  borrowReport: BorrowReport;
  documentReport: DocumentReport;
  staffReport: StaffReport;
}

