import { Borrow } from './borrow.model';

export interface Return {
  id: string;
  borrow: Borrow;
  returnedAt: Date;
}

export interface ReturnCreateDto {
  borrowId: string;
  returnedAt: Date;
}

