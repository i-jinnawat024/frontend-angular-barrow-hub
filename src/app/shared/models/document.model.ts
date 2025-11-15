export interface IDocument {
  id: string;
  first_name: string;
  last_name: string;
  documentNumber: string;
  status: 'ACTIVE' | 'BORROWED' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
