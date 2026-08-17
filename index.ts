export interface User {
  id: string;
  email: string;
  role: 'wholesaler' | 'admin' | 'retailer';
  company: string;
  password?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  wholesalePrice: number;
  stock: number;
  category: string;
  minOrderQty: number;
  image: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  product: Product;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  createdAt: string;
  shippingAddress: string;
}