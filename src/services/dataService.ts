import {
  Bill,
  BillItem,
  BusinessSettings,
  Customer,
  Payment,
  Plant,
  Profile,
  StockMovement,
} from '../types/database.types';
import {
  INITIAL_BILLS,
  INITIAL_CUSTOMERS,
  INITIAL_PAYMENTS,
  INITIAL_PLANTS,
  INITIAL_PROFILES,
  INITIAL_SETTINGS,
} from './seedData';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

// Local storage keys
const STORAGE_KEYS = {
  CURRENT_USER: 'kng_current_user_v2',
  SETTINGS: 'kng_settings_v2',
  PROFILES: 'kng_profiles_v2',
  CUSTOMERS: 'kng_customers_v2',
  PLANTS: 'kng_plants_v2',
  BILLS: 'kng_bills_v2',
  PAYMENTS: 'kng_payments_v2',
  STOCK_MOVEMENTS: 'kng_stock_movements_v2',
};

// Purge any old v1 test dummy cache on load
try {
  localStorage.removeItem('kng_bills');
  localStorage.removeItem('kng_customers');
  localStorage.removeItem('kng_payments');
  localStorage.removeItem('kng_stock_movements');
  localStorage.removeItem('kng_plants');
} catch {
  // ignore
}

function loadStorage<T>(key: string, defaultData: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(raw);
  } catch {
    return defaultData;
  }
}

function saveStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to save to localStorage (${key}):`, err);
  }
}

export const dataService = {
  // =========================================================================
  // SUPABASE CLOUD SYNCHRONIZATION
  // =========================================================================
  async syncFromSupabase(): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      // 1. Sync Settings
      const { data: settings } = await supabase.from('business_settings').select('*').limit(1);
      if (settings && settings.length > 0) {
        saveStorage(STORAGE_KEYS.SETTINGS, settings[0]);
      }

      // 2. Sync Profiles
      const { data: profiles } = await supabase.from('profiles').select('*');
      if (profiles && profiles.length > 0) {
        saveStorage(STORAGE_KEYS.PROFILES, profiles);
      }

      // 3. Sync Plants
      const { data: plants } = await supabase.from('plants').select('*');
      if (plants && plants.length > 0) {
        saveStorage(STORAGE_KEYS.PLANTS, plants);
      }

      // 4. Sync Customers
      const { data: customers } = await supabase.from('customers').select('*');
      if (customers) {
        saveStorage(STORAGE_KEYS.CUSTOMERS, customers);
      }

      // 5. Sync Bills & Bill Items
      const { data: bills } = await supabase
        .from('bills')
        .select('*, items:bill_items(*)')
        .order('created_at', { ascending: false });
      if (bills) {
        saveStorage(STORAGE_KEYS.BILLS, bills);
      }

      // 6. Sync Payments
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });
      if (payments) {
        saveStorage(STORAGE_KEYS.PAYMENTS, payments);
      }

      // 7. Sync Movements
      const { data: movements } = await supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false });
      if (movements) {
        saveStorage(STORAGE_KEYS.STOCK_MOVEMENTS, movements);
      }
    } catch (err) {
      console.warn('Could not sync live data from Supabase, using local cache:', err);
    }
  },

  // =========================================================================
  // AUTH & PROFILES
  // =========================================================================
  getCurrentUser(): Profile {
    return loadStorage<Profile>(STORAGE_KEYS.CURRENT_USER, INITIAL_PROFILES[0]);
  },

  setCurrentUser(profile: Profile): void {
    saveStorage(STORAGE_KEYS.CURRENT_USER, profile);
  },

  getProfilesByPhone(phone: string): Profile[] {
    const profiles = this.getProfiles();
    const cleanPhone = phone.replace(/\D/g, '');
    return profiles.filter((p) => p.phone.replace(/\D/g, '') === cleanPhone);
  },

  login(phone: string, profileId?: string): { success: boolean; user?: Profile; multiple?: Profile[]; error?: string } {
    const profiles = this.getProfiles();
    const cleanPhone = phone.replace(/\D/g, '');
    const matches = profiles.filter((p) => p.phone.replace(/\D/g, '') === cleanPhone);

    if (matches.length === 0) {
      return { success: false, error: 'Staff account not found with this phone number' };
    }

    if (matches.length > 1 && !profileId) {
      return { success: false, multiple: matches, error: 'Multiple staff share this number. Please select your name.' };
    }

    const user = profileId ? matches.find((p) => p.id === profileId) || matches[0] : matches[0];

    if (!user.is_active) {
      return { success: false, error: 'This account has been deactivated. Contact Admin.' };
    }

    this.setCurrentUser(user);
    return { success: true, user };
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getProfiles(): Profile[] {
    return loadStorage<Profile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
  },

  saveProfile(profileData: Omit<Profile, 'id' | 'created_at' | 'updated_at'>): Profile {
    const profiles = this.getProfiles();
    const newProfile: Profile = {
      ...profileData,
      id: `p-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    profiles.push(newProfile);
    saveStorage(STORAGE_KEYS.PROFILES, profiles);

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('profiles')
        .insert({
          full_name: newProfile.full_name,
          phone: newProfile.phone,
          role: newProfile.role,
          is_active: newProfile.is_active,
        })
        .then();
    }

    return newProfile;
  },

  toggleProfileStatus(id: string): Profile | null {
    const profiles = this.getProfiles();
    const index = profiles.findIndex((p) => p.id === id);
    if (index === -1) return null;

    profiles[index].is_active = !profiles[index].is_active;
    profiles[index].updated_at = new Date().toISOString();
    saveStorage(STORAGE_KEYS.PROFILES, profiles);

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('profiles')
        .update({ is_active: profiles[index].is_active })
        .eq('id', id)
        .then();
    }

    return profiles[index];
  },

  // =========================================================================
  // BUSINESS SETTINGS
  // =========================================================================
  getSettings(): BusinessSettings {
    return loadStorage<BusinessSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  },

  updateSettings(partial: Partial<BusinessSettings>): BusinessSettings {
    const settings = this.getSettings();
    const updated: BusinessSettings = {
      ...settings,
      ...partial,
      updated_at: new Date().toISOString(),
    };
    saveStorage(STORAGE_KEYS.SETTINGS, updated);

    if (isSupabaseConfigured && supabase) {
      supabase.from('business_settings').update(partial).then();
    }

    return updated;
  },

  // =========================================================================
  // CUSTOMERS
  // =========================================================================
  getCustomers(): Customer[] {
    return loadStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  },

  getCustomerById(id: string): Customer | undefined {
    return this.getCustomers().find((c) => c.id === id);
  },

  createCustomer(data: { name: string; phone: string; place: string; address?: string; notes?: string }): Customer {
    const customers = this.getCustomers();
    const cleanPhone = data.phone.replace(/\D/g, '');

    const existing = customers.find((c) => c.phone.replace(/\D/g, '') === cleanPhone);
    if (existing) {
      return existing;
    }

    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name: data.name.trim(),
      phone: cleanPhone,
      place: data.place.trim(),
      address: data.address?.trim() || null,
      notes: data.notes?.trim() || null,
      total_purchases: 0,
      total_paid: 0,
      outstanding_balance: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    customers.unshift(newCustomer);
    saveStorage(STORAGE_KEYS.CUSTOMERS, customers);

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('customers')
        .insert({
          name: newCustomer.name,
          phone: newCustomer.phone,
          place: newCustomer.place,
          address: newCustomer.address,
          notes: newCustomer.notes,
          total_purchases: 0,
          total_paid: 0,
          outstanding_balance: 0,
        })
        .then();
    }

    return newCustomer;
  },

  // =========================================================================
  // PLANTS & INVENTORY
  // =========================================================================
  getPlants(): Plant[] {
    return loadStorage<Plant[]>(STORAGE_KEYS.PLANTS, INITIAL_PLANTS);
  },

  getPlantById(id: string): Plant | undefined {
    return this.getPlants().find((p) => p.id === id);
  },

  createPlant(data: Omit<Plant, 'id' | 'created_at' | 'updated_at'>): Plant {
    const plants = this.getPlants();
    const newPlant: Plant = {
      ...data,
      id: `plant-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    plants.push(newPlant);
    saveStorage(STORAGE_KEYS.PLANTS, plants);

    if (newPlant.current_stock > 0) {
      this.recordStockMovement({
        plant_id: newPlant.id,
        movement_type: 'STOCK_IN',
        quantity: newPlant.current_stock,
        previous_stock: 0,
        new_stock: newPlant.current_stock,
        notes: 'Initial plant catalog entry',
      });
    }

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('plants')
        .insert({
          name: newPlant.name,
          tamil_name: newPlant.tamil_name,
          category: newPlant.category,
          selling_price: newPlant.selling_price,
          current_stock: newPlant.current_stock,
          min_stock_alert: newPlant.min_stock_alert,
          is_active: true,
        })
        .then();
    }

    return newPlant;
  },

  updatePlant(id: string, partial: Partial<Plant>): Plant | null {
    const plants = this.getPlants();
    const index = plants.findIndex((p) => p.id === id);
    if (index === -1) return null;

    plants[index] = {
      ...plants[index],
      ...partial,
      updated_at: new Date().toISOString(),
    };
    saveStorage(STORAGE_KEYS.PLANTS, plants);

    if (isSupabaseConfigured && supabase) {
      supabase.from('plants').update(partial).eq('id', id).then();
    }

    return plants[index];
  },

  performStockIn(plantId: string, quantity: number, notes?: string): { success: boolean; plant?: Plant; error?: string } {
    if (quantity <= 0) return { success: false, error: 'Quantity must be greater than zero' };

    const plants = this.getPlants();
    const plant = plants.find((p) => p.id === plantId);
    if (!plant) return { success: false, error: 'Plant not found' };

    const prevStock = plant.current_stock;
    const newStock = prevStock + quantity;
    plant.current_stock = newStock;
    plant.updated_at = new Date().toISOString();

    saveStorage(STORAGE_KEYS.PLANTS, plants);

    this.recordStockMovement({
      plant_id: plant.id,
      movement_type: 'STOCK_IN',
      quantity,
      previous_stock: prevStock,
      new_stock: newStock,
      notes: notes || 'Stock received / propagation batch',
    });

    if (isSupabaseConfigured && supabase) {
      supabase.from('plants').update({ current_stock: newStock }).eq('id', plantId).then();
    }

    return { success: true, plant };
  },

  performStockAdjustment(
    plantId: string,
    physicalStock: number,
    reason: string
  ): { success: boolean; plant?: Plant; error?: string } {
    if (physicalStock < 0) return { success: false, error: 'Physical stock cannot be negative' };

    const plants = this.getPlants();
    const plant = plants.find((p) => p.id === plantId);
    if (!plant) return { success: false, error: 'Plant not found' };

    const prevStock = plant.current_stock;
    const delta = physicalStock - prevStock;
    if (delta === 0) return { success: true, plant };

    plant.current_stock = physicalStock;
    plant.updated_at = new Date().toISOString();

    saveStorage(STORAGE_KEYS.PLANTS, plants);

    this.recordStockMovement({
      plant_id: plant.id,
      movement_type: delta < 0 ? 'DAMAGE_OUT' : 'ADJUSTMENT',
      quantity: delta,
      previous_stock: prevStock,
      new_stock: physicalStock,
      notes: `Adjustment: ${reason} (Variance: ${delta > 0 ? '+' : ''}${delta})`,
    });

    if (isSupabaseConfigured && supabase) {
      supabase.from('plants').update({ current_stock: physicalStock }).eq('id', plantId).then();
    }

    return { success: true, plant };
  },

  getStockMovements(plantId?: string): StockMovement[] {
    const all = loadStorage<StockMovement[]>(STORAGE_KEYS.STOCK_MOVEMENTS, []);
    if (!plantId) return all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return all
      .filter((m) => m.plant_id === plantId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  recordStockMovement(movement: {
    plant_id: string;
    movement_type: StockMovement['movement_type'];
    quantity: number;
    previous_stock: number;
    new_stock: number;
    reference_bill_id?: string | null;
    notes?: string;
  }): StockMovement {
    const movements = loadStorage<StockMovement[]>(STORAGE_KEYS.STOCK_MOVEMENTS, []);
    const user = this.getCurrentUser();
    const plant = this.getPlantById(movement.plant_id);

    const record: StockMovement = {
      id: `sm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      plant_id: movement.plant_id,
      movement_type: movement.movement_type,
      quantity: movement.quantity,
      previous_stock: movement.previous_stock,
      new_stock: movement.new_stock,
      reference_bill_id: movement.reference_bill_id || null,
      notes: movement.notes || null,
      created_by: user.id,
      created_at: new Date().toISOString(),
      plant,
      created_by_profile: user,
    };

    movements.unshift(record);
    saveStorage(STORAGE_KEYS.STOCK_MOVEMENTS, movements);

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('stock_movements')
        .insert({
          plant_id: movement.plant_id,
          movement_type: movement.movement_type,
          quantity: movement.quantity,
          previous_stock: movement.previous_stock,
          new_stock: movement.new_stock,
          reference_bill_id: movement.reference_bill_id,
          notes: movement.notes,
          created_by: user.id,
        })
        .then();
    }

    return record;
  },

  // =========================================================================
  // BILLING & ORDERS
  // =========================================================================
  getBills(): Bill[] {
    return loadStorage<Bill[]>(STORAGE_KEYS.BILLS, INITIAL_BILLS).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  getBillById(id: string): Bill | undefined {
    return this.getBills().find((b) => b.id === id);
  },

  createRetailBill(payload: {
    customerId: string;
    items: Array<{ plantId: string; quantity: number; unitPrice: number }>;
    discountAmount: number;
    paidAmount: number;
    paymentMode: 'CASH' | 'UPI';
    transactionRef?: string;
    notes?: string;
  }): { success: boolean; bill?: Bill; error?: string } {
    const customers = this.getCustomers();
    const customer = customers.find((c) => c.id === payload.customerId);
    if (!customer) return { success: false, error: 'Customer not found' };

    const plants = this.getPlants();
    const currentUser = this.getCurrentUser();

    // 1. Verify stock for all items
    for (const item of payload.items) {
      const plant = plants.find((p) => p.id === item.plantId);
      if (!plant) {
        return { success: false, error: `Plant ID ${item.plantId} not found` };
      }
      if (plant.current_stock < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for "${plant.name}". Available: ${plant.current_stock}, Requested: ${item.quantity}`,
        };
      }
    }

    // 2. Compute financial totals
    let subtotal = 0;
    const billItems: BillItem[] = [];
    const billId = `bill-${Date.now()}`;

    for (const item of payload.items) {
      const plant = plants.find((p) => p.id === item.plantId)!;
      const lineTotal = item.quantity * item.unitPrice;
      subtotal += lineTotal;

      billItems.push({
        id: `bi-${Date.now()}-${item.plantId}`,
        bill_id: billId,
        plant_id: plant.id,
        plant_name: plant.name,
        estimated_quantity: item.quantity,
        actual_quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: lineTotal,
        created_at: new Date().toISOString(),
      });
    }

    const discount = Math.max(0, payload.discountAmount || 0);
    const totalAmount = Math.max(0, subtotal - discount);
    const paidAmount = Math.min(totalAmount, Math.max(0, payload.paidAmount || 0));
    const balanceAmount = totalAmount - paidAmount;

    let paymentStatus: Bill['payment_status'] = 'UNPAID';
    if (balanceAmount === 0) paymentStatus = 'PAID';
    else if (paidAmount > 0) paymentStatus = 'PARTIAL';

    // 3. Generate sequential bill number
    const settings = this.getSettings();
    const year = new Date().getFullYear();
    const billNumber = `${settings.retail_bill_prefix}-${year}-${String(settings.next_retail_seq).padStart(5, '0')}`;
    this.updateSettings({ next_retail_seq: settings.next_retail_seq + 1 });

    // 4. Atomic Stock Decrement & Movement Logging
    for (const item of payload.items) {
      const plantIndex = plants.findIndex((p) => p.id === item.plantId);
      const prevStock = plants[plantIndex].current_stock;
      const newStock = prevStock - item.quantity;
      plants[plantIndex].current_stock = newStock;
      plants[plantIndex].updated_at = new Date().toISOString();

      this.recordStockMovement({
        plant_id: item.plantId,
        movement_type: 'RETAIL_SALE',
        quantity: -item.quantity,
        previous_stock: prevStock,
        new_stock: newStock,
        reference_bill_id: billId,
        notes: `Retail Sale: ${billNumber}`,
      });

      if (isSupabaseConfigured && supabase) {
        supabase.from('plants').update({ current_stock: newStock }).eq('id', item.plantId).then();
      }
    }
    saveStorage(STORAGE_KEYS.PLANTS, plants);

    // 5. Construct Bill Object
    const newBill: Bill = {
      id: billId,
      bill_number: billNumber,
      bill_type: 'RETAIL',
      customer_id: customer.id,
      customer_name: customer.name,
      customer_phone: customer.phone,
      place: customer.place,
      status: 'COMPLETED',
      subtotal,
      discount_amount: discount,
      total_amount: totalAmount,
      advance_amount: 0,
      paid_amount: paidAmount,
      balance_amount: balanceAmount,
      payment_status: paymentStatus,
      stock_deducted: true,
      notes: payload.notes || null,
      billed_by: currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: billItems,
      billed_by_profile: currentUser,
    };

    const bills = this.getBills();
    bills.unshift(newBill);
    saveStorage(STORAGE_KEYS.BILLS, bills);

    // 6. Record Payment if paidAmount > 0
    if (paidAmount > 0) {
      this.recordPayment({
        bill_id: billId,
        customer_id: customer.id,
        amount: paidAmount,
        payment_type: 'RETAIL_PAYMENT',
        payment_mode: payload.paymentMode,
        transaction_reference: payload.transactionRef,
        notes: 'Initial counter payment',
      });
    }

    // 7. Update Customer Master Ledger
    customer.total_purchases += totalAmount;
    customer.total_paid += paidAmount;
    customer.outstanding_balance += balanceAmount;
    customer.updated_at = new Date().toISOString();
    saveStorage(STORAGE_KEYS.CUSTOMERS, customers);

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('bills')
        .insert({
          bill_number: newBill.bill_number,
          bill_type: 'RETAIL',
          customer_id: customer.id,
          customer_name: customer.name,
          customer_phone: customer.phone,
          place: customer.place,
          status: 'COMPLETED',
          subtotal,
          discount_amount: discount,
          total_amount: totalAmount,
          advance_amount: 0,
          paid_amount: paidAmount,
          balance_amount: balanceAmount,
          payment_status: paymentStatus,
          stock_deducted: true,
          notes: newBill.notes,
          billed_by: currentUser.id,
        })
        .then();

      supabase
        .from('customers')
        .update({
          total_purchases: customer.total_purchases,
          total_paid: customer.total_paid,
          outstanding_balance: customer.outstanding_balance,
        })
        .eq('id', customer.id)
        .then();
    }

    return { success: true, bill: newBill };
  },

  createFunctionOrder(payload: {
    customerId: string;
    functionDate: string;
    functionDescription: string;
    items: Array<{ plantId: string; estimatedQuantity: number; unitPrice: number }>;
    discountAmount: number;
    advanceAmount: number;
    paymentMode: 'CASH' | 'UPI';
    transactionRef?: string;
    notes?: string;
  }): { success: boolean; bill?: Bill; error?: string } {
    const customers = this.getCustomers();
    const customer = customers.find((c) => c.id === payload.customerId);
    if (!customer) return { success: false, error: 'Customer not found' };

    const plants = this.getPlants();
    const currentUser = this.getCurrentUser();

    let subtotal = 0;
    const billItems: BillItem[] = [];
    const billId = `bill-${Date.now()}`;

    for (const item of payload.items) {
      const plant = plants.find((p) => p.id === item.plantId);
      const plantName = plant ? plant.name : 'Unknown Plant';
      const lineTotal = item.estimatedQuantity * item.unitPrice;
      subtotal += lineTotal;

      billItems.push({
        id: `bi-${Date.now()}-${item.plantId}`,
        bill_id: billId,
        plant_id: item.plantId,
        plant_name: plantName,
        estimated_quantity: item.estimatedQuantity,
        actual_quantity: 0,
        unit_price: item.unitPrice,
        total_price: lineTotal,
        created_at: new Date().toISOString(),
      });
    }

    const discount = Math.max(0, payload.discountAmount || 0);
    const totalAmount = Math.max(0, subtotal - discount);
    const advanceAmount = Math.min(totalAmount, Math.max(0, payload.advanceAmount || 0));
    const balanceAmount = totalAmount - advanceAmount;

    let paymentStatus: Bill['payment_status'] = 'UNPAID';
    if (balanceAmount === 0) paymentStatus = 'PAID';
    else if (advanceAmount > 0) paymentStatus = 'PARTIAL';

    const settings = this.getSettings();
    const year = new Date().getFullYear();
    const billNumber = `${settings.function_bill_prefix}-${year}-${String(settings.next_function_seq).padStart(5, '0')}`;
    this.updateSettings({ next_function_seq: settings.next_function_seq + 1 });

    const newBill: Bill = {
      id: billId,
      bill_number: billNumber,
      bill_type: 'FUNCTION',
      customer_id: customer.id,
      customer_name: customer.name,
      customer_phone: customer.phone,
      place: customer.place,
      function_date: payload.functionDate,
      function_description: payload.functionDescription,
      status: 'CONFIRMED',
      subtotal,
      discount_amount: discount,
      total_amount: totalAmount,
      advance_amount: advanceAmount,
      paid_amount: advanceAmount,
      balance_amount: balanceAmount,
      payment_status: paymentStatus,
      stock_deducted: false, // NO stock deduction on booking!
      notes: payload.notes || null,
      billed_by: currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: billItems,
      billed_by_profile: currentUser,
    };

    const bills = this.getBills();
    bills.unshift(newBill);
    saveStorage(STORAGE_KEYS.BILLS, bills);

    if (advanceAmount > 0) {
      this.recordPayment({
        bill_id: billId,
        customer_id: customer.id,
        amount: advanceAmount,
        payment_type: 'ADVANCE',
        payment_mode: payload.paymentMode,
        transaction_reference: payload.transactionRef,
        notes: 'Booking advance for function order',
      });
    }

    customer.total_purchases += totalAmount;
    customer.total_paid += advanceAmount;
    customer.outstanding_balance += balanceAmount;
    customer.updated_at = new Date().toISOString();
    saveStorage(STORAGE_KEYS.CUSTOMERS, customers);

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('bills')
        .insert({
          bill_number: newBill.bill_number,
          bill_type: 'FUNCTION',
          customer_id: customer.id,
          customer_name: customer.name,
          customer_phone: customer.phone,
          place: customer.place,
          function_date: payload.functionDate,
          function_description: payload.functionDescription,
          status: 'CONFIRMED',
          subtotal,
          discount_amount: discount,
          total_amount: totalAmount,
          advance_amount: advanceAmount,
          paid_amount: advanceAmount,
          balance_amount: balanceAmount,
          payment_status: paymentStatus,
          stock_deducted: false,
          notes: newBill.notes,
          billed_by: currentUser.id,
        })
        .then();
    }

    return { success: true, bill: newBill };
  },

  completeFunctionOrder(payload: {
    billId: string;
    actualItems: Array<{ plantId: string; actualQuantity: number; unitPrice: number }>;
    finalDiscount: number;
    settlementPaymentAmount: number;
    paymentMode: 'CASH' | 'UPI';
    transactionRef?: string;
    notes?: string;
  }): { success: boolean; bill?: Bill; error?: string } {
    const bills = this.getBills();
    const bill = bills.find((b) => b.id === payload.billId);
    if (!bill) return { success: false, error: 'Bill not found' };

    if (bill.stock_deducted) {
      return { success: false, error: 'Stock has already been deducted for this function order' };
    }
    if (bill.status === 'COMPLETED') {
      return { success: false, error: 'Order is already marked as completed' };
    }

    const plants = this.getPlants();

    for (const item of payload.actualItems) {
      const plant = plants.find((p) => p.id === item.plantId);
      if (!plant) return { success: false, error: `Plant ID ${item.plantId} not found` };
      if (plant.current_stock < item.actualQuantity) {
        return {
          success: false,
          error: `Insufficient stock to fulfill function for "${plant.name}". Available: ${plant.current_stock}, Required: ${item.actualQuantity}`,
        };
      }
    }

    let finalSubtotal = 0;
    const updatedItems: BillItem[] = [];

    for (const item of payload.actualItems) {
      const plant = plants.find((p) => p.id === item.plantId)!;
      const lineTotal = item.actualQuantity * item.unitPrice;
      finalSubtotal += lineTotal;

      const existingItem = bill.items?.find((i) => i.plant_id === item.plantId);
      updatedItems.push({
        id: existingItem ? existingItem.id : `bi-${Date.now()}-${item.plantId}`,
        bill_id: bill.id,
        plant_id: plant.id,
        plant_name: plant.name,
        estimated_quantity: existingItem ? existingItem.estimated_quantity : item.actualQuantity,
        actual_quantity: item.actualQuantity,
        unit_price: item.unitPrice,
        total_price: lineTotal,
        created_at: existingItem ? existingItem.created_at : new Date().toISOString(),
      });
    }

    const finalDiscount = Math.max(0, payload.finalDiscount || 0);
    const finalTotal = Math.max(0, finalSubtotal - finalDiscount);
    const newPaid = bill.paid_amount + Math.max(0, payload.settlementPaymentAmount || 0);
    const newBalance = Math.max(0, finalTotal - newPaid);

    let paymentStatus: Bill['payment_status'] = 'UNPAID';
    if (newBalance === 0) paymentStatus = 'PAID';
    else if (newPaid > 0) paymentStatus = 'PARTIAL';

    for (const item of payload.actualItems) {
      const plantIndex = plants.findIndex((p) => p.id === item.plantId);
      const prevStock = plants[plantIndex].current_stock;
      const newStock = prevStock - item.actualQuantity;
      plants[plantIndex].current_stock = newStock;
      plants[plantIndex].updated_at = new Date().toISOString();

      this.recordStockMovement({
        plant_id: item.plantId,
        movement_type: 'FUNCTION_FULFILLMENT',
        quantity: -item.actualQuantity,
        previous_stock: prevStock,
        new_stock: newStock,
        reference_bill_id: bill.id,
        notes: `Function Fulfillment: ${bill.bill_number}`,
      });

      if (isSupabaseConfigured && supabase) {
        supabase.from('plants').update({ current_stock: newStock }).eq('id', item.plantId).then();
      }
    }
    saveStorage(STORAGE_KEYS.PLANTS, plants);

    if (payload.settlementPaymentAmount > 0) {
      this.recordPayment({
        bill_id: bill.id,
        customer_id: bill.customer_id,
        amount: payload.settlementPaymentAmount,
        payment_type: 'BALANCE_SETTLEMENT',
        payment_mode: payload.paymentMode,
        transaction_reference: payload.transactionRef,
        notes: 'Final function settlement payment',
      });
    }

    const oldTotal = bill.total_amount;
    bill.items = updatedItems;
    bill.subtotal = finalSubtotal;
    bill.discount_amount = finalDiscount;
    bill.total_amount = finalTotal;
    bill.paid_amount = newPaid;
    bill.balance_amount = newBalance;
    bill.payment_status = paymentStatus;
    bill.status = 'COMPLETED';
    bill.stock_deducted = true;
    if (payload.notes) bill.notes = payload.notes;
    bill.updated_at = new Date().toISOString();

    saveStorage(STORAGE_KEYS.BILLS, bills);

    const customers = this.getCustomers();
    const customer = customers.find((c) => c.id === bill.customer_id);
    if (customer) {
      const diffTotal = finalTotal - oldTotal;
      customer.total_purchases += diffTotal;
      customer.total_paid += payload.settlementPaymentAmount;
      customer.outstanding_balance += diffTotal - payload.settlementPaymentAmount;
      customer.updated_at = new Date().toISOString();
      saveStorage(STORAGE_KEYS.CUSTOMERS, customers);
    }

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('bills')
        .update({
          subtotal: finalSubtotal,
          discount_amount: finalDiscount,
          total_amount: finalTotal,
          paid_amount: newPaid,
          balance_amount: newBalance,
          payment_status: paymentStatus,
          status: 'COMPLETED',
          stock_deducted: true,
        })
        .eq('id', bill.id)
        .then();
    }

    return { success: true, bill };
  },

  // =========================================================================
  // PAYMENTS & COLLECTIONS
  // =========================================================================
  getPayments(): Payment[] {
    const payments = loadStorage<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
    const customers = this.getCustomers();
    const bills = this.getBills();
    const profiles = this.getProfiles();

    return payments
      .map((p) => ({
        ...p,
        customer: customers.find((c) => c.id === p.customer_id),
        bill: bills.find((b) => b.id === p.bill_id),
        received_by_profile: profiles.find((prof) => prof.id === p.received_by),
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  recordPayment(data: {
    bill_id: string;
    customer_id: string;
    amount: number;
    payment_type: Payment['payment_type'];
    payment_mode: Payment['payment_mode'];
    transaction_reference?: string | null;
    notes?: string;
  }): Payment {
    const payments = loadStorage<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
    const user = this.getCurrentUser();
    const paymentNum = `PAY-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(payments.length + 1).padStart(4, '0')}`;

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      payment_number: paymentNum,
      bill_id: data.bill_id,
      customer_id: data.customer_id,
      amount: data.amount,
      payment_type: data.payment_type,
      payment_mode: data.payment_mode,
      transaction_reference: data.transaction_reference || null,
      received_by: user.id,
      notes: data.notes || null,
      created_at: new Date().toISOString(),
    };

    payments.unshift(newPayment);
    saveStorage(STORAGE_KEYS.PAYMENTS, payments);

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('payments')
        .insert({
          payment_number: newPayment.payment_number,
          bill_id: data.bill_id,
          customer_id: data.customer_id,
          amount: data.amount,
          payment_type: data.payment_type,
          payment_mode: data.payment_mode,
          transaction_reference: data.transaction_reference,
          received_by: user.id,
          notes: data.notes,
        })
        .then();
    }

    return newPayment;
  },

  recordBalancePayment(payload: {
    billId: string;
    amount: number;
    paymentMode: 'CASH' | 'UPI';
    transactionRef?: string;
    notes?: string;
  }): { success: boolean; payment?: Payment; error?: string } {
    if (payload.amount <= 0) {
      return { success: false, error: 'Payment amount must be greater than zero' };
    }

    const bills = this.getBills();
    const bill = bills.find((b) => b.id === payload.billId);
    if (!bill) return { success: false, error: 'Bill not found' };

    if (bill.balance_amount <= 0) {
      return { success: false, error: 'This bill has zero outstanding balance' };
    }

    if (payload.amount > bill.balance_amount) {
      return {
        success: false,
        error: `Payment amount (₹${payload.amount}) exceeds outstanding bill balance (₹${bill.balance_amount})`,
      };
    }

    const payment = this.recordPayment({
      bill_id: bill.id,
      customer_id: bill.customer_id,
      amount: payload.amount,
      payment_type: 'BALANCE_SETTLEMENT',
      payment_mode: payload.paymentMode,
      transaction_reference: payload.transactionRef,
      notes: payload.notes || 'Balance collection payment',
    });

    bill.paid_amount += payload.amount;
    bill.balance_amount -= payload.amount;
    bill.payment_status = bill.balance_amount === 0 ? 'PAID' : 'PARTIAL';
    bill.updated_at = new Date().toISOString();
    saveStorage(STORAGE_KEYS.BILLS, bills);

    const customers = this.getCustomers();
    const customer = customers.find((c) => c.id === bill.customer_id);
    if (customer) {
      customer.total_paid += payload.amount;
      customer.outstanding_balance -= payload.amount;
      customer.updated_at = new Date().toISOString();
      saveStorage(STORAGE_KEYS.CUSTOMERS, customers);
    }

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('bills')
        .update({
          paid_amount: bill.paid_amount,
          balance_amount: bill.balance_amount,
          payment_status: bill.payment_status,
        })
        .eq('id', bill.id)
        .then();
    }

    return { success: true, payment };
  },

  // =========================================================================
  // DASHBOARD METRICS
  // =========================================================================
  getDashboardMetrics() {
    const todayStr = new Date().toISOString().slice(0, 10);
    const bills = this.getBills();
    const payments = this.getPayments();
    const plants = this.getPlants();
    const customers = this.getCustomers();

    const todayBills = bills.filter(
      (b) => b.created_at.slice(0, 10) === todayStr && b.status !== 'CANCELLED'
    );
    const todaySales = todayBills.reduce((sum, b) => sum + b.total_amount, 0);

    const todayPayments = payments.filter((p) => p.created_at.slice(0, 10) === todayStr);
    const todayCollection = todayPayments.reduce((sum, p) => sum + p.amount, 0);
    const todayCashCollection = todayPayments
      .filter((p) => p.payment_mode === 'CASH')
      .reduce((sum, p) => sum + p.amount, 0);
    const todayUpiCollection = todayPayments
      .filter((p) => p.payment_mode === 'UPI')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalPendingReceivables = customers.reduce(
      (sum, c) => sum + Math.max(0, c.outstanding_balance),
      0
    );

    const upcomingFunctions = bills
      .filter((b) => b.bill_type === 'FUNCTION' && b.status === 'CONFIRMED')
      .sort((a, b) => new Date(a.function_date || '').getTime() - new Date(b.function_date || '').getTime());

    const lowStockPlants = plants.filter((p) => p.is_active && p.current_stock <= p.min_stock_alert);
    const totalPlantsInStock = plants.filter((p) => p.is_active).reduce((sum, p) => sum + p.current_stock, 0);

    return {
      todaySales,
      todayBillsCount: todayBills.length,
      todayCollection,
      todayCashCollection,
      todayUpiCollection,
      totalPendingReceivables,
      totalPlantsInStock,
      lowStockPlants,
      upcomingFunctions,
      recentBills: bills.slice(0, 8),
    };
  },
};

// Initiate background sync with Supabase
dataService.syncFromSupabase();
