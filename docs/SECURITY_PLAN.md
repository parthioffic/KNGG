# Security Plan, Access Control & Data Protection: Kalaiselvi Nursery Garden (KNG)

This document establishes the security architecture, threat model, permission matrices, key management rules, and transaction safety controls for Kalaiselvi Nursery Garden.

---

## 1. Threat Model & Risk Assessment

| Threat Vector | Risk Description | Architectural Mitigation |
| :--- | :--- | :--- |
| **Direct API Tampering** | Malicious client bypassing frontend UI to update bill totals, delete payments, or grant unauthorized discounts. | PostgreSQL Row Level Security (RLS) prevents direct client `UPDATE` or `DELETE` on financial tables (`payments`, `bills`, `stock_movements`). |
| **Race Conditions in Billing** | Two staff members billing the last 10 pots of a plant simultaneously, leading to negative stock. | PostgreSQL stored procedures execute with `FOR UPDATE` row-level locks on the `plants` table. The second transaction waits or safely aborts if stock is insufficient. |
| **Bill Sequence Collision** | Concurrent bill creations generating duplicate invoice numbers. | `business_settings` sequence counters are locked with `FOR UPDATE` during number generation inside atomic RPC transactions. |
| **Payment History Tampering** | Former staff modifying or overwriting past cash collections to conceal discrepancies. | The `payments` table is **append-only**. RLS strictly denies `UPDATE` and `DELETE` queries on `payments`. |
| **Service Role Key Exposure** | Hardcoding Supabase `service_role` key in frontend environment variables, exposing administrative bypass. | Vite environment only injects `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The `service_role` key is strictly kept in secure backend environments and never built into client bundles. |
| **XSS & Injection Attacks** | Malicious strings entered in customer names, notes, or plant varieties. | React DOM automatically escapes rendered variables; Zod schemas validate and sanitize all form payloads before submission; PostgreSQL queries are strictly parameterized. |

---

## 2. Role-Based Access Control (RBAC) Matrix

The system implements two distinct roles defined in `profiles.role`:
- **Admin**: Nursery owner / managing partners. Full visibility into margins, settings, employee accounts, and audit overrides.
- **Staff**: Counter billing staff and garden supervisors. Permitted to bill, check stock, collect payments, and view customer directories.

| Resource / Action | Staff Role | Admin Role | Enforced At |
| :--- | :---: | :---: | :--- |
| **Authenticate & Login** | Allowed | Allowed | Supabase Auth |
| **View Dashboard Basic Metrics** | Allowed | Allowed | React UI & RPC |
| **View Profit / Margin Analytics** | Denied | Allowed | React Route Guard & DB RPC |
| **Create Retail Bills** | Allowed | Allowed | DB RPC `create_retail_bill` |
| **Book Function Orders** | Allowed | Allowed | DB RPC `create_function_order` |
| **Complete Function Orders** | Allowed | Allowed | DB RPC `complete_function_order` |
| **Cancel / Void Existing Bills** | Denied | Allowed | DB RLS on `bills` |
| **Collect Balance & Issue Receipts** | Allowed | Allowed | DB RPC `record_balance_payment` |
| **View Customer Directory** | Allowed | Allowed | DB RLS on `customers` |
| **Create / Edit Customer Info** | Allowed | Allowed | DB RLS on `customers` |
| **View Plant Inventory** | Allowed | Allowed | DB RLS on `plants` |
| **Perform Stock IN (Intake)** | Allowed | Allowed | DB RPC / RLS `stock_movements` |
| **Perform Stock Adjustment (Discrepancy)** | Denied | Allowed | DB RLS on `plants` & RPC |
| **Create / Edit Plants** | Denied | Allowed | DB RLS on `plants` |
| **Manage Staff Accounts & Roles** | Denied | Allowed | DB RLS on `profiles` |
| **Modify Business Settings & Logo** | Denied | Allowed | DB RLS on `business_settings` |
| **Export Financial CSV Reports** | Denied | Allowed | React Component Guard |

---

## 3. Row Level Security (RLS) Implementation Details

### 3.1 Security Definer Functions
All multi-table transactional workflows (`create_retail_bill`, `create_function_order`, `complete_function_order`, `record_balance_payment`) are defined as `SECURITY DEFINER` procedures with `SET search_path = public`.
- Inside these functions, explicit authentication checks verify that `auth.uid()` corresponds to an active profile (`is_active = true`).
- Client applications cannot directly write raw records into `stock_movements` or manipulate `bills.paid_amount` without going through these verified procedures.

### 3.2 Append-Only Financial Logs
```sql
-- Explicit denial of payment modification or deletion
CREATE POLICY "No payment updates" ON public.payments FOR UPDATE USING (false);
CREATE POLICY "No payment deletes" ON public.payments FOR DELETE USING (false);

-- Explicit denial of stock movement tampering
CREATE POLICY "No stock movement updates" ON public.stock_movements FOR UPDATE USING (false);
CREATE POLICY "No stock movement deletes" ON public.stock_movements FOR DELETE USING (false);
```

---

## 4. Input Validation & Data Sanitization Pipeline

Form inputs are validated using **Zod** schemas on the client before network transmission, and re-verified by **PostgreSQL Check Constraints** on the server.

### 4.1 Zod Validation Schema Example (Retail Bill)
```typescript
import { z } from 'zod';

export const retailBillItemSchema = z.object({
  plant_id: z.string().uuid(),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit_price: z.number().min(0, 'Unit price cannot be negative'),
  total_price: z.number().min(0, 'Total price cannot be negative'),
});

export const retailBillSubmissionSchema = z.object({
  customer_id: z.string().uuid(),
  customer_name: z.string().min(2, 'Customer name is required'),
  customer_phone: z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number'),
  place: z.string().min(2, 'Place / town is required'),
  items: z.array(retailBillItemSchema).min(1, 'At least one plant must be added'),
  subtotal: z.number().min(0),
  discount_amount: z.number().min(0),
  total_amount: z.number().min(0),
  paid_amount: z.number().min(0),
  payment_mode: z.enum(['CASH', 'UPI']),
  transaction_ref: z.string().optional(),
  notes: z.string().max(500).optional(),
}).refine(data => data.paid_amount <= data.total_amount, {
  message: 'Paid amount cannot exceed total bill amount',
  path: ['paid_amount'],
});
```

---

## 5. Storage Security & Asset Access

- **Bucket Name**: `business-assets`
- **Visibility**: Public read for nursery logo and plant thumbnails; restricted write permissions.
- **Write Policy**:
  ```sql
  CREATE POLICY "Admins can upload nursery logo" 
  ON storage.objects FOR INSERT 
  TO authenticated 
  WITH CHECK (
      bucket_id = 'business-assets' AND 
      public.is_admin()
  );
  ```
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`.
- **Max file size**: 2 MB.

---

## 6. Backup, Auditability & Disaster Recovery

1. **Daily Automated Snapshots**: Managed automatically by Supabase Point-in-Time Recovery (PITR) / daily backups.
2. **Immutable Audit Trails**: Every stock alteration references `stock_movements.created_by` and `stock_movements.reference_bill_id`. Every rupee received references `payments.received_by`.
3. **Data Portability**: Admin dashboard includes an on-demand "Export All Data (CSV)" function allowing weekly local offline archiving of customer ledgers, inventory balances, and sales journals.
