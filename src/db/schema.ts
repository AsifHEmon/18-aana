import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('admin'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  department: text('department').notNull(),
  imageUrl: text('image_url').notNull(),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  basePrice: integer('base_price').notNull(),
  discountPrice: integer('discount_price'),
  tag: text('tag'),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  imageUrls: jsonb('image_urls').$type<string[]>().notNull().default([]),
  sizes: jsonb('sizes').$type<string[]>().notNull().default([]),
  department: text('department').notNull(),
  categoryId: integer('category_id')
    .references(() => categories.id)
    .notNull(),
  isFeatured: boolean('is_featured').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  userId: integer('user_id').references(() => users.id),
  customerName: text('customer_name').notNull(),
  phone: text('phone').notNull(),
  deliveryAddress: text('delivery_address').notNull(),
  city: text('city').notNull(),
  paymentMethod: text('payment_method').notNull(),
  paymentStatus: text('payment_status').notNull().default('Unpaid'),
  paymentReference: text('payment_reference'),
  sslTranId: text('ssl_tran_id'),
  sslValId: text('ssl_val_id'),
  sslBankTranId: text('ssl_bank_tran_id'),
  sslCardType: text('ssl_card_type'),
  sslSessionKey: text('ssl_session_key'),
  subtotal: integer('subtotal').notNull(),
  deliveryCharge: integer('delivery_charge').notNull(),
  totalAmount: integer('total_amount').notNull(),
  status: text('status').notNull().default('Pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  productId: integer('product_id')
    .references(() => products.id)
    .notNull(),
  productTitle: text('product_title').notNull(),
  selectedSize: text('selected_size'),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(),
  lineTotal: integer('line_total').notNull(),
});

export const feedbacks = pgTable('feedbacks', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  topic: text('topic').notNull(),
  rating: integer('rating').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
