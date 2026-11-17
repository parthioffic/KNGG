# Quality Assurance & Testing Plan: Kalaiselvi Nursery Garden (KNG)

This document establishes the testing strategy, test suites, edge cases, and automated validation procedures required to guarantee the reliability, financial accuracy, and data integrity of the Kalaiselvi Nursery Garden system.

---

## 1. Testing Strategy Matrix

| Testing Level | Scope | Tools | Success Threshold |
| :--- | :--- | :--- | :--- |
| **Unit Testing** | Calculations, Formatters, Validation schemas | Vitest / Jest | 100% pass on Zod schemas, WhatsApp URI formatting, and bill total math. |
| **Database RPC Testing** | Atomic transactions, Constraints, Stock triggers | Supabase SQL / pgTAP | 100% pass on negative stock checks, sequence uniqueness, and payment audit logs. |
| **Integration Testing** | API service layer, Auth lifecycle, Component workflows | React Testing Library | Full verification of cart state, balance calculations, and form submissions. |
| **End-to-End (E2E)** | Complete critical business paths | Playwright / Cypress | Retail checkout, Function lifecycle, Balance collection, and PDF generation. |

---

## 2. Critical Business Test Cases

### Test Case 1: Negative Stock Prevention
- **Objective**: Verify that the database strictly forbids reducing a plant's inventory below 0.
- **Preconditions**: Plant "Malli (Jasmine)" has `current_stock = 5.00`.
- **Execution**:
  1. Staff attempts to submit a retail bill requesting 6 pots.
  2. RPC `create_retail_bill` executes.
- **Expected Result**:
  - The PostgreSQL check constraint `current_stock >= 0` or the RPC stock validation aborts the transaction with an explicit exception: `"Insufficient stock for plant 'Malli (Jasmine)'. Available: 5.00, Requested: 6.00"`.
  - Zero rows are inserted into `bills`, `bill_items`, or `stock_movements`.
  - The UI displays a clear red error banner and keeps the cart intact.

---

### Test Case 2: Atomic Retail Billing & Immediate Stock Decrement
- **Objective**: Verify that bill creation, line items, stock movement, inventory deduction, and customer ledger updates succeed or fail as a single atomic unit.
- **Preconditions**: Customer Murugan has `outstanding_balance = 0.00`. Plant Rose has `current_stock = 50.00`.
- **Execution**:
  1. Create retail bill for 10 Rose plants at ₹50.00 each (Total: ₹500.00).
  2. Customer pays ₹300.00 via UPI (Balance: ₹200.00).
- **Expected Result**:
  - `bills` table contains new record with `total_amount = 500.00`, `paid_amount = 300.00`, `balance_amount = 200.00`, `payment_status = 'PARTIAL'`, and `stock_deducted = true`.
  - `plants.current_stock` decreases from `50.00` to `40.00`.
  - `stock_movements` table contains a new row with `movement_type = 'RETAIL_SALE'`, `quantity = -10.00`, `previous_stock = 50.00`, and `new_stock = 40.00`.
  - `payments` table contains a new row with `amount = 300.00`, `payment_type = 'RETAIL_PAYMENT'`, and `payment_mode = 'UPI'`.
  - Customer Murugan's `total_purchases` becomes `500.00`, `total_paid` becomes `300.00`, and `outstanding_balance` becomes `200.00`.

---

### Test Case 3: Deferred Stock Deduction for Function Orders
- **Objective**: Verify that booking a function order does **NOT** decrement inventory, and post-event completion deducts stock **exactly once**.
- **Preconditions**: Plant "Teak Sapling" has `current_stock = 200.00`.
- **Phase A (Booking)**:
  1. Book function order for 100 Teak Saplings scheduled for 10 days in the future.
  2. Customer pays ₹1,000 advance.
  - *Validation*:
    - Bill created with `bill_type = 'FUNCTION'`, `status = 'CONFIRMED'`, and `stock_deducted = false`.
    - **`plants.current_stock` remains exactly 200.00.**
    - `stock_movements` contains **NO** fulfillment entries.
    - Advance payment of ₹1,000 is logged in `payments`.
- **Phase B (Completion)**:
  1. Function concludes. Actual delivered count is finalized at 90 saplings.
  2. Staff completes the order and settles the remaining balance.
  - *Validation*:
    - `complete_function_order` RPC updates `bill_items.actual_quantity = 90.00`.
    - `bills.status` transitions to `'COMPLETED'` and `bills.stock_deducted` becomes `true`.
    - `plants.current_stock` decreases from `200.00` to `110.00` (deducting exactly 90).
    - `stock_movements` logs `movement_type = 'FUNCTION_FULFILLMENT'` with `quantity = -90.00`.
