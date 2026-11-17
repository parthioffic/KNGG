-- ============================================================================
-- KALAISELVI NURSERY GARDEN (KNG) - SUPABASE POSTGRESQL SCHEMA & RPCs
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. BUSINESS_SETTINGS
CREATE TABLE IF NOT EXISTS public.business_settings (
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

CREATE UNIQUE INDEX IF NOT EXISTS business_settings_singleton_idx ON public.business_settings ((true));

-- 3. CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
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

CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers (phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers (name);

-- 4. PLANTS
CREATE TABLE IF NOT EXISTS public.plants (
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

-- 5. BILLS
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_number TEXT NOT NULL UNIQUE,
    bill_type TEXT NOT NULL CHECK (bill_type IN ('RETAIL', 'FUNCTION')),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    place TEXT NOT NULL,
    function_date TIMESTAMPTZ,
    function_description TEXT,
    status TEXT NOT NULL CHECK (status IN ('OPEN', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    advance_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (advance_amount >= 0),
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    balance_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (balance_amount >= 0),
    payment_status TEXT NOT NULL CHECK (payment_status IN ('UNPAID', 'PARTIAL', 'PAID')),
    stock_deducted BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    billed_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. BILL_ITEMS
CREATE TABLE IF NOT EXISTS public.bill_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    plant_id UUID NOT NULL REFERENCES public.plants(id) ON DELETE RESTRICT,
    plant_name TEXT NOT NULL,
    estimated_quantity NUMERIC(10, 2) NOT NULL CHECK (estimated_quantity >= 0),
    actual_quantity NUMERIC(10, 2) NOT NULL CHECK (actual_quantity >= 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    total_price NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
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

-- 8. STOCK_MOVEMENTS
CREATE TABLE IF NOT EXISTS public.stock_movements (
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
    quantity NUMERIC(10, 2) NOT NULL,
    previous_stock NUMERIC(10, 2) NOT NULL CHECK (previous_stock >= 0),
    new_stock NUMERIC(10, 2) NOT NULL CHECK (new_stock >= 0),
    reference_bill_id UUID REFERENCES public.bills(id),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FUNCTIONS & RPCs
CREATE OR REPLACE FUNCTION public.generate_bill_number(p_bill_type TEXT)
RETURNS TEXT AS $$
DECLARE
    v_prefix TEXT;
    v_seq INTEGER;
    v_year TEXT;
    v_bill_number TEXT;
BEGIN
    v_year := to_char(now(), 'YYYY');

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
