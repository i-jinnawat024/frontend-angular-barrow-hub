import { Injectable, signal } from '@angular/core';
import { Document } from '../../shared/models/document.model';
import { Staff } from '../../shared/models/staff.model';
import { Loan } from '../../shared/models/loan.model';

export interface DashboardStats {
  totalDocuments: number;
  totalStaff: number;
  borrowedDocuments: number;
  activeLoans: Loan[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  // Mock data
  private documents: Document[] = [
    {
      id: '1',
      title: 'เอกสารการประชุมคณะกรรมการ',
      documentNumber: 'DOC-001',
      description: 'รายงานการประชุมประจำเดือน',
      status: 'available',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      title: 'คู่มือการปฏิบัติงาน',
      documentNumber: 'DOC-002',
      description: 'คู่มือสำหรับเจ้าหน้าที่ใหม่',
      status: 'borrowed',
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-10')
    },
    {
      id: '3',
      title: 'รายงานงบประมาณ',
      documentNumber: 'DOC-003',
      description: 'รายงานงบประมาณปี 2024',
      status: 'borrowed',
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-02-05')
    },
    {
      id: '4',
      title: 'นโยบายการให้บริการ',
      documentNumber: 'DOC-004',
      description: 'นโยบายและแนวทางปฏิบัติ',
      status: 'available',
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-03-01')
    },
    {
      id: '5',
      title: 'สัญญาโครงการ',
      documentNumber: 'DOC-005',
      description: 'สัญญาโครงการพัฒนาระบบ',
      status: 'borrowed',
      createdAt: new Date('2024-02-15'),
      updatedAt: new Date('2024-02-20')
    }
  ];

  private staff: Staff[] = [
    {
      id: '1',
      name: 'สมชาย ใจดี',
      email: 'somchai@example.com',
      position: 'ผู้จัดการ',
      department: 'ฝ่ายบริหาร',
      isActive: true
    },
    {
      id: '2',
      name: 'สมหญิง รักงาน',
      email: 'somying@example.com',
      position: 'เจ้าหน้าที่เอกสาร',
      department: 'ฝ่ายเอกสาร',
      isActive: true
    },
    {
      id: '3',
      name: 'วิชัย เก่งมาก',
      email: 'wichai@example.com',
      position: 'นักวิเคราะห์',
      department: 'ฝ่ายแผนงาน',
      isActive: true
    },
    {
      id: '4',
      name: 'มาลี สวยงาม',
      email: 'malee@example.com',
      position: 'เจ้าหน้าที่ประสานงาน',
      department: 'ฝ่ายประสานงาน',
      isActive: true
    },
    {
      id: '5',
      name: 'ประเสริฐ ดีมาก',
      email: 'prasert@example.com',
      position: 'ผู้ช่วยผู้จัดการ',
      department: 'ฝ่ายบริหาร',
      isActive: true
    }
  ];

  private loans: Loan[] = [
    {
      id: '1',
      document: this.documents[1],
      borrower: this.staff[0],
      borrowedAt: new Date('2025-11-03'),
      expectedReturnAt: new Date('2024-03-10'),
      status: 'active'
    },
    {
      id: '2',
      document: this.documents[2],
      borrower: this.staff[2],
      borrowedAt: new Date('2025-10-31'),
      expectedReturnAt: new Date('2024-03-05'),
      status: 'active'
    },
    {
      id: '3',
      document: this.documents[4],
      borrower: this.staff[1],
      borrowedAt: new Date('2024-02-20'),
      expectedReturnAt: new Date('2024-03-20'),
      status: 'active'
    }
  ];

  private stats = signal<DashboardStats>({
    totalDocuments: 0,
    totalStaff: 0,
    borrowedDocuments: 0,
    activeLoans: []
  });

  constructor() {
    this.loadStats();
  }

  private loadStats(): void {
    const totalDocuments = this.documents.length;
    const totalStaff = this.staff.filter(s => s.isActive).length;
    const borrowedDocuments = this.documents.filter(d => d.status === 'borrowed').length;
    const activeLoans = this.loans.filter(l => l.status === 'active');

    this.stats.set({
      totalDocuments,
      totalStaff,
      borrowedDocuments,
      activeLoans
    });
  }

  getStats() {
    return this.stats.asReadonly();
  }

  getDocuments(): Document[] {
    return this.documents;
  }

  getStaff(): Staff[] {
    return this.staff;
  }

  getActiveLoans(): Loan[] {
    return this.loans.filter(l => l.status === 'active');
  }
}

