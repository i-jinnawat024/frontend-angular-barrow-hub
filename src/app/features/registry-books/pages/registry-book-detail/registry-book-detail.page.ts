import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { RegistryBookService } from '../../services/registry-book.service';
import { RegistryBook } from '../../../../shared/models/registry-book.model';

@Component({
  selector: 'app-registry-book-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './registry-book-detail.page.html',
  styleUrl: './registry-book-detail.page.scss'
})
export class RegistryBookDetailPage implements OnInit {
  registryBook: RegistryBook | undefined;

  constructor(
    private registryBookService: RegistryBookService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.registryBook = this.registryBookService.getRegistryBookById(id);
        if (!this.registryBook) {
          this.router.navigate(['/registry-books']);
        }
      }
    });
  }

  editRegistryBook(): void {
    if (this.registryBook) {
      this.router.navigate(['/registry-books', this.registryBook.id, 'edit']);
    }
  }

  goBack(): void {
    this.router.navigate(['/registry-books']);
  }
}

