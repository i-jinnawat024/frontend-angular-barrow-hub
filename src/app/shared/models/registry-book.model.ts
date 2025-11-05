export interface RegistryBook {
  id: string;
  bookNumber: string;
  name: string;
  description?: string;
  status: 'active' | 'borrowed' | 'archived' |'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface RegistryBookCreateDto {
  bookNumber: string;
  name: string;
  description?: string;
}

export interface RegistryBookUpdateDto {
  bookNumber?: string;
  name?: string;
  description?: string;
  status?: 'active' | 'borrowed' | 'archived' |'inactive';
}

