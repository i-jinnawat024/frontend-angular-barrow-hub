import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { Borrow, BorrowCreateDto } from '../../../shared/models/borrow.model';
import {
  Document,
  RegistryBookCreateDto,
  RegistryBookUpdateDto,
} from '../../../shared/models/registry-book.model';
import { Return, ReturnCreateDto } from '../../../shared/models/return.model';

interface RegistryBookApiResponse
  extends Omit<Document, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

interface BorrowApiResponse
  extends Omit<Borrow, 'borrowedAt' | 'returnedAt' | 'document'> {
  document: RegistryBookApiResponse;
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
  private readonly documentUrl = `${environment.apiBaseUrl}/documents`;
  private readonly historyUrl = `${environment.apiBaseUrl}/history`;
  private readonly returnsUrl = `${environment.apiBaseUrl}/returns`;

  constructor(private readonly http: HttpClient) {}

  getRegistryBooks(): Observable<Document[]> {
    return this.http.get<RegistryBookApiResponse[]>(`${this.documentUrl}/document-list`).pipe(
      map((books) => books.map((book) => this.mapDocument(book))),
    );
  }

  getRegistryBookById(id: number): Observable<Document> {
    return this.http
      .get<RegistryBookApiResponse>(`${this.documentUrl}?id=${id}`)
      .pipe(map((book) => this.mapDocument(book)));
  }

  createRegistryBook(dto: RegistryBookCreateDto): Observable<Document> {
    return this.http
      .post<RegistryBookApiResponse>(this.documentUrl, dto)
      .pipe(map((book) => this.mapDocument(book)));
  }

  updateRegistryBook(
    id: string,
    dto: RegistryBookUpdateDto,
  ): Observable<Document> {
    return this.http
      .put<RegistryBookApiResponse>(`${this.documentUrl}?id=${id}`, dto)
      .pipe(map((book) => this.mapDocument(book)));
  }

  deleteRegistryBook(id: number): Observable<void> {
    return this.http.delete<void>(`${this.documentUrl}/${id}`);
  }

  importRegistryBooks(
    rows: RegistryBookCreateDto[],
  ): Observable<RegistryBookImportResult> {
    return this.http.post<RegistryBookImportResult>(
      `${this.documentUrl}/import`,
      { registryBooks: rows },
    );
  }

  getBorrows(): Observable<Borrow[]> {
    return this.http.get<BorrowApiResponse[]>(this.historyUrl).pipe(
      map((borrows) => borrows.map((borrow) => this.mapBorrow(borrow))),
    );
  }

  getActiveBorrows(): Observable<Borrow[]> {
    return this.http
      .get<BorrowApiResponse[]>(`${this.historyUrl}/active`)
      .pipe(map((borrows) => borrows.map((borrow) => this.mapBorrow(borrow))));
  }

  getBorrowById(id: string): Observable<Borrow> {
    return this.http
      .get<BorrowApiResponse>(`${this.historyUrl}/${id}`)
      .pipe(map((borrow) => this.mapBorrow(borrow)));
  }

  createBorrow(dto: BorrowCreateDto): Observable<Borrow> {
    return this.http
      .post<BorrowApiResponse>(this.historyUrl, this.serializeBorrowDto(dto))
      .pipe(map((borrow) => this.mapBorrow(borrow)));
  }

  createBulkBorrows(dtos: BorrowCreateDto[]): Observable<Borrow[]> {
    return this.http
      .post<BorrowApiResponse[]>(
        `${this.historyUrl}/bulk`,
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
        `${this.historyUrl}/by-book/${encodeURIComponent(bookId)}`,
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
        `${this.historyUrl}/history/staff/${encodeURIComponent(staffName)}`,
      )
      .pipe(map((borrows) => borrows.map((borrow) => this.mapBorrow(borrow))));
  }

  getBorrowHistoryByDocumentId(id: number): Observable<Borrow[]> {
    return this.http
      .get<BorrowApiResponse[]>(
        `${this.historyUrl}/document?documentId=${id}`,
      )
      .pipe(map((borrows) => borrows.map((borrow) => this.mapBorrow(borrow))));
  }

  private mapDocument(document: RegistryBookApiResponse): Document {
    console.log('v',document);
    return {
      ...document,
      createdAt: new Date(document.createdAt) ?? null,
      updatedAt: new Date(document.updatedAt)?? null,
    };
  }

  private mapBorrow(borrow: BorrowApiResponse): Borrow {
    console.log(borrow.document)
    const result = {
      ...borrow,
      document: this.mapDocument(borrow.document),
    };
    return result;
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
