export type UserRole = 'admin' | 'staff';
export type BillType = 'RETAIL' | 'FUNCTION';
export type OrderStatus = 'OPEN' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';
export type PaymentType = 'RETAIL_PAYMENT' | 'ADVANCE' | 'BALANCE_SETTLEMENT';
export type PaymentMode = 'CASH' | 'UPI';
export type MovementType =
  | 'RETAIL_SALE'
  | 'FUNCTION_FULFILLMENT'
  | 'STOCK_IN'
  | 'DAMAGE_OUT'
  | 'ADJUSTMENT'
  | 'BILL_CANCELLATION';

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessSettings {
  id: string;
  business_name: string;
  business_name_tamil: string;
  address: string;
  phones: string[];
  email?: string | null;
  logo_url?: string | null;
  currency: string;
  retail_bill_prefix: string;
  function_bill_prefix: string;
  next_retail_seq: number;
  next_function_seq: number;
  bill_footer_tamil: string;
  bill_footer_english: string;
  updated_at: string;
  updated_by?: string | null;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  place: string;
  address?: string | null;
  notes?: string | null;
  total_purchases: number;
  total_paid: number;
  outstanding_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Plant {
  id: string;
  name: string;
  tamil_name?: string | null;
  category: string;
  selling_price: number;
  current_stock: number;
  min_stock_alert: number;
  image_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Bill {
  id: string;
  bill_number: string;
  bill_type: BillType;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  place: string;
  function_date?: string | null;
  function_description?: string | null;
  status: OrderStatus;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  advance_amount: number;
  paid_amount: number;
  balance_amount: number;
  payment_status: PaymentStatus;
  stock_deducted: boolean;
  notes?: string | null;
  billed_by: string;
  created_at: string;
  updated_at: string;
  // Joined or calculated fields
  items?: BillItem[];
  billed_by_profile?: Profile;
}

export interface BillItem {
  id: string;
  bill_id: string;
  plant_id: string;
  plant_name: string;
  estimated_quantity: number;
  actual_quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface Payment {
  id: string;
  payment_number: string;
  bill_id: string;
  customer_id: string;
  amount: number;
  payment_type: PaymentType;
  payment_mode: PaymentMode;
  transaction_reference?: string | null;
  received_by: string;
  notes?: string | null;
  created_at: string;
  // Joined fields
  customer?: Customer;
  bill?: Bill;
  received_by_profile?: Profile;
}

export interface StockMovement {
  id: string;
  plant_id: string;
  movement_type: MovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reference_bill_id?: string | null;
  notes?: string | null;
  created_by: string;
  created_at: string;
  plant?: Plant;
  created_by_profile?: Profile;
}
