import { Injectable, signal } from '@angular/core';
import { IDocument } from '../../shared/models/document.model';
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
  private documents: IDocument[] = [
    {
      id: '1',
      first_name: 'สมชาย',
      last_name: 'ใจดี',
      documentNumber: 'BH-DOC-001',
      status: 'available',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      deletedAt: null
    },
    {
      id: '2',
      first_name: 'สมหญิง',
      last_name: 'รักงาน',
      documentNumber: 'BH-DOC-002',
      status: 'borrowed',
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-10'),
      deletedAt: null
    },
    {
      id: '3',
      first_name: 'วิชัย',
      last_name: 'เก่งมาก',
      documentNumber: 'BH-DOC-003',
      status: 'borrowed',
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-02-05'),
      deletedAt: null
    },
    {
      id: '4',
      first_name: 'มาลี',
      last_name: 'สวยงาม',
      documentNumber: 'BH-DOC-004',
      status: 'available',
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-03-01'),
      deletedAt: null
    },
    {
      id: '5',
      first_name: 'ประเสริฐ',
      last_name: 'ดีมาก',
      documentNumber: 'BH-DOC-005',
      status: 'borrowed',
      createdAt: new Date('2024-02-15'),
      updatedAt: new Date('2024-02-20'),
      deletedAt: null
    }
  ];

  private staff: Staff[] = [
    {
      id: '1',
      firstName: 'สมชาย',
      lastName: 'ใจดี',
      email: 'somchai@example.com',
      position: 'ผู้จัดการ',
      department: 'ฝ่ายบริหาร',
      isActive: true
    },
    {
      id: '2',
      firstName: 'สมหญิง',
      lastName: 'รักงาน',
      email: 'somying@example.com',
      position: 'เจ้าหน้าที่เอกสาร',
      department: 'ฝ่ายเอกสาร',
      isActive: true
    },
    {
      id: '3',
      firstName: 'วิชัย',
      lastName: 'เก่งมาก',
      email: 'wichai@example.com',
      position: 'นักวิเคราะห์',
      department: 'ฝ่ายแผนงาน',
      isActive: true
    },
    {
      id: '4',
      firstName: 'มาลี',
      lastName: 'สวยงาม',
      email: 'malee@example.com',
      position: 'เจ้าหน้าที่ประสานงาน',
      department: 'ฝ่ายประสานงาน',
      isActive: true
    },
    {
      id: '5',
      firstName: 'ประเสริฐ',
      lastName: 'ดีมาก',
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

  getDocuments(): IDocument[] {
    return this.documents;
  }

  getStaff(): Staff[] {
    return this.staff;
  }

  getActiveLoans(): Loan[] {
    return this.loans.filter(l => l.status === 'active');
  }
}

