export interface Document {
  id: string;
  title: string;
  documentNumber: string;
  description?: string;
  status: 'available' | 'borrowed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

