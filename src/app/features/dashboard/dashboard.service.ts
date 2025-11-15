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
  totalDocuments: number;
  totalStaff: number;
  borrowedDocuments: number;
  activeLoans: Loan[];
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
  totalStaff: number;
  borrowedDocuments: number;
  activeLoans: LoanApiResponse[];
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly stats = signal<DashboardStats>({
    totalDocuments: 0,
    totalStaff: 0,
    borrowedDocuments: 0,
    activeLoans: [],
  });

  private readonly dashboardUrl = `${environment.apiBaseUrl}/dashboard`;

  constructor(private readonly http: HttpClient) {
    this.refresh();
  }

  loadStats(): Observable<DashboardStats> {
    return this.http
      .get<ApiResponse<DashboardStatsResponse>>(`${this.dashboardUrl}/stats`)
      .pipe(
        map((response) => this.mapStatsResponse(response.result)),
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
    return this.stats.asReadonly();
  }

  private mapStatsResponse(response: DashboardStatsResponse): DashboardStats {
    return {
      totalDocuments: response.totalDocuments,
      totalStaff: response.totalStaff,
      borrowedDocuments: response.borrowedDocuments,
      activeLoans: response.activeLoans.map((loan) => this.mapLoan(loan)),
    };
  }

  private mapLoan(loan: LoanApiResponse): Loan {
    return {
      ...loan,
      document: this.mapDocument(loan.document),
      borrower: this.mapStaff(loan.borrower),
      borrowedAt: new Date(loan.borrowedAt),
      expectedReturnAt: new Date(loan.expectedReturnAt),
      returnedAt: loan.returnedAt ? new Date(loan.returnedAt) : undefined,
    };
  }

  private mapDocument(document: DocumentApiResponse): IDocument {
    return {
      ...document,
      createdAt: new Date(document.createdAt),
      updatedAt: new Date(document.updatedAt),
      deletedAt: document.deletedAt ? new Date(document.deletedAt) : null,
    };
  }

  private mapStaff(staff: StaffApiResponse): Staff {
    return {
      ...staff,
      createdAt: staff.createdAt ? new Date(staff.createdAt) : undefined,
      updatedAt: staff.updatedAt ? new Date(staff.updatedAt) : undefined,
    };
  }
}
