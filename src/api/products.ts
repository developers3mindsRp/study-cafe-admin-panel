import api from './axios';

export interface Product {
  id: number;
  title: string;
  redirect_url: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductPayload {
  title: string;
  redirect_url: string;
  sort_order?: number;
  is_active?: boolean;
}

export const fetchProducts = async (): Promise<Product[]> => {
  const res = await api.get('/admin/platform/products');
  const data = res.data;
  return Array.isArray(data) ? data : [];
};

export const fetchProduct = async (id: number): Promise<Product> => {
  const all = await fetchProducts();
  const item = all.find((p) => p.id === Number(id));
  if (!item) throw new Error('Product not found');
  return item;
};

export const createProduct = async (payload: ProductPayload): Promise<Product> => {
  const { data } = await api.post('/admin/platform/products', payload);
  return data.data;
};

export const updateProduct = async (
  id: number,
  payload: Partial<ProductPayload>,
): Promise<Product> => {
  const { data } = await api.put(`/admin/platform/products/${id}`, payload);
  return data.data;
};

export const deleteProduct = async (id: number): Promise<void> => {
  await api.delete(`/admin/platform/products/${id}`);
};
