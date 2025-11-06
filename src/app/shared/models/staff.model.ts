export interface Staff {
  id: string;
  name: string;
  email: string;
  phone?: string;
  position: string;
  department?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StaffCreateDto {
  name: string;
  email: string;
  phone?: string;
  position: string;
  department?: string;
  isActive?: boolean;
}

export interface StaffUpdateDto {
  name?: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  isActive?: boolean;
}
