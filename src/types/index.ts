export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff',
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum WarehouseType {
  MAIN = 'main',
  BRANCH = 'branch',
}

export interface Warehouse {
  id: string;
  name: string;
  type: WarehouseType;
  address: string;
  phone?: string;
  manager?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  parent?: Category;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  brand?: string;
  model?: string;
  specifications?: Record<string, any>;
  imageUrl?: string;
  minStock: number;
  maxStock: number;
  isActive: boolean;
  category?: Category;
  categoryId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxCode?: string;
  bankAccount?: string;
  bankName?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum ImportStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface ImportDetail {
  id: string;
  product: Product;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  serialNumber?: string;
  notes?: string;
}

export interface ImportReceipt {
  id: string;
  receiptNumber: string;
  importDate: string;
  warehouse: Warehouse;
  warehouseId: string;
  supplier?: Supplier;
  supplierId?: string;
  status: ImportStatus;
  totalAmount: number;
  notes?: string;
  createdBy: User;
  createdById: string;
  details: ImportDetail[];
  createdAt: string;
  updatedAt: string;
}

export enum ExportStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ExportType {
  SALE = 'sale',
  TRANSFER = 'transfer',
  RETURN = 'return',
  OTHER = 'other',
}

export interface ExportDetail {
  id: string;
  product: Product;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  serialNumber?: string;
  notes?: string;
}

export interface ExportReceipt {
  id: string;
  receiptNumber: string;
  exportDate: string;
  warehouse: Warehouse;
  warehouseId: string;
  exportType: ExportType;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  status: ExportStatus;
  totalAmount: number;
  notes?: string;
  createdBy: User;
  createdById: string;
  details: ExportDetail[];
  createdAt: string;
  updatedAt: string;
}

export interface Inventory {
  id: string;
  product: Product;
  productId: string;
  warehouse: Warehouse;
  warehouseId: string;
  quantity: number;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export enum PartnerType {
  SHIPPING = 'shipping',
  DISTRIBUTION = 'distribution',
}

export interface Partner {
  id: string;
  code: string;
  name: string;
  type: PartnerType;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}
