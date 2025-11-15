import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { Staff, StaffCreateDto, StaffUpdateDto } from '../../../shared/models/staff.model';
import { ApiResponse } from '../../../shared/models/api-response.model';

interface StaffApiResponse extends Omit<Staff, 'createdAt' | 'updatedAt'> {
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface StaffImportResult {
  imported: number;
  skipped: number;
  duplicateEmails: string[];
}

@Injectable({
  providedIn: 'root',
})
export class StaffService {
  private readonly userUrl = `${environment.apiBaseUrl}/users`;

  constructor(private readonly http: HttpClient) {}

  getStaff(): Observable<Staff[]> {
    return this.http.get<ApiResponse<StaffApiResponse[] | null>>(this.userUrl).pipe(
      map((response) => response.result ?? []),
      map((staff) => staff.map((member) => this.mapStaff(member))),
    );
  }

  getActiveStaff(): Observable<Staff[]> {
    return this.getStaff().pipe(
      map((staff) => staff.filter((member) => member.isActive)),
    );
  }

  getStaffById(id: string): Observable<Staff> {
    return this.http
      .get<ApiResponse<StaffApiResponse>>(`${this.userUrl}/${id}`)
      .pipe(map((response) => this.mapStaff(response.result)));
  }

  createStaff(dto: StaffCreateDto): Observable<Staff> {
    return this.http
      .post<ApiResponse<StaffApiResponse>>(this.userUrl, dto)
      .pipe(map((response) => this.mapStaff(response.result)));
  }

  updateStaff(id: string, dto: StaffUpdateDto): Observable<Staff> {
    return this.http
      .put<ApiResponse<StaffApiResponse>>(`${this.userUrl}/${id}`, dto)
      .pipe(map((response) => this.mapStaff(response.result)));
  }

  deleteStaff(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.userUrl}/${id}`)
      .pipe(map(() => undefined));
  }

  importStaff(rows: StaffCreateDto[]): Observable<StaffImportResult> {
    return this.http
      .post<ApiResponse<StaffImportResult>>(`${this.userUrl}/bulk`,rows)
      .pipe(map((response) => response.result));
  }

  private mapStaff(member: StaffApiResponse): Staff {
    return {
      ...member,
      createdAt: member.createdAt ? new Date(member.createdAt) : undefined,
      updatedAt: member.updatedAt ? new Date(member.updatedAt) : undefined,
    };
  }
}
