export interface RegistryBook {
  id: string;
  bookNumber: string;
  title: string;
  description?: string;
  status: 'available' | 'borrowed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface RegistryBookCreateDto {
  bookNumber: string;
  title: string;
  description?: string;
}

export interface RegistryBookUpdateDto {
  bookNumber?: string;
  title?: string;
  description?: string;
  status?: 'available' | 'borrowed' | 'archived';
}

