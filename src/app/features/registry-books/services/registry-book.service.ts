import { Injectable, signal } from '@angular/core';
import { RegistryBook, RegistryBookCreateDto, RegistryBookUpdateDto } from '../../../shared/models/registry-book.model';
import { Borrow, BorrowCreateDto } from '../../../shared/models/borrow.model';
import { Return, ReturnCreateDto } from '../../../shared/models/return.model';

@Injectable({
  providedIn: 'root'
})
export class RegistryBookService {
  // Mock data
  private registryBooks: RegistryBook[] = [
    {
      id: '1',
      bookNumber: 'BH-DOC-001',
      name: 'สมชาย ใจดี',
      description: 'เล่มทะเบียนสำหรับบันทึกเอกสารการประชุม',
      status: 'active',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      bookNumber: 'BH-DOC-002',
      name: 'สมชาย ใจดี',
      description: 'เล่มทะเบียนสำหรับโครงการต่างๆ',
      status: 'borrowed',
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-10')
    },
    {
      id: '3',
      bookNumber: 'BH-DOC-003',
      name: 'สมชาย ใจดี',
      description: 'เล่มทะเบียนสำหรับสัญญาต่างๆ',
      status: 'active',
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-03-01')
    },
    {
      id: '4',
      bookNumber: 'BH-DOC-004',
      name: 'สมชาย ใจดี',
      description: 'เล่มทะเบียนสำหรับสัญญาต่างๆ',
      status: 'inactive',
      createdAt: new Date('2024-04-01'),
      updatedAt: new Date('2024-04-01')
    }
  ];

  private borrows: Borrow[] = [
    {
      id: '1',
      registryBook: this.registryBooks[1],
      borrowerName: 'สมชาย ใจดี',
      borrowedAt: new Date('2025-11-10T10:00:00'),
      reason: 'ต้องใช้สำหรับการประชุม',
      status: 'active'
    }
  ];

  private returns: Return[] = [];

  // Registry Books methods
  getRegistryBooks() {
    return this.registryBooks;
  }

  getRegistryBookById(id: string): RegistryBook | undefined {
    return this.registryBooks.find(book => book.id === id);
  }

  createRegistryBook(dto: RegistryBookCreateDto): RegistryBook {
    const newBook: RegistryBook = {
      id: Date.now().toString(),
      ...dto,
      status: dto.status ?? 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.registryBooks.push(newBook);
    return newBook;
  }

  updateRegistryBook(id: string, dto: RegistryBookUpdateDto): RegistryBook | null {
    const index = this.registryBooks.findIndex(book => book.id === id);
    if (index === -1) return null;

    this.registryBooks[index] = {
      ...this.registryBooks[index],
      ...dto,
      updatedAt: new Date()
    };
    return this.registryBooks[index];
  }

  deleteRegistryBook(id: string): boolean {
    const index = this.registryBooks.findIndex(book => book.id === id);
    if (index === -1) return false;
    
    this.registryBooks.splice(index, 1);
    return true;
  }

  importRegistryBooks(
    rows: Array<RegistryBookCreateDto>,
  ): { imported: number; skipped: number; duplicateBookNumbers: string[] } {
    let imported = 0;
    const duplicateBookNumbers: string[] = [];

    for (const row of rows) {
      const normalizedBookNumber = row.bookNumber.trim().toLowerCase();
      if (
        !normalizedBookNumber ||
        this.registryBooks.some(
          (book) => book.bookNumber.trim().toLowerCase() === normalizedBookNumber,
        )
      ) {
        duplicateBookNumbers.push(row.bookNumber);
        continue;
      }

      const newBook: RegistryBook = {
        id:
          typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto
            ? globalThis.crypto.randomUUID()
            : Date.now().toString(),
        bookNumber: row.bookNumber.trim(),
        name: row.name.trim(),
        description: row.description?.trim() ?? undefined,
        status: row.status ?? 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.registryBooks.push(newBook);
      imported += 1;
    }

    return {
      imported,
      skipped: rows.length - imported,
      duplicateBookNumbers,
    };
  }

  // Borrow methods
  getBorrows() {
    return this.borrows;
  }

  getActiveBorrows() {
    return this.borrows.filter(borrow => borrow.status === 'active');
  }

  getBorrowById(id: string): Borrow | undefined {
    return this.borrows.find(borrow => borrow.id === id);
  }

  createBorrow(dto: BorrowCreateDto): Borrow {
    const registryBook = this.getRegistryBookById(dto.registryBookId);
    if (!registryBook) {
      throw new Error('Registry book not found');
    }

    const newBorrow: Borrow = {
      id: Date.now().toString(),
      registryBook,
      borrowerName: dto.borrowerName,
      borrowedAt: dto.borrowedAt,
      reason: dto.reason,
      status: 'active'
    };

    this.borrows.push(newBorrow);
    
    // Update registry book status
    this.updateRegistryBook(dto.registryBookId, { status: 'borrowed' });

    return newBorrow;
  }

  // Return methods
  getReturns() {
    return this.returns;
  }

  createReturn(dto: ReturnCreateDto): Return {
    const borrow = this.getBorrowById(dto.borrowId);
    if (!borrow) {
      throw new Error('Borrow record not found');
    }

    if (borrow.status === 'returned') {
      throw new Error('Registry book already returned');
    }

    const newReturn: Return = {
      id: Date.now().toString(),
      borrow,
      returnedAt: dto.returnedAt
    };

    this.returns.push(newReturn);

    // Update borrow status
    borrow.status = 'returned';
    borrow.returnedAt = dto.returnedAt;

    // Update registry book status
    this.updateRegistryBook(borrow.registryBook.id, { status: 'active' });

    return newReturn;
  }

  getBorrowByBookId(bookId: string): Borrow | undefined {
    return this.borrows.find(borrow => 
      borrow.registryBook.id === bookId && borrow.status === 'active'
    );
  }

  getBorrowHistoryByStaffName(staffName: string): Borrow[] {
    return this.borrows
      .filter((borrow) => borrow.borrowerName === staffName)
      .sort(
        (a, b) => b.borrowedAt.getTime() - a.borrowedAt.getTime(),
      );
  }

  getBorrowHistoryByBookId(bookId: string): Borrow[] {
    return this.borrows
      .filter((borrow) => borrow.registryBook.id === bookId)
      .sort(
        (a, b) => b.borrowedAt.getTime() - a.borrowedAt.getTime(),
      );
  }
}

