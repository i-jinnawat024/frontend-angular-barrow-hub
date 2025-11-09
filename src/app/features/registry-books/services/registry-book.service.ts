import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { Borrow, BorrowCreateDto } from '../../../shared/models/borrow.model';
import {
  RegistryBook,
  RegistryBookCreateDto,
  RegistryBookUpdateDto,
} from '../../../shared/models/registry-book.model';
import { Return, ReturnCreateDto } from '../../../shared/models/return.model';

interface RegistryBookApiResponse
  extends Omit<RegistryBook, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

interface BorrowApiResponse
  extends Omit<Borrow, 'borrowedAt' | 'returnedAt' | 'registryBook'> {
  borrowedAt: string;
  returnedAt?: string | null;
  registryBook: RegistryBookApiResponse;
}

interface ReturnApiResponse extends Omit<Return, 'returnedAt' | 'borrow'> {
  returnedAt: string;
  borrow: BorrowApiResponse;
}

export interface RegistryBookImportResult {
  imported: number;
  skipped: number;
  duplicateBookNumbers: string[];
}

@Injectable({
  providedIn: 'root',
})
export class RegistryBookService {
  private readonly registryBooksUrl = `${environment.apiBaseUrl}/documents/document-list`;
  private readonly borrowsUrl = `${environment.apiBaseUrl}/borrows`;
  private readonly returnsUrl = `${environment.apiBaseUrl}/returns`;

  constructor(private readonly http: HttpClient) {}

  getRegistryBooks(): Observable<RegistryBook[]> {
    return this.http.get<RegistryBookApiResponse[]>(this.registryBooksUrl).pipe(
      map((books) => books.map((book) => this.mapRegistryBook(book))),
    );
  }

  getRegistryBookById(id: string): Observable<RegistryBook> {
    return this.http
      .get<RegistryBookApiResponse>(`${this.registryBooksUrl}/${id}`)
      .pipe(map((book) => this.mapRegistryBook(book)));
  }

  createRegistryBook(dto: RegistryBookCreateDto): Observable<RegistryBook> {
    return this.http
      .post<RegistryBookApiResponse>(this.registryBooksUrl, dto)
      .pipe(map((book) => this.mapRegistryBook(book)));
  }

  updateRegistryBook(
    id: string,
    dto: RegistryBookUpdateDto,
  ): Observable<RegistryBook> {
    return this.http
      .put<RegistryBookApiResponse>(`${this.registryBooksUrl}/${id}`, dto)
      .pipe(map((book) => this.mapRegistryBook(book)));
  }

  deleteRegistryBook(id: number): Observable<void> {
    return this.http.delete<void>(`${this.registryBooksUrl}/${id}`);
  }

  importRegistryBooks(
    rows: RegistryBookCreateDto[],
  ): Observable<RegistryBookImportResult> {
    return this.http.post<RegistryBookImportResult>(
      `${this.registryBooksUrl}/import`,
      { registryBooks: rows },
    );
  }

  getBorrows(): Observable<Borrow[]> {
    return this.http.get<BorrowApiResponse[]>(this.borrowsUrl).pipe(
      map((borrows) => borrows.map((borrow) => this.mapBorrow(borrow))),
    );
  }

  getActiveBorrows(): Observable<Borrow[]> {
    return this.http
      .get<BorrowApiResponse[]>(`${this.borrowsUrl}/active`)
      .pipe(map((borrows) => borrows.map((borrow) => this.mapBorrow(borrow))));
  }

  getBorrowById(id: string): Observable<Borrow> {
    return this.http
      .get<BorrowApiResponse>(`${this.borrowsUrl}/${id}`)
      .pipe(map((borrow) => this.mapBorrow(borrow)));
  }

  createBorrow(dto: BorrowCreateDto): Observable<Borrow> {
    return this.http
      .post<BorrowApiResponse>(this.borrowsUrl, this.serializeBorrowDto(dto))
      .pipe(map((borrow) => this.mapBorrow(borrow)));
  }

  createBulkBorrows(dtos: BorrowCreateDto[]): Observable<Borrow[]> {
    return this.http
      .post<BorrowApiResponse[]>(
        `${this.borrowsUrl}/bulk`,
        dtos.map((dto) => this.serializeBorrowDto(dto)),
      )
      .pipe(map((borrows) => borrows.map((borrow) => this.mapBorrow(borrow))));
  }

  getReturns(): Observable<Return[]> {
    return this.http.get<ReturnApiResponse[]>(this.returnsUrl).pipe(
      map((returns) => returns.map((record) => this.mapReturn(record))),
    );
  }

  createReturn(dto: ReturnCreateDto): Observable<Return> {
    return this.http
      .post<ReturnApiResponse>(
        this.returnsUrl,
        this.serializeReturnDto(dto),
      )
      .pipe(map((record) => this.mapReturn(record)));
  }

  createBulkReturns(dtos: ReturnCreateDto[]): Observable<Return[]> {
    return this.http
      .post<ReturnApiResponse[]>(
        `${this.returnsUrl}/bulk`,
        dtos.map((dto) => this.serializeReturnDto(dto)),
      )
      .pipe(map((returns) => returns.map((record) => this.mapReturn(record))));
  }

  getBorrowByBookId(bookId: string): Observable<Borrow | null> {
    return this.http
      .get<BorrowApiResponse>(
        `${this.borrowsUrl}/by-book/${encodeURIComponent(bookId)}`,
      )
      .pipe(
        map((borrow) => this.mapBorrow(borrow)),
        catchError((error) => {
          if (error?.status === 404) {
            return of(null);
          }
          throw error;
        }),
      );
  }

  getBorrowHistoryByStaffName(staffName: string): Observable<Borrow[]> {
    return this.http
      .get<BorrowApiResponse[]>(
        `${this.borrowsUrl}/history/staff/${encodeURIComponent(staffName)}`,
      )
      .pipe(map((borrows) => borrows.map((borrow) => this.mapBorrow(borrow))));
  }

  getBorrowHistoryByBookId(documentId: number): Observable<Borrow[]> {
    return this.http
      .get<BorrowApiResponse[]>(
        `${this.borrowsUrl}/history/book/${encodeURIComponent(documentId)}`,
      )
      .pipe(map((borrows) => borrows.map((borrow) => this.mapBorrow(borrow))));
  }

  private mapRegistryBook(book: RegistryBookApiResponse): RegistryBook {
    return {
      ...book,
      createdAt: new Date(book.createdAt),
      updatedAt: new Date(book.updatedAt),
    };
  }

  private mapBorrow(borrow: BorrowApiResponse): Borrow {
    return {
      ...borrow,
      registryBook: this.mapRegistryBook(borrow.registryBook),
      borrowedAt: new Date(borrow.borrowedAt),
      returnedAt: borrow.returnedAt ? new Date(borrow.returnedAt) : undefined,
    };
  }

  private mapReturn(record: ReturnApiResponse): Return {
    return {
      ...record,
      borrow: this.mapBorrow(record.borrow),
      returnedAt: new Date(record.returnedAt),
    };
  }

  private serializeBorrowDto(dto: BorrowCreateDto) {
    return {
      ...dto,
      borrowedAt:
        dto.borrowedAt instanceof Date
          ? dto.borrowedAt.toISOString()
          : dto.borrowedAt,
    };
  }

  private serializeReturnDto(dto: ReturnCreateDto) {
    return {
      ...dto,
      returnedAt:
        dto.returnedAt instanceof Date
          ? dto.returnedAt.toISOString()
          : dto.returnedAt,
    };
  }
}
