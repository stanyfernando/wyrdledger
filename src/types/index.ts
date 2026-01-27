// Customer & Order Types
export type OrderStatus =
  | "awaiting_payment"
  | "in_production"
  | "inbound"
  | "in_transit"
  | "delivered"
  | "cancelled"
  | "refunded";

export type Currency = "LKR" | "USD" | "GBP";

export interface OrderItem {
  productId: string;
  productName: string;
  size: string;
  color: string;
  price: number;
}

export interface PaymentDetails {
  currency: Currency;
  subtotal: number;
  shipping: number;
  total: number;
  // For LKR - bank account reference
  bankAccountId?: string;
  // For USD/GBP - payment link info
  paymentLabel?: string;
  paymentUrl?: string;
}

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  payment: PaymentDetails;
  status: OrderStatus;
  trackingLink?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string; // Format: WW_[YY]_[MM]-[001]
  name: string;
  email: string;
  contactNumber: string;
  address: string;
  notes?: string;
  orders: Order[];
  createdAt: string;
  updatedAt: string;
}

// Product Types
export interface Product {
  id: string; // Product ID (e.g., "WW-001")
  name: string;
  colors: string[];
  sizes: string[];
  stock: number; // Total stock across all sizes/colors
  cargoTrackingLink?: string; // Supplier cargo tracking URL
  cargoCarrier?: string; // Cargo carrier name
  createdAt: string;
  updatedAt: string;
}

// Settings Types
export interface BankAccount {
  id: string;
  nickname: string;
  holderName: string;
  accountNumber: string;
  bank: string;
  bankCode: string;
  branch: string;
  branchCode: string;
  swiftCode: string;
  isDefault: boolean;
}

export interface Settings {
  bankAccounts: BankAccount[];
  defaultCurrency: Currency;
}

// Sync Types
export type SyncStatus = "syncing" | "synced" | "offline";

// Offline Queue Types
export interface QueuedOperation {
  id: string;
  type: "save" | "sync";
  collection?: string;
  data: unknown;
  timestamp: number;
  retryCount: number;
}

// Form Step Types
export interface NewOrderFormData {
  // Step 1: Customer
  customerName: string;
  customerEmail: string;
  customerContact: string;
  customerAddress: string;
  customerNotes?: string;
  // Step 2: Products
  items: OrderItem[];
  // Step 3: Payment
  currency: Currency;
  shipping: number;
  bankAccountId?: string;
  paymentLabel?: string;
  paymentUrl?: string;
}
