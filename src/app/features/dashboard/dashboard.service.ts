import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { IDocument } from '../../shared/models/document.model';
import { Loan } from '../../shared/models/loan.model';
import { Staff } from '../../shared/models/staff.model';
import { ApiResponse } from '../../shared/models/api-response.model';

export interface DashboardStats {
   totalHistories: number,
      totalDocuments: number,
      totalUser: number,
      histories: any,
}
export interface IHistories {
  historyId: number,
  documentId: number,
  documentName: string,
  borrowerId: number,
  borrowerName: string,
  borrowedAt: string,
  expectedReturnAt: string,
  returnedAt?: string | null,
}
type DocumentApiResponse = Omit<IDocument, 'createdAt' | 'updatedAt' | 'deletedAt'> & {
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

type StaffApiResponse = Omit<Staff, 'createdAt' | 'updatedAt'> & {
  createdAt?: string | null;
  updatedAt?: string | null;
};

type LoanApiResponse = Omit<
  Loan,
  'borrowedAt' | 'expectedReturnAt' | 'returnedAt' | 'document' | 'borrower'
> & {
  borrowedAt: string;
  expectedReturnAt: string;
  returnedAt?: string | null;
  document: DocumentApiResponse;
  borrower: StaffApiResponse;
};

interface DashboardStatsResponse {
  totalDocuments: number;
  totalUser: number;
  totalHistories: number;
  histories: LoanApiResponse[];
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly stats = signal<DashboardStats>({
    totalDocuments: 0,
    totalUser: 0,
    totalHistories: 0,
    histories: [],
  });

  private readonly dashboardUrl = `${environment.apiBaseUrl}/dashboard`;

  constructor(private readonly http: HttpClient) {
    this.refresh();
  }

  loadStats(): Observable<DashboardStats> {
    return this.http
      .get<ApiResponse<DashboardStatsResponse>>(`${this.dashboardUrl}`)
      .pipe(
        map((response) => this.mapStatsResponse(response.result) ),
        tap((stats) => this.stats.set(stats)),
        catchError((error) => {
          console.error('Failed to load dashboard stats', error);
          return of(this.stats());
        }),
      );
  }

  refresh(): void {
    this.loadStats().subscribe();
  }

  getStats() {
    console.log(this.stats.asReadonly())
    return this.stats.asReadonly();
  }

  private mapStatsResponse(response: DashboardStatsResponse): DashboardStats {
    const result = {
      totalDocuments: response.totalDocuments,
      totalUser: response.totalUser,
      totalHistories: response.totalHistories,
      histories: response.histories.map((borrowed) => this.mapBorrowd(borrowed)),
    };
    return result
  }

  private mapBorrowd(loan: LoanApiResponse): Loan {
    return {
      ...loan,
      document: this.mapDocument(loan.document),
      createdAt: new Date(loan.createdAt),
      updatedAt: loan.updatedAt ? new Date(loan.updatedAt) : null,
    };
  }

  private mapDocument(document: DocumentApiResponse): IDocument {
    console.log(document);
    return {
      ...document,
      createdAt: new Date(document.createdAt),
      updatedAt: new Date(document.updatedAt),
      deletedAt: document.deletedAt ? new Date(document.deletedAt) : null,
    };
  }

}
