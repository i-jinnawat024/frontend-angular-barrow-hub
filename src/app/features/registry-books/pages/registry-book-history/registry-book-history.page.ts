import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RegistryBookService } from '../../services/registry-book.service';
import { RegistryBook } from '../../../../shared/models/registry-book.model';
import { Borrow } from '../../../../shared/models/borrow.model';

@Component({
  selector: 'app-registry-book-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './registry-book-history.page.html',
  styleUrl: './registry-book-history.page.scss',
})
export class RegistryBookHistoryPage implements OnInit {
  registryBook: RegistryBook | undefined;
  borrowHistory: Borrow[] = [];

  constructor(
    private readonly registryBookService: RegistryBookService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (!id) {
        this.router.navigate(['/registry-books']);
        return;
      }

      this.registryBook = this.registryBookService.getRegistryBookById(id);
      if (!this.registryBook) {
        this.router.navigate(['/registry-books']);
        return;
      }

      this.borrowHistory =
        this.registryBookService.getBorrowHistoryByBookId(id);
    });
  }

  goBack(): void {
    if (this.registryBook) {
      this.router.navigate(['/registry-books', this.registryBook.id]);
    } else {
      this.router.navigate(['/registry-books']);
    }
  }
}
