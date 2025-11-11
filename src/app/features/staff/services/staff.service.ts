import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { Staff, StaffCreateDto, StaffUpdateDto } from '../../../shared/models/staff.model';

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
  private readonly staffUrl = `${environment.apiBaseUrl}/staff`;

  constructor(private readonly http: HttpClient) {}

  getStaff(): Observable<Staff[]> {
    return this.http.get<StaffApiResponse[]>(this.staffUrl).pipe(
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
      .get<StaffApiResponse>(`${this.staffUrl}/${id}`)
      .pipe(map((member) => this.mapStaff(member)));
  }

  createStaff(dto: StaffCreateDto): Observable<Staff> {
    return this.http
      .post<StaffApiResponse>(this.staffUrl, dto)
      .pipe(map((member) => this.mapStaff(member)));
  }

  updateStaff(id: string, dto: StaffUpdateDto): Observable<Staff> {
    return this.http
      .put<StaffApiResponse>(`${this.staffUrl}/${id}`, dto)
      .pipe(map((member) => this.mapStaff(member)));
  }

  deleteStaff(id: string): Observable<void> {
    return this.http.delete<void>(`${this.staffUrl}/${id}`);
  }

  importStaff(rows: StaffCreateDto[]): Observable<StaffImportResult> {
    return this.http.post<StaffImportResult>(`${this.staffUrl}/import`, {
      staff: rows,
    });
  }

  private mapStaff(member: StaffApiResponse): Staff {
    return {
      ...member,
      createdAt: member.createdAt ? new Date(member.createdAt) : undefined,
      updatedAt: member.updatedAt ? new Date(member.updatedAt) : undefined,
    };
  }
}
