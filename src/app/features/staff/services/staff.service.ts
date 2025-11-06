import { Injectable } from '@angular/core';
import { Staff, StaffCreateDto, StaffUpdateDto } from '../../../shared/models/staff.model';

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  // Mock data
  private staff: Staff[] = [
    {
      id: '1',
      name: 'สมชาย ใจดี',
      email: 'somchai@example.com',
      phone: '081-234-5678',
      position: 'ผู้จัดการ',
      department: 'ฝ่ายบริหาร',
      isActive: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      name: 'สมหญิง รักงาน',
      email: 'somying@example.com',
      phone: '082-345-6789',
      position: 'เจ้าหน้าที่เอกสาร',
      department: 'ฝ่ายเอกสาร',
      isActive: true,
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-01')
    },
    {
      id: '3',
      name: 'วิชัย เก่งมาก',
      email: 'wichai@example.com',
      phone: '083-456-7890',
      position: 'นักวิเคราะห์',
      department: 'ฝ่ายแผนงาน',
      isActive: true,
      createdAt: new Date('2024-02-10'),
      updatedAt: new Date('2024-02-10')
    },
    {
      id: '4',
      name: 'มาลี สวยงาม',
      email: 'malee@example.com',
      phone: '084-567-8901',
      position: 'เจ้าหน้าที่ประสานงาน',
      department: 'ฝ่ายประสานงาน',
      isActive: true,
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-03-01')
    },
    {
      id: '5',
      name: 'ประเสริฐ ดีมาก',
      email: 'prasert@example.com',
      phone: '085-678-9012',
      position: 'ผู้ช่วยผู้จัดการ',
      department: 'ฝ่ายบริหาร',
      isActive: false,
      createdAt: new Date('2024-03-15'),
      updatedAt: new Date('2024-03-20')
    }
  ];

  getStaff(): Staff[] {
    return this.staff;
  }

  getActiveStaff(): Staff[] {
    return this.staff.filter(s => s.isActive);
  }

  getStaffById(id: string): Staff | undefined {
    return this.staff.find(s => s.id === id);
  }

  createStaff(dto: StaffCreateDto): Staff {
    const newStaff: Staff = {
      id: Date.now().toString(),
      ...dto,
      isActive: dto.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.staff.push(newStaff);
    return newStaff;
  }

  updateStaff(id: string, dto: StaffUpdateDto): Staff | null {
    const index = this.staff.findIndex(s => s.id === id);
    if (index === -1) return null;

    this.staff[index] = {
      ...this.staff[index],
      ...dto,
      updatedAt: new Date()
    };
    return this.staff[index];
  }

  deleteStaff(id: string): boolean {
    const index = this.staff.findIndex(s => s.id === id);
    if (index === -1) return false;
    
    this.staff.splice(index, 1);
    return true;
  }

  importStaff(
    rows: Array<StaffCreateDto>,
  ): { imported: number; skipped: number; duplicateEmails: string[] } {
    let imported = 0;
    const duplicateEmails: string[] = [];

    for (const row of rows) {
      const normalizedEmail = row.email.trim().toLowerCase();
      if (
        !normalizedEmail ||
        this.staff.some((member) => member.email.trim().toLowerCase() === normalizedEmail)
      ) {
        duplicateEmails.push(row.email);
        continue;
      }

      const newStaff: Staff = {
        id:
          typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto
            ? globalThis.crypto.randomUUID()
            : Date.now().toString(),
        name: row.name.trim(),
        email: row.email.trim(),
        phone: row.phone?.trim(),
        position: row.position.trim(),
        department: row.department?.trim(),
        isActive: row.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.staff.push(newStaff);
      imported += 1;
    }

    return {
      imported,
      skipped: rows.length - imported,
      duplicateEmails,
    };
  }
}

