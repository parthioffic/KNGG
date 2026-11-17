# Database Schema & DDL Specification: Kalaiselvi Nursery Garden (KNG)

This document contains the complete, production-ready PostgreSQL schema designed for Kalaiselvi Nursery Garden on Supabase. It includes table definitions, foreign keys, indexes, constraints, triggers, Row Level Security (RLS) policies, and atomic Stored Procedures (RPCs).

---

## 1. Schema Overview & Conventions

- **Identifier Strategy**: `UUID` primary keys generated with `gen_random_uuid()` to prevent enumeration attacks and simplify distributed insertions.
- **Monetary Precision**: All currency amounts (rates, subtotals, totals, payments, balances) use `NUMERIC(12, 2)`.
- **Quantity Precision**: Plant quantities use `NUMERIC(10, 2)` (allowing whole numbers for pots as well as decimal units if fertilizer/manure is ever measured by kg).
- **Time Zones**: All timestamps use `TIMESTAMPTZ` and default to `now()`.
- **Audit Trails**: Every mutation table records `created_by` or `billed_by` linked to `profiles.id`.

---

## 2. Table Definitions (DDL)

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. PROFILES (Staff & Admin Accounts)
-- ============================================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. BUSINESS_SETTINGS (Singleton Configuration)
-- ============================================================================
CREATE TABLE public.business_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL DEFAULT 'Kalaiselvi Nursery Garden',
    business_name_tamil TEXT NOT NULL DEFAULT 'கலைச்செல்வி நர்சரி கார்டன்',
    address TEXT NOT NULL DEFAULT 'Mailam Road, Kutteripattu, Tindivanam Taluk, Villupuram, Tamil Nadu 604304',
    phones TEXT[] NOT NULL DEFAULT ARRAY['9488782488', '8531859560', '8637406716'],
    email TEXT,
    logo_url TEXT,
    currency TEXT NOT NULL DEFAULT 'INR',
    retail_bill_prefix TEXT NOT NULL DEFAULT 'KNG-RET',
    function_bill_prefix TEXT NOT NULL DEFAULT 'KNG-FNC',
    next_retail_seq INTEGER NOT NULL DEFAULT 1,
    next_function_seq INTEGER NOT NULL DEFAULT 1,
    bill_footer_tamil TEXT NOT NULL DEFAULT 'எங்களை தேர்ந்தெடுத்ததற்கு நன்றி! மீண்டும் வருக! 🌱',
    bill_footer_english TEXT NOT NULL DEFAULT 'Thank you for choosing Kalaiselvi Nursery Garden! 🌱',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES public.profiles(id)
);

-- Ensure only one business settings row exists
CREATE UNIQUE INDEX business_settings_singleton_idx ON public.business_settings ((true));

-- ============================================================================
-- 3. CUSTOMERS
-- ============================================================================
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    place TEXT NOT NULL DEFAULT 'Kutteripattu',
    address TEXT,
    notes TEXT,
    total_purchases NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_purchases >= 0),
    total_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_paid >= 0),
    outstanding_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_phone ON public.customers (phone);
CREATE INDEX idx_customers_name ON public.customers (name);
CREATE INDEX idx_customers_balance ON public.customers (outstanding_balance) WHERE outstanding_balance > 0;

-- ============================================================================
-- 4. PLANTS (Inventory Catalog)
-- ============================================================================
CREATE TABLE public.plants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    tamil_name TEXT,
    category TEXT NOT NULL CHECK (category IN (
        'Flowering Plants', 
        'Fruit Plants', 
        'Indoor Plants', 
        'Timber Trees', 
        'Shrubs & Hedges', 
        'Medicinal & Herbal', 
        'Pots & Fertilizers', 
        'Other'
    )),
    selling_price NUMERIC(12, 2) NOT NULL CHECK (selling_price >= 0),
    current_stock NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (current_stock >= 0),
    min_stock_alert NUMERIC(10, 2) NOT NULL DEFAULT 10.00 CHECK (min_stock_alert >= 0),
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_plants_category ON public.plants (category);
CREATE INDEX idx_plants_is_active ON public.plants (is_active);
CREATE INDEX idx_plants_low_stock ON public.plants (current_stock, min_stock_alert) WHERE current_stock <= min_stock_alert;

