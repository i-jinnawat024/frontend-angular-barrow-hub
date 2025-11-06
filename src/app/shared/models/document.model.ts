export interface IDocument {
  id: string;
  first_name: string;
  last_name: string;
  documentNumber: string;
  status: 'available' | 'borrowed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
