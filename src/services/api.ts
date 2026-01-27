import { api } from '@/lib/api';
import { Warehouse, Product, Supplier, Category, ImportReceipt, ExportReceipt, Inventory, Partner } from '@/types';

// Warehouses API
export const warehousesApi = {
  getAll: () => api.get<Warehouse[]>('/warehouses'),
  getActive: () => api.get<Warehouse[]>('/warehouses/active'),
  getOne: (id: string) => api.get<Warehouse>(`/warehouses/${id}`),
  create: (data: Partial<Warehouse>) => api.post<Warehouse>('/warehouses', data),
  update: (id: string, data: Partial<Warehouse>) => api.patch<Warehouse>(`/warehouses/${id}`, data),
  delete: (id: string) => api.delete(`/warehouses/${id}`),
};

// Categories API
export const categoriesApi = {
  getAll: () => api.get<Category[]>('/categories'),
  getTrees: () => api.get<Category[]>('/categories/trees'),
  getActive: () => api.get<Category[]>('/categories/active'),
  getOne: (id: string) => api.get<Category>(`/categories/${id}`),
  create: (data: Partial<Category>) => api.post<Category>('/categories', data),
  update: (id: string, data: Partial<Category>) => api.patch<Category>(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// Products API
export const productsApi = {
  getAll: (search?: string) => api.get<Product[]>('/products', { params: { search } }),
  getActive: () => api.get<Product[]>('/products/active'),
  getByCategory: (categoryId: string) => api.get<Product[]>(`/products/category/${categoryId}`),
  getOne: (id: string) => api.get<Product>(`/products/${id}`),
  create: (data: Partial<Product>) => api.post<Product>('/products', data),
  update: (id: string, data: Partial<Product>) => api.patch<Product>(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// Suppliers API
export const suppliersApi = {
  getAll: () => api.get<Supplier[]>('/suppliers'),
  getActive: () => api.get<Supplier[]>('/suppliers/active'),
  getOne: (id: string) => api.get<Supplier>(`/suppliers/${id}`),
  create: (data: Partial<Supplier>) => api.post<Supplier>('/suppliers', data),
  update: (id: string, data: Partial<Supplier>) => api.patch<Supplier>(`/suppliers/${id}`, data),
  delete: (id: string) => api.delete(`/suppliers/${id}`),
};

// Imports API
export const importsApi = {
  getAll: () => api.get<ImportReceipt[]>('/imports'),
  getOne: (id: string) => api.get<ImportReceipt>(`/imports/${id}`),
  create: (data: any) => api.post<ImportReceipt>('/imports', data),
  updateStatus: (id: string, status: string) => api.patch<ImportReceipt>(`/imports/${id}/status`, { status }),
};

// Exports API
export const exportsApi = {
  getAll: () => api.get<ExportReceipt[]>('/exports'),
  getOne: (id: string) => api.get<ExportReceipt>(`/exports/${id}`),
  create: (data: any) => api.post<ExportReceipt>('/exports', data),
  updateStatus: (id: string, status: string) => api.patch<ExportReceipt>(`/exports/${id}/status`, { status }),
};

// Inventory API
export const inventoryApi = {
  getAll: () => api.get<Inventory[]>('/inventory'),
  getByWarehouse: (warehouseId: string) => api.get<Inventory[]>(`/inventory/warehouse/${warehouseId}`),
  getByProduct: (productId: string) => api.get<Inventory[]>(`/inventory/product/${productId}`),
  getLowStock: () => api.get<Inventory[]>('/inventory/alerts/low-stock'),
};

// Partners API
export const partnersApi = {
  getAll: () => api.get<Partner[]>('/partners'),
  getOne: (id: string) => api.get<Partner>(`/partners/${id}`),
  create: (data: Partial<Partner>) => api.post<Partner>('/partners', data),
  update: (id: string, data: Partial<Partner>) => api.patch<Partner>(`/partners/${id}`, data),
  delete: (id: string) => api.delete(`/partners/${id}`),
};

// Reports API
export const reportsApi = {
  getInventory: () => api.get('/reports/inventory'),
  getImportExport: (startDate?: string, endDate?: string) => 
    api.get('/reports/import-export', { params: { startDate, endDate } }),
  getDashboard: () => api.get('/reports/dashboard'),
};