-- ============================================================================
-- 5. BILLS (Retail Bills and Function Orders)
-- ============================================================================
CREATE TABLE public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_number TEXT NOT NULL UNIQUE,
    bill_type TEXT NOT NULL CHECK (bill_type IN ('RETAIL', 'FUNCTION')),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    
    -- Denormalized snapshot of customer info at time of billing
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    place TEXT NOT NULL,
    
    -- Function Order Specific Fields
    function_date TIMESTAMPTZ,
    function_description TEXT,
    
    -- Lifecycle Status
    status TEXT NOT NULL CHECK (status IN ('OPEN', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
    
    -- Financials
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    advance_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (advance_amount >= 0),
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    balance_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (balance_amount >= 0),
    payment_status TEXT NOT NULL CHECK (payment_status IN ('UNPAID', 'PARTIAL', 'PAID')),
    
    -- Inventory settlement flag
    stock_deducted BOOLEAN NOT NULL DEFAULT false,
    
    notes TEXT,
    billed_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bills_customer_id ON public.bills (customer_id);
CREATE INDEX idx_bills_bill_type ON public.bills (bill_type);
CREATE INDEX idx_bills_status ON public.bills (status);
CREATE INDEX idx_bills_payment_status ON public.bills (payment_status);
CREATE INDEX idx_bills_created_at ON public.bills (created_at DESC);
CREATE INDEX idx_bills_function_date ON public.bills (function_date) WHERE bill_type = 'FUNCTION';

-- ============================================================================
-- 6. BILL_ITEMS (Line Items for Bills)
-- ============================================================================
CREATE TABLE public.bill_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    plant_id UUID NOT NULL REFERENCES public.plants(id) ON DELETE RESTRICT,
    plant_name TEXT NOT NULL,
    
    -- Preserving estimated vs actual for function orders
    estimated_quantity NUMERIC(10, 2) NOT NULL CHECK (estimated_quantity >= 0),
    actual_quantity NUMERIC(10, 2) NOT NULL CHECK (actual_quantity >= 0),
    
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    total_price NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bill_items_bill_id ON public.bill_items (bill_id);
CREATE INDEX idx_bill_items_plant_id ON public.bill_items (plant_id);

-- ============================================================================
-- 7. PAYMENTS (Audit Log of All Transactions)
-- ============================================================================
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_number TEXT NOT NULL UNIQUE,
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_type TEXT NOT NULL CHECK (payment_type IN ('RETAIL_PAYMENT', 'ADVANCE', 'BALANCE_SETTLEMENT')),
    payment_mode TEXT NOT NULL CHECK (payment_mode IN ('CASH', 'UPI')),
    transaction_reference TEXT,
    received_by UUID NOT NULL REFERENCES public.profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_bill_id ON public.payments (bill_id);
CREATE INDEX idx_payments_customer_id ON public.payments (customer_id);
CREATE INDEX idx_payments_created_at ON public.payments (created_at DESC);
CREATE INDEX idx_payments_payment_mode ON public.payments (payment_mode);

-- ============================================================================
-- 8. STOCK_MOVEMENTS (Immutable Inventory Ledger)
-- ============================================================================
CREATE TABLE public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id UUID NOT NULL REFERENCES public.plants(id) ON DELETE RESTRICT,
    movement_type TEXT NOT NULL CHECK (movement_type IN (
        'RETAIL_SALE', 
        'FUNCTION_FULFILLMENT', 
        'STOCK_IN', 
        'DAMAGE_OUT', 
        'ADJUSTMENT', 
        'BILL_CANCELLATION'
    )),
    quantity NUMERIC(10, 2) NOT NULL, -- Negative for decrement, positive for increment
    previous_stock NUMERIC(10, 2) NOT NULL CHECK (previous_stock >= 0),
    new_stock NUMERIC(10, 2) NOT NULL CHECK (new_stock >= 0),
    reference_bill_id UUID REFERENCES public.bills(id),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_movements_plant_id ON public.stock_movements (plant_id);
CREATE INDEX idx_stock_movements_reference_bill ON public.stock_movements (reference_bill_id);
CREATE INDEX idx_stock_movements_created_at ON public.stock_movements (created_at DESC);
```

---

## 3. Database Functions & Triggers

### 3.1 Automatic `updated_at` Trigger
```sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_plants_updated_at BEFORE UPDATE ON public.plants FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_bills_updated_at BEFORE UPDATE ON public.bills FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_business_settings_updated_at BEFORE UPDATE ON public.business_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

### 3.2 Sequential Bill Number Generator (Race-Safe)
```sql
CREATE OR REPLACE FUNCTION public.generate_bill_number(p_bill_type TEXT)
RETURNS TEXT AS $$
DECLARE
    v_prefix TEXT;
    v_seq INTEGER;
    v_year TEXT;
    v_bill_number TEXT;
BEGIN
    v_year := to_char(now(), 'YYYY');

    -- Lock the business_settings row to guarantee atomic sequential numbering
    IF p_bill_type = 'RETAIL' THEN
        SELECT retail_bill_prefix, next_retail_seq
        INTO v_prefix, v_seq
        FROM public.business_settings
        FOR UPDATE;

        UPDATE public.business_settings
        SET next_retail_seq = next_retail_seq + 1;
    ELSE
        SELECT function_bill_prefix, next_function_seq
        INTO v_prefix, v_seq
        FROM public.business_settings
        FOR UPDATE;

        UPDATE public.business_settings
        SET next_function_seq = next_function_seq + 1;
    END IF;

    v_bill_number := v_prefix || '-' || v_year || '-' || lpad(v_seq::text, 5, '0');
    RETURN v_bill_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. Atomic Business Stored Procedures (RPCs)

### 4.1 `create_retail_bill`
Creates a retail bill, validates stock, reduces stock atomically, logs stock movements, writes bill items, writes payment (if paid), and updates customer balance.

```sql
CREATE OR REPLACE FUNCTION public.create_retail_bill(
    p_customer_id UUID,
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_place TEXT,
    p_items JSONB,              -- Array of { plant_id, quantity, unit_price, total_price }
    p_subtotal NUMERIC,
    p_discount_amount NUMERIC,
    p_total_amount NUMERIC,
    p_paid_amount NUMERIC,
    p_payment_mode TEXT,        -- 'CASH' or 'UPI'
    p_transaction_ref TEXT,
    p_notes TEXT,
    p_billed_by UUID
)
RETURNS JSONB AS $$
DECLARE
    v_bill_id UUID;
    v_bill_number TEXT;
    v_balance NUMERIC;
    v_payment_status TEXT;
    v_item JSONB;
    v_plant_id UUID;
    v_qty NUMERIC;
    v_unit_price NUMERIC;
    v_item_total NUMERIC;
    v_current_stock NUMERIC;
    v_plant_name TEXT;
    v_payment_num TEXT;
BEGIN
    -- 1. Validate inputs
    IF p_total_amount < 0 OR p_paid_amount < 0 OR p_paid_amount > p_total_amount THEN
        RAISE EXCEPTION 'Invalid payment or total amount';
    END IF;

    v_balance := p_total_amount - p_paid_amount;
    IF v_balance = 0 THEN
        v_payment_status := 'PAID';
    ELSIF p_paid_amount > 0 THEN
        v_payment_status := 'PARTIAL';
    ELSE
        v_payment_status := 'UNPAID';
    END IF;

    -- 2. Generate unique sequential bill number
    v_bill_number := public.generate_bill_number('RETAIL');

    -- 3. Insert bill record
    INSERT INTO public.bills (
        bill_number, bill_type, customer_id, customer_name, customer_phone, place,
        status, subtotal, discount_amount, total_amount, advance_amount,
        paid_amount, balance_amount, payment_status, stock_deducted, notes, billed_by
    ) VALUES (
        v_bill_number, 'RETAIL', p_customer_id, p_customer_name, p_customer_phone, p_place,
        'COMPLETED', p_subtotal, p_discount_amount, p_total_amount, 0.00,
        p_paid_amount, v_balance, v_payment_status, true, p_notes, p_billed_by
    ) RETURNING id INTO v_bill_id;

    -- 4. Process line items & deduct stock atomically with row locks
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_plant_id := (v_item->>'plant_id')::UUID;
        v_qty := (v_item->>'quantity')::NUMERIC;
        v_unit_price := (v_item->>'unit_price')::NUMERIC;
        v_item_total := (v_item->>'total_price')::NUMERIC;

        -- Lock plant row for stock safety
        SELECT name, current_stock INTO v_plant_name, v_current_stock
        FROM public.plants
        WHERE id = v_plant_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Plant with ID % does not exist', v_plant_id;
        END IF;

        IF v_current_stock < v_qty THEN
            RAISE EXCEPTION 'Insufficient stock for plant "%". Available: %, Requested: %', 
                v_plant_name, v_current_stock, v_qty;
        END IF;

        -- Decrement stock
        UPDATE public.plants
        SET current_stock = current_stock - v_qty
        WHERE id = v_plant_id;

        -- Record line item
        INSERT INTO public.bill_items (
            bill_id, plant_id, plant_name, estimated_quantity, actual_quantity,
            unit_price, total_price
        ) VALUES (
            v_bill_id, v_plant_id, v_plant_name, v_qty, v_qty,
            v_unit_price, v_item_total
        );

        -- Record stock movement audit
        INSERT INTO public.stock_movements (
            plant_id, movement_type, quantity, previous_stock, new_stock,
            reference_bill_id, notes, created_by
        ) VALUES (
            v_plant_id, 'RETAIL_SALE', -v_qty, v_current_stock, (v_current_stock - v_qty),
            v_bill_id, 'Retail Sale: ' || v_bill_number, p_billed_by
        );
    END LOOP;

    -- 5. Record payment record if paid_amount > 0
    IF p_paid_amount > 0 THEN
        v_payment_num := 'PAY-' || to_char(now(), 'YYYYMMDD-HH24MISS') || '-' || substr(gen_random_uuid()::text, 1, 4);

        INSERT INTO public.payments (
            payment_number, bill_id, customer_id, amount, payment_type,
            payment_mode, transaction_reference, received_by, notes
        ) VALUES (
            v_payment_num, v_bill_id, p_customer_id, p_paid_amount, 'RETAIL_PAYMENT',
            p_payment_mode, p_transaction_ref, p_billed_by, 'Initial retail payment'
        );
    END IF;

    -- 6. Update customer balance and purchase ledger
    UPDATE public.customers
    SET total_purchases = total_purchases + p_total_amount,
        total_paid = total_paid + p_paid_amount,
        outstanding_balance = outstanding_balance + v_balance
    WHERE id = p_customer_id;

    RETURN jsonb_build_object(
        'success', true,
        'bill_id', v_bill_id,
        'bill_number', v_bill_number,
        'balance_amount', v_balance,
        'payment_status', v_payment_status
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.2 `create_function_order`
Books a function order with estimated quantities and advance payment. **DOES NOT deduct inventory.**

```sql
CREATE OR REPLACE FUNCTION public.create_function_order(
    p_customer_id UUID,
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_place TEXT,
    p_function_date TIMESTAMPTZ,
    p_function_description TEXT,
    p_items JSONB,              -- Array of { plant_id, estimated_quantity, unit_price, total_price }
    p_subtotal NUMERIC,
    p_discount_amount NUMERIC,
    p_total_amount NUMERIC,
    p_advance_amount NUMERIC,
    p_payment_mode TEXT,        -- 'CASH' or 'UPI'
    p_transaction_ref TEXT,
    p_notes TEXT,
    p_billed_by UUID
)
RETURNS JSONB AS $$
DECLARE
    v_bill_id UUID;
    v_bill_number TEXT;
    v_balance NUMERIC;
    v_payment_status TEXT;
    v_item JSONB;
    v_plant_id UUID;
    v_est_qty NUMERIC;
    v_unit_price NUMERIC;
    v_item_total NUMERIC;
    v_plant_name TEXT;
    v_payment_num TEXT;
BEGIN
    v_balance := p_total_amount - p_advance_amount;
    IF v_balance = 0 THEN
        v_payment_status := 'PAID';
    ELSIF p_advance_amount > 0 THEN
        v_payment_status := 'PARTIAL';
    ELSE
        v_payment_status := 'UNPAID';
    END IF;

    v_bill_number := public.generate_bill_number('FUNCTION');

    INSERT INTO public.bills (
        bill_number, bill_type, customer_id, customer_name, customer_phone, place,
        function_date, function_description, status, subtotal, discount_amount,
        total_amount, advance_amount, paid_amount, balance_amount, payment_status,
        stock_deducted, notes, billed_by
    ) VALUES (
        v_bill_number, 'FUNCTION', p_customer_id, p_customer_name, p_customer_phone, p_place,
        p_function_date, p_function_description, 'CONFIRMED', p_subtotal, p_discount_amount,
        p_total_amount, p_advance_amount, p_advance_amount, v_balance, v_payment_status,
        false, p_notes, p_billed_by
    ) RETURNING id INTO v_bill_id;

    -- Store estimated items without deducting stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_plant_id := (v_item->>'plant_id')::UUID;
        v_est_qty := (v_item->>'estimated_quantity')::NUMERIC;
        v_unit_price := (v_item->>'unit_price')::NUMERIC;
        v_item_total := (v_item->>'total_price')::NUMERIC;

        SELECT name INTO v_plant_name FROM public.plants WHERE id = v_plant_id;

        INSERT INTO public.bill_items (
            bill_id, plant_id, plant_name, estimated_quantity, actual_quantity,
            unit_price, total_price
        ) VALUES (
            v_bill_id, v_plant_id, v_plant_name, v_est_qty, 0.00,
            v_unit_price, v_item_total
        );
    END LOOP;

    -- Record advance payment if paid
    IF p_advance_amount > 0 THEN
        v_payment_num := 'ADV-' || to_char(now(), 'YYYYMMDD-HH24MISS') || '-' || substr(gen_random_uuid()::text, 1, 4);

        INSERT INTO public.payments (
            payment_number, bill_id, customer_id, amount, payment_type,
            payment_mode, transaction_reference, received_by, notes
        ) VALUES (
            v_payment_num, v_bill_id, p_customer_id, p_advance_amount, 'ADVANCE',
            p_payment_mode, p_transaction_ref, p_billed_by, 'Booking advance payment'
        );
    END IF;

    -- Update customer ledger
    UPDATE public.customers
    SET total_purchases = total_purchases + p_total_amount,
        total_paid = total_paid + p_advance_amount,
        outstanding_balance = outstanding_balance + v_balance
    WHERE id = p_customer_id;

    RETURN jsonb_build_object(
        'success', true,
        'bill_id', v_bill_id,
        'bill_number', v_bill_number,
        'advance_amount', p_advance_amount,
        'balance_amount', v_balance,
        'status', 'CONFIRMED'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.3 `complete_function_order`
Finalizes a function order with actual delivered quantities, recalculates totals, deducts stock **exactly once**, records settlement payment, and marks order `COMPLETED`.

```sql
CREATE OR REPLACE FUNCTION public.complete_function_order(
    p_bill_id UUID,
    p_actual_items JSONB,       -- Array of { plant_id, actual_quantity, unit_price, total_price }
    p_final_subtotal NUMERIC,
    p_final_discount NUMERIC,
    p_final_total NUMERIC,
    p_final_payment_amount NUMERIC,
    p_payment_mode TEXT,
    p_transaction_ref TEXT,
    p_notes TEXT,
    p_completed_by UUID
)
RETURNS JSONB AS $$
DECLARE
    v_bill RECORD;
    v_item JSONB;
    v_plant_id UUID;
    v_actual_qty NUMERIC;
    v_unit_price NUMERIC;
    v_item_total NUMERIC;
    v_plant_name TEXT;
    v_current_stock NUMERIC;
    v_new_paid NUMERIC;
    v_new_balance NUMERIC;
    v_new_status TEXT;
    v_old_total NUMERIC;
    v_old_paid NUMERIC;
    v_diff_total NUMERIC;
    v_payment_num TEXT;
BEGIN
    -- 1. Fetch and lock the bill
    SELECT * INTO v_bill
    FROM public.bills
    WHERE id = p_bill_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Function bill not found';
    END IF;

    IF v_bill.status = 'COMPLETED' THEN
        RAISE EXCEPTION 'Bill has already been completed and stock deducted';
    END IF;

    IF v_bill.status = 'CANCELLED' THEN
        RAISE EXCEPTION 'Cannot complete a cancelled order';
    END IF;

    IF v_bill.stock_deducted = true THEN
        RAISE EXCEPTION 'Stock has already been deducted for this bill';
    END IF;

    v_old_total := v_bill.total_amount;
    v_old_paid  := v_bill.paid_amount;
    v_new_paid  := v_old_paid + p_final_payment_amount;
    v_new_balance := p_final_total - v_new_paid;

    IF v_new_balance = 0 THEN
        v_new_status := 'PAID';
    ELSIF v_new_paid > 0 THEN
        v_new_status := 'PARTIAL';
    ELSE
        v_new_status := 'UNPAID';
    END IF;

    -- 2. Delete existing estimated items and re-insert actual items
    DELETE FROM public.bill_items WHERE bill_id = p_bill_id;

    -- 3. Insert actual items & deduct stock atomically
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_actual_items)
    LOOP
        v_plant_id := (v_item->>'plant_id')::UUID;
        v_actual_qty := (v_item->>'actual_quantity')::NUMERIC;
        v_unit_price := (v_item->>'unit_price')::NUMERIC;
        v_item_total := (v_item->>'total_price')::NUMERIC;

        SELECT name, current_stock INTO v_plant_name, v_current_stock
        FROM public.plants
        WHERE id = v_plant_id
        FOR UPDATE;

        IF v_current_stock < v_actual_qty THEN
            RAISE EXCEPTION 'Insufficient stock to fulfill function for "%". Stock: %, Required: %',
                v_plant_name, v_current_stock, v_actual_qty;
        END IF;

        -- Decrement stock
        UPDATE public.plants
        SET current_stock = current_stock - v_actual_qty
        WHERE id = v_plant_id;

        -- Insert actual line item
        INSERT INTO public.bill_items (
            bill_id, plant_id, plant_name, estimated_quantity, actual_quantity,
            unit_price, total_price
        ) VALUES (
            p_bill_id, v_plant_id, v_plant_name, v_actual_qty, v_actual_qty,
            v_unit_price, v_item_total
        );

        -- Audit movement
        INSERT INTO public.stock_movements (
            plant_id, movement_type, quantity, previous_stock, new_stock,
            reference_bill_id, notes, created_by
        ) VALUES (
            v_plant_id, 'FUNCTION_FULFILLMENT', -v_actual_qty, v_current_stock, (v_current_stock - v_actual_qty),
            p_bill_id, 'Function Fulfillment: ' || v_bill.bill_number, p_completed_by
        );
    END LOOP;

    -- 4. Record settlement payment if paid > 0
    IF p_final_payment_amount > 0 THEN
        v_payment_num := 'STL-' || to_char(now(), 'YYYYMMDD-HH24MISS') || '-' || substr(gen_random_uuid()::text, 1, 4);

        INSERT INTO public.payments (
            payment_number, bill_id, customer_id, amount, payment_type,
            payment_mode, transaction_reference, received_by, notes
        ) VALUES (
            v_payment_num, p_bill_id, v_bill.customer_id, p_final_payment_amount, 'BALANCE_SETTLEMENT',
            p_payment_mode, p_transaction_ref, p_completed_by, 'Function completion settlement'
        );
    END IF;

    -- 5. Update Bill Record
    UPDATE public.bills
    SET status = 'COMPLETED',
        subtotal = p_final_subtotal,
        discount_amount = p_final_discount,
        total_amount = p_final_total,
        paid_amount = v_new_paid,
        balance_amount = v_new_balance,
        payment_status = v_new_status,
        stock_deducted = true,
        notes = COALESCE(p_notes, notes)
    WHERE id = p_bill_id;

    -- 6. Adjust Customer Ledger
    -- Adjust total_purchases by the variance between estimate and actual
    v_diff_total := p_final_total - v_old_total;
    UPDATE public.customers
    SET total_purchases = total_purchases + v_diff_total,
        total_paid = total_paid + p_final_payment_amount,
        outstanding_balance = outstanding_balance + (v_diff_total - p_final_payment_amount)
    WHERE id = v_bill.customer_id;

    RETURN jsonb_build_object(
        'success', true,
        'bill_id', p_bill_id,
        'final_total', p_final_total,
        'paid_amount', v_new_paid,
        'balance_amount', v_new_balance,
        'status', 'COMPLETED'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.4 `record_balance_payment`
Collects outstanding debt against a bill without touching inventory, preserving individual payment records.

```sql
CREATE OR REPLACE FUNCTION public.record_balance_payment(
    p_bill_id UUID,
    p_amount NUMERIC,
    p_payment_mode TEXT,
    p_transaction_ref TEXT,
    p_notes TEXT,
    p_received_by UUID
)
RETURNS JSONB AS $$
DECLARE
    v_bill RECORD;
    v_new_paid NUMERIC;
    v_new_balance NUMERIC;
    v_new_status TEXT;
    v_payment_num TEXT;
BEGIN
    SELECT * INTO v_bill
    FROM public.bills
    WHERE id = p_bill_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bill not found';
    END IF;

    IF v_bill.balance_amount <= 0 THEN
        RAISE EXCEPTION 'Bill has no outstanding balance';
    END IF;

    IF p_amount <= 0 OR p_amount > v_bill.balance_amount THEN
        RAISE EXCEPTION 'Invalid payment amount. Outstanding balance is %', v_bill.balance_amount;
    END IF;

    v_new_paid := v_bill.paid_amount + p_amount;
    v_new_balance := v_bill.total_amount - v_new_paid;

    IF v_new_balance = 0 THEN
        v_new_status := 'PAID';
    ELSE
        v_new_status := 'PARTIAL';
    END IF;

    -- 1. Insert payment record
    v_payment_num := 'BAL-' || to_char(now(), 'YYYYMMDD-HH24MISS') || '-' || substr(gen_random_uuid()::text, 1, 4);

    INSERT INTO public.payments (
        payment_number, bill_id, customer_id, amount, payment_type,
        payment_mode, transaction_reference, received_by, notes
    ) VALUES (
        v_payment_num, p_bill_id, v_bill.customer_id, p_amount, 'BALANCE_SETTLEMENT',
        p_payment_mode, p_transaction_ref, p_received_by, p_notes
    );

    -- 2. Update Bill
    UPDATE public.bills
    SET paid_amount = v_new_paid,
        balance_amount = v_new_balance,
        payment_status = v_new_status
    WHERE id = p_bill_id;

    -- 3. Update Customer Balance
    UPDATE public.customers
    SET total_paid = total_paid + p_amount,
        outstanding_balance = outstanding_balance - p_amount
    WHERE id = v_bill.customer_id;

    RETURN jsonb_build_object(
        'success', true,
        'payment_number', v_payment_num,
        'paid_amount', v_new_paid,
        'balance_amount', v_new_balance,
        'payment_status', v_new_status
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 5. Row Level Security (RLS) Policies

All tables have RLS enabled.

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is active staff/admin
CREATE OR REPLACE FUNCTION public.is_authenticated_staff()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_active = true
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check if current user is active admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin' AND is_active = true
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles: Authenticated staff can read; Admins can update/insert
CREATE POLICY "Active staff can read profiles" ON public.profiles FOR SELECT USING (public.is_authenticated_staff());
CREATE POLICY "Admins can manage profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- Business Settings: Read by staff; Managed by Admin
CREATE POLICY "Active staff can view settings" ON public.business_settings FOR SELECT USING (public.is_authenticated_staff());
CREATE POLICY "Admins can update settings" ON public.business_settings FOR UPDATE USING (public.is_admin());

-- Customers: Read/Write by active staff
CREATE POLICY "Staff can view customers" ON public.customers FOR SELECT USING (public.is_authenticated_staff());
CREATE POLICY "Staff can insert/update customers" ON public.customers FOR ALL USING (public.is_authenticated_staff());

-- Plants: Read/Write by active staff
CREATE POLICY "Staff can view plants" ON public.plants FOR SELECT USING (public.is_authenticated_staff());
CREATE POLICY "Staff can insert/update plants" ON public.plants FOR ALL USING (public.is_authenticated_staff());

-- Bills: Read/Insert by staff; Updates controlled or Admin
CREATE POLICY "Staff can view bills" ON public.bills FOR SELECT USING (public.is_authenticated_staff());
CREATE POLICY "Staff can insert bills" ON public.bills FOR INSERT WITH CHECK (public.is_authenticated_staff());
CREATE POLICY "Admins can update/cancel bills" ON public.bills FOR UPDATE USING (public.is_admin());

-- Bill Items: Read/Insert by staff
CREATE POLICY "Staff can view bill items" ON public.bill_items FOR SELECT USING (public.is_authenticated_staff());
CREATE POLICY "Staff can insert bill items" ON public.bill_items FOR INSERT WITH CHECK (public.is_authenticated_staff());

-- Payments: Append-only for staff; No deletes allowed
CREATE POLICY "Staff can view payments" ON public.payments FOR SELECT USING (public.is_authenticated_staff());
CREATE POLICY "Staff can insert payments" ON public.payments FOR INSERT WITH CHECK (public.is_authenticated_staff());

-- Stock Movements: Append-only ledger; Never editable
CREATE POLICY "Staff can view stock movements" ON public.stock_movements FOR SELECT USING (public.is_authenticated_staff());
CREATE POLICY "Staff can insert stock movements" ON public.stock_movements FOR INSERT WITH CHECK (public.is_authenticated_staff());
```
