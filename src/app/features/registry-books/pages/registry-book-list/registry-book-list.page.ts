import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RegistryBookService } from '../../services/registry-book.service';
import { RegistryBook } from '../../../../shared/models/registry-book.model';

@Component({
  selector: 'app-registry-book-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './registry-book-list.page.html',
  styleUrl: './registry-book-list.page.scss'
})
export class RegistryBookListPage implements OnInit {
  registryBooks: RegistryBook[] = [];

  constructor(
    private registryBookService: RegistryBookService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRegistryBooks();
  }

  loadRegistryBooks(): void {
    this.registryBooks = this.registryBookService.getRegistryBooks();
  }

  deleteRegistryBook(id: string): void {
    if (confirm('คุณแน่ใจหรือไม่ที่ต้องการลบเล่มทะเบียนนี้?')) {
      const success = this.registryBookService.deleteRegistryBook(id);
      if (success) {
        this.loadRegistryBooks();
      }
    }
  }

  viewDetails(id: string): void {
    this.router.navigate(['/registry-books', id]);
  }

  editRegistryBook(id: string): void {
    this.router.navigate(['/registry-books', id, 'edit']);
  }

  createRegistryBook(): void {
    this.router.navigate(['/registry-books', 'create']);
  }
}

