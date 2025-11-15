import { Borrow } from './borrow.model';

export interface Return {
  id: string;
  borrow: Borrow;
  returnedAt: Date;
}

export interface ReturnCreateDto {
  documentIds: number[];
  userId:string
}

