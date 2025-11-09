import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RegistryBookService } from '../../registry-books/services/document.service';
import { Borrow } from '../../../shared/models/borrow.model';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  constructor(private readonly registryBookService: RegistryBookService) {}

  getBorrowsByMonth(year: number, month: number): Observable<Borrow[]> {
    return this.registryBookService.getBorrows().pipe(
      map((borrows) =>
        borrows.filter((borrow) => {
          const borrowDate = new Date(borrow.borrowedAt);
          return (
            borrowDate.getFullYear() === year &&
            borrowDate.getMonth() === month - 1
          );
        }),
      ),
    );
  }

  exportToCSV(borrows: Borrow[], year: number, month: number): void {
    const headers = [
      'เลขทะเบียน',
      'ชื่อหนังสือ',
      'ผู้ยืม',
      'วันที่ยืม',
      'เวลาที่ยืม',
      'เหตุผล',
      'สถานะ',
    ];

    const rows = borrows.map((borrow) => {
      const borrowDate = new Date(borrow.borrowedAt);
      return [
        borrow.document.documentId,
        `${borrow.document.firstName} ${borrow.document.lastName}`,
        borrow.borrowerName,
        borrowDate.toLocaleDateString('th-TH'),
        borrowDate.toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        borrow.reason || '-',
        borrow.status === 'active' ? 'กำลังยืม' : 'คืนแล้ว',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `รายงานการยืมหนังสือ_${year}_${String(month).padStart(2, '0')}.csv`,
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportToJSON(borrows: Borrow[], year: number, month: number): void {
    const reportData = {
      month,
      year,
      totalBorrows: borrows.length,
      borrows: borrows.map((borrow) => ({
        id: borrow.id,
        documentId: borrow.document.documentId,
        name: `${borrow.document.firstName} ${borrow.document.lastName}`,
        borrowerName: borrow.borrowerName,
        borrowedAt: borrow.borrowedAt,
        reason: borrow.reason,
        status: borrow.status,
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `รายงานการยืมหนังสือ_${year}_${String(month).padStart(2, '0')}.json`,
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
