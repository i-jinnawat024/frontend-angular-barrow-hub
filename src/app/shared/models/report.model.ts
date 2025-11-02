import { RegistryBook } from './registry-book.model';
import { Borrow } from './borrow.model';
import { Staff } from './staff.model';

export interface BorrowReport {
  totalBorrows: number;
  activeBorrows: number;
  returnedBorrows: number;
  overdueBorrows: number;
  recentBorrows: Borrow[];
}

export interface RegistryBookReport {
  totalBooks: number;
  availableBooks: number;
  borrowedBooks: number;
  archivedBooks: number;
  popularBooks: Array<{
    book: RegistryBook;
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
  registryBookReport: RegistryBookReport;
  staffReport: StaffReport;
}

