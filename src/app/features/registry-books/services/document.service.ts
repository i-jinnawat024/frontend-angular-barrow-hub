import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { Borrow, BorrowCreateDto } from '../../../shared/models/borrow.model';
import {
  Document,
  RegistryBookCreateDto,
  DocumentUpdateDto,
} from '../../../shared/models/registry-book.model';
import { Return, ReturnCreateDto } from '../../../shared/models/return.model';
import { ApiResponse } from '../../../shared/models/api-response.model';

interface DocumentApiResponse
  extends Omit<Document, 'createdAt' | 'updatedAt' | 'deletedAt'> {
  createdAt?: string | null;
  updatedAt?: string | null;
  deletedAt?: string | null;
}

interface BorrowApiResponse
  extends Omit<Borrow, 'document' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
  document: DocumentApiResponse;
  createdAt: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
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
    return this.http
      .get<ApiResponse<DocumentApiResponse[] | null>>(`${this.documentUrl}/document-list`)
      .pipe(
        map((response) => response.result ?? []),
        map((books) => books.map((book) => this.mapDocument(book))),
      );
  }

  getRegistryBookById(id: number): Observable<Document> {
    return this.http
      .get<ApiResponse<DocumentApiResponse>>(`${this.documentUrl}?id=${id}`)
      .pipe(map((response) => this.mapDocument(response.result)));
  }

  createRegistryBook(dto: RegistryBookCreateDto): Observable<Document> {
    return this.http
      .post<ApiResponse<DocumentApiResponse>>(this.documentUrl, dto)
      .pipe(map((response) => this.mapDocument(response.result)));
  }

  updateDocument(
    id: string,
    dto: DocumentUpdateDto,
  ): Observable<Document> {
    return this.http
      .put<ApiResponse<DocumentApiResponse>>(`${this.documentUrl}?id=${id}`, dto)
      .pipe(map((response) => this.mapDocument(response.result)));
  }

  deleteRegistryBook(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.documentUrl}/${id}`)
      .pipe(map(() => undefined));
  }

  importRegistryBooks(
    rows: RegistryBookCreateDto[],
  ): Observable<RegistryBookImportResult> {
    return this.http
      .post<ApiResponse<RegistryBookImportResult>>(`${this.documentUrl}/import`, {
        registryBooks: rows,
      })
      .pipe(map((response) => response.result));
  }

  getBorrows(): Observable<Borrow[]> {
    return this.http
      .get<ApiResponse<BorrowApiResponse[] | null>>(this.historyUrl)
      .pipe(
        map((response) => response.result ?? []),
        map((borrows) => borrows.map((borrow) => this.mapBorrow(borrow))),
      );
  }

  getActiveBorrows(): Observable<Borrow[]> {
    return this.http
      .get<ApiResponse<BorrowApiResponse[] | null>>(`${this.historyUrl}/?status=BORROWED`)
      .pipe(
        map((response) => response.result ?? []),
        map((borrows) => borrows.map((borrow) => this.mapBorrow(borrow))),
      );
  }

  getBorrowById(id: string): Observable<Borrow> {
    return this.http
      .get<ApiResponse<BorrowApiResponse>>(`${this.historyUrl}/${id}`)
      .pipe(map((response) => this.mapBorrow(response.result)));
  }

  createBorrow(dto: BorrowCreateDto): Observable<Borrow> {
    return this.http
      .post<ApiResponse<BorrowApiResponse>>(this.historyUrl, this.serializeBorrowDto(dto))
      .pipe(map((response) => this.mapBorrow(response.result)));
  }

  createBulkBorrows(dto: BorrowCreateDto): Observable<Borrow[]> {
    return this.http
      .post<ApiResponse<BorrowApiResponse[] | null>>(
        `${this.documentUrl}/borrow`,
        this.serializeBorrowDto(dto),
      )
      .pipe(
        map((response) => response.result ?? []),
        map((borrows) => borrows.map((borrow) => this.mapBorrow(borrow))),
      );
  }

  getReturns(): Observable<Return[]> {
    return this.http
      .get<ApiResponse<ReturnApiResponse[] | null>>(this.returnsUrl)
      .pipe(
        map((response) => response.result ?? []),
        map((returns) => returns.map((record) => this.mapReturn(record))),
      );
  }

  createReturn(dto: ReturnCreateDto): Observable<Return> {
    return this.http
      .post<ApiResponse<ReturnApiResponse>>(
        this.returnsUrl,
        this.serializeReturnDto(dto),
      )
      .pipe(map((response) => this.mapReturn(response.result)));
  }

  createBulkReturns(dtos: ReturnCreateDto[]): Observable<Return[]> {
    return this.http
      .post<ApiResponse<ReturnApiResponse[] | null>>(
        `${this.returnsUrl}/bulk`,
        dtos.map((dto) => this.serializeReturnDto(dto)),
      )
      .pipe(
        map((response) => response.result ?? []),
        map((returns) => returns.map((record) => this.mapReturn(record))),
      );
  }

  getBorrowByBookId(bookId: string): Observable<Borrow | null> {
    return this.http
      .get<ApiResponse<BorrowApiResponse | null>>(
        `${this.historyUrl}/by-book/${encodeURIComponent(bookId)}`,
      )
      .pipe(
        map((response) => (response.result ? this.mapBorrow(response.result) : null)),
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
      .get<ApiResponse<BorrowApiResponse[] | null>>(
        `${this.historyUrl}/history/staff/${encodeURIComponent(staffName)}`,
      )
      .pipe(
        map((response) => response.result ?? []),
        map((borrows) => borrows.map((borrow) => this.mapBorrow(borrow))),
      );
  }

  getBorrowHistoryByDocumentId(id: number): Observable<Borrow[]> {
    return this.http
      .get<ApiResponse<BorrowApiResponse[] | null>>(
        `${this.historyUrl}/document?documentId=${id}`,
      )
      .pipe(
        map((response) => response.result ?? []),
        map((borrows) => borrows.map((borrow) => this.mapBorrow(borrow))),
      );
  }

  private mapDocument(document: DocumentApiResponse): Document {
    return {
      ...document,
      createdAt: document.createdAt ? new Date(document.createdAt) : null,
      updatedAt: document.updatedAt ? new Date(document.updatedAt) : null,
      deletedAt: document.deletedAt ? new Date(document.deletedAt) : null,
    };
  }

  private mapBorrow(borrow: BorrowApiResponse): Borrow {
    return {
      ...borrow,
      document: this.mapDocument(borrow.document),
      createdAt: new Date(borrow.createdAt),
      updatedAt: borrow.updatedAt ? new Date(borrow.updatedAt) : null,
      deletedAt: borrow.deletedAt ? new Date(borrow.deletedAt) : null,
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
