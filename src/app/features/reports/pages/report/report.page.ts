import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ReportService } from '../../services/report.service';
import { Borrow } from '../../../../shared/models/borrow.model';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './report.page.html',
  styleUrl: './report.page.scss',
  providers: [DatePipe]
})
export class ReportPage implements OnInit {
  form: FormGroup;
  borrows: Borrow[] = [];
  selectedMonth: number = 0;
  selectedYear: number = 0;

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private datePipe: DatePipe
  ) {
    const now = new Date();
    this.form = this.fb.group({
      month: [now.getMonth() + 1],
      year: [now.getFullYear()]
    });
  }

  ngOnInit(): void {
    this.loadReport();
    // Watch for form changes
    this.form.valueChanges.subscribe(() => {
      this.loadReport();
    });
  }

  loadReport(): void {
    const formValue = this.form.value;
    this.selectedMonth = formValue.month;
    this.selectedYear = formValue.year;
    this.borrows = this.reportService.getBorrowsByMonth(formValue.year, formValue.month);
  }

  exportToCSV(): void {
    if (this.borrows.length > 0) {
      this.reportService.exportToCSV(this.borrows, this.selectedYear, this.selectedMonth);
    } else {
      alert('ไม่มีข้อมูลการยืมในเดือนที่เลือก');
    }
  }

  exportToJSON(): void {
    if (this.borrows.length > 0) {
      this.reportService.exportToJSON(this.borrows, this.selectedYear, this.selectedMonth);
    } else {
      alert('ไม่มีข้อมูลการยืมในเดือนที่เลือก');
    }
  }

  getMonthName(month: number): string {
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return months[month - 1] || '';
  }

  getAvailableYears(): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    // Generate years from 2020 to current year + 1
    for (let year = 2020; year <= currentYear + 1; year++) {
      years.push(year);
    }
    return years.reverse();
  }
}

