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
      reason: '',
      status: 'active'
    }
  ];

  private returns: Return[] = [];

  private generateId(): string {
    return typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
  }

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
    return this.createBulkBorrows([dto])[0];
  }

  createBulkBorrows(dtos: BorrowCreateDto[]): Borrow[] {
    if (!dtos.length) {
      throw new Error('ไม่ได้ระบุรายการยืม');
    }

    const seenBookIds = new Set<string>();
    const registryBooks = dtos.map((dto) => {
      if (seenBookIds.has(dto.registryBookId)) {
        throw new Error('พบเล่มทะเบียนซ้ำในคำร้อง');
      }
      seenBookIds.add(dto.registryBookId);

      const registryBook = this.getRegistryBookById(dto.registryBookId);
      if (!registryBook) {
        throw new Error(`ไม่พบเล่มทะเบียนรหัส ${dto.registryBookId}`);
      }

      if (registryBook.status !== 'active') {
        throw new Error(`เล่มทะเบียน ${registryBook.bookNumber} ไม่พร้อมให้ยืม`);
      }

      return registryBook;
    });

    const createdBorrows: Borrow[] = [];

    dtos.forEach((dto, index) => {
      const registryBook = registryBooks[index];

      const newBorrow: Borrow = {
        id: this.generateId(),
        registryBook,
        borrowerName: dto.borrowerName,
        borrowedAt: dto.borrowedAt,
        reason: dto.reason,
        status: 'active'
      };

      this.borrows.push(newBorrow);
      this.updateRegistryBook(registryBook.id, { status: 'borrowed' });
      createdBorrows.push(newBorrow);
    });

    return createdBorrows;
  }

  // Return methods
  getReturns() {
    return this.returns;
  }

  createReturn(dto: ReturnCreateDto): Return {
    return this.createBulkReturns([dto])[0];
  }

  createBulkReturns(dtos: ReturnCreateDto[]): Return[] {
    if (!dtos.length) {
      throw new Error('ไม่ได้ระบุรายการคืน');
    }

    const seenBorrowIds = new Set<string>();
    const borrowsToReturn = dtos.map((dto) => {
      if (seenBorrowIds.has(dto.borrowId)) {
        throw new Error('พบรายการยืมซ้ำในคำร้อง');
      }
      seenBorrowIds.add(dto.borrowId);

      const borrow = this.getBorrowById(dto.borrowId);
      if (!borrow) {
        throw new Error(`ไม่พบรายการยืมรหัส ${dto.borrowId}`);
      }

      if (borrow.status === 'returned') {
        throw new Error(`เล่มทะเบียน ${borrow.registryBook.bookNumber} ถูกคืนไปแล้ว`);
      }

      return borrow;
    });

    const createdReturns: Return[] = [];

    borrowsToReturn.forEach((borrow, index) => {
      const dto = dtos[index];

      const newReturn: Return = {
        id: this.generateId(),
        borrow,
        returnedAt: dto.returnedAt
      };

      this.returns.push(newReturn);

      borrow.status = 'returned';
      borrow.returnedAt = dto.returnedAt;

      this.updateRegistryBook(borrow.registryBook.id, { status: 'active' });

      createdReturns.push(newReturn);
    });

    return createdReturns;
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

