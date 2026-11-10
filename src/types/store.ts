export interface Category {
  id: number;
  name: string;
  slug: string;
  department: string;
  imageUrl: string;
  displayOrder: number;
}

export interface Product {
  id: number;
  title: string;
  slug: string;
  description: string;
  basePrice: number;
  discountPrice: number | null;
  tag: string | null;
  stockQuantity: number;
  imageUrls: string[];
  sizes: string[];
  department: string;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  isFeatured: boolean;
}

export interface CartItem {
  product: Product;
  selectedSize: string | null;
  quantity: number;
}

export interface FeedbackItem {
  id: number;
  name: string;
  topic: string;
  rating: number;
  message: string;
  createdAt: string;
}

export interface OrderItemRecord {
  id: number;
  orderId: number;
  productId: number;
  productTitle: string;
  selectedSize: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderRecord {
  id: number;
  orderNumber: string;
  customerName: string;
  phone: string;
  deliveryAddress: string;
  city: 'Dhaka' | 'Outside Dhaka';
  paymentMethod: 'COD' | 'bKash' | 'Nagad';
  paymentStatus?: string;
  paymentReference: string | null;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
  createdAt: string;
  items: OrderItemRecord[];
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
}