- **Phase C (Duplicate Completion Attempt)**:
  1. Staff attempts to submit completion again on the same bill.
  - *Validation*:
    - RPC throws an exception: `"Stock has already been deducted for this bill"`.
    - No secondary deduction occurs.

---

### Test Case 4: Multiple Payment Tracking (Never Overwrite History)
- **Objective**: Verify that subsequent balance collections add new audit rows rather than mutating past payments.
- **Preconditions**: Bill has `total_amount = 1000.00`, with initial payment of `400.00`.
- **Execution**:
  1. Customer visits 5 days later and pays ₹300.00 in cash.
  2. Customer visits 10 days later and pays the final ₹300.00 via UPI.
- **Expected Result**:
  - `payments` table contains **3 distinct rows**:
    - Row 1: `amount = 400.00`, `payment_type = 'RETAIL_PAYMENT'`.
    - Row 2: `amount = 300.00`, `payment_type = 'BALANCE_SETTLEMENT'`, `mode = 'CASH'`.
    - Row 3: `amount = 300.00`, `payment_type = 'BALANCE_SETTLEMENT'`, `mode = 'UPI'`.
  - Sum of payments equals exactly ₹1,000.00.
  - Bill `paid_amount = 1000.00`, `balance_amount = 0.00`, and `payment_status = 'PAID'`.

---

### Test Case 5: Concurrent Bill Number Sequence Generation
- **Objective**: Verify that two simultaneous checkout submissions produce distinct sequential numbers without collisions.
- **Execution**:
  1. Fire two parallel asynchronous requests to `generate_bill_number('RETAIL')`.
- **Expected Result**:
  - The `FOR UPDATE` lock on `business_settings` forces serial execution.
  - Request A receives e.g. `KNG-RET-2026-00001`.
  - Request B receives e.g. `KNG-RET-2026-00002`.
  - No duplicate key violations occur.

---

### Test Case 6: Bill Cancellation & Stock Restoration
- **Objective**: Verify that cancelling a retail bill safely returns deducted stock to inventory.
- **Preconditions**: Plant "Bougainvillea" has `current_stock = 15.00`. Bill `KNG-RET-2026-00050` previously deducted 5 pots (reducing stock to 10.00).
- **Execution**:
  1. Admin cancels `KNG-RET-2026-00050` with reason: `"Customer returned order immediately"`.
- **Expected Result**:
  - `plants.current_stock` is restored from `10.00` to `15.00`.
  - `stock_movements` logs `movement_type = 'BILL_CANCELLATION'` with `quantity = +5.00`.
  - Bill `status` becomes `'CANCELLED'`.
  - Customer outstanding balance is adjusted.

---

### Test Case 7: Tamil Text Rendering in Invoices & Receipts
- **Objective**: Verify that Tamil characters and ligatures render cleanly in printed bills and PDFs.
- **Execution**:
  1. Generate bill containing Tamil plant name: `மல்லிகை (Jasmine)` and footer: `கலைச்செல்வி நர்சரி கார்டன்`.
  2. Render PDF using `jsPDF` + `html2canvas` and trigger Print preview.
- **Expected Result**:
  - All Tamil compound letters (`ல்`, `வி`, `செ`, `ரி`, `த்`) render with proper vowel signs.
  - No boxes, question marks, or broken text appear.

---

### Test Case 8: WhatsApp Deep Link Formatting
- **Objective**: Verify that the generated WhatsApp URL contains all required fields in the exact specified business format.
- **Execution**:
  1. Call `generateWhatsAppBillUrl` with test payload.
- **Expected Result**:
  - URI starts with `https://wa.me/919488782488?text=...`.
  - Decoded text contains:
    - `🌱 *KALAISELVI NURSERY GARDEN*`
    - `📍 Mailam Road, Kutteripattu – 604304`
    - `👤 *Customer Name:* ...`
    - `🌿 *Order Details*`
    - `💰 *Payment Details*`
    - `🧾 *Billed By:* ...`
    - `🙏 *Thank you for choosing Kalaiselvi Nursery Garden!* 🌱`

---

### Test Case 9: Role-Based Access Control (RBAC) Enforcement
- **Objective**: Verify that staff users cannot perform administrative actions.
- **Execution**:
  1. Log in with a profile having `role = 'staff'`.
  2. Attempt to call plant deletion, manual stock adjustment without purchase, or staff user modification.
- **Expected Result**:
  - The UI hides administrative controls (no delete or edit settings buttons).
  - Direct Supabase REST queries return HTTP 403 / RLS policy violation.
