import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DocumentService } from '../../document/services/document.service';
import { Borrow } from '../../../shared/models/borrow.model';
import * as XLSX from 'xlsx';
@Injectable({
  providedIn: 'root',
})
export class ReportService {
  constructor(private readonly documentService: DocumentService) {}

  getBorrowsByMonth(year: number, month: number): Observable<Borrow[]> {
    return this.documentService.getBorrows().pipe(
      map((borrows) =>
        borrows.filter((borrow) => {
          const borrowDate = new Date(borrow.createdAt);
          return borrowDate.getFullYear() === year && borrowDate.getMonth() === month - 1;
        })
      )
    );
  }

  exportToExcel(borrows: Borrow[], year: number, month: number): void {
    const headers = [
      'เลขทะเบียน',
      'ชื่อ-นามสกุล',
      'ผู้ยืม',
      'วันที่ยืม',
      'เวลาที่ยืม',
      'เหตุผล',
      'สถานะ',
    ];

    const rows = borrows.map((borrow) => [
      borrow.document.documentId,
      `${borrow.document.firstName} ${borrow.document.lastName}`,
      borrow.name,
      borrow.createdAt.toLocaleDateString('th-TH'),
      borrow.createdAt.toLocaleTimeString('th-TH'),
      borrow.description || '-',
      borrow.status === 'BORROWED' ? 'กำลังยืม' : 'คืนแล้ว',
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // กำหนด column width ที่นี่
    worksheet['!cols'] = [
      { wch: 12 }, // เลขทะเบียน
      { wch: 25 }, // ชื่อสกุล
      { wch: 20 }, // ผู้ยืม
      { wch: 15 }, // วันที่ยืม
      { wch: 15 }, // เวลา
      { wch: 20 }, // เหตุผล
      { wch: 10 }, // สถานะ
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

    XLSX.writeFile(workbook, `รายงานการยืมหนังสือ_${year}_${month}.xlsx`);
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
        borrowerName: borrow.document.firstName,
        createdAt: borrow.createdAt,
        description: borrow.description,
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
      `รายงานการยืมหนังสือ_${year}_${String(month).padStart(2, '0')}.json`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
