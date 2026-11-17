# Kalaiselvi Nursery Garden (கலைச்செல்வி நர்சரி கார்டன்)
### Single Business Nursery POS, Inventory, Function Orders & Balance Management System

---

## 📍 Business Overview

- **Business Name**: Kalaiselvi Nursery Garden (கலைச்செல்வி நர்சரி கார்டன்)
- **Address**: Mailam Road, Kutteripattu, Tindivanam Taluk, Villupuram, Tamil Nadu 604304
- **Phone Numbers**: `+91 9488782488` / `+91 8531859560` / `+91 8637406716`
- **Currency**: Indian Rupee (INR / ₹)
- **Customer Bill Language**: Tamil (தமிழ்)
- **Application Language**: English with Tamil subtitles

---

## 🚀 Key Modules & Capabilities

1. **Dashboard**: Today's Sales, Today's Collections (Cash vs UPI split), Total Pending Receivables, Plant Stock, Low Stock Alerts, and Upcoming Function Orders.
2. **Retail Billing Counter**: Fast counter checkout, search by plant/category, quick-add customer, line-item quantity controls, instant atomic stock deduction, printable 80mm thermal/standard bill, and 1-tap WhatsApp sharing.
3. **Function & Event Orders**:
   - Booking with customer details, function date, and estimated plants.
   - Advance payment logging.
   - **Zero stock deduction on booking**.
   - Post-event reconciliation (entering actual quantities delivered/returned).
   - Atomic single stock deduction upon order completion.
4. **Plant Inventory**: Catalog with English & Tamil names, selling prices, real-time stock levels, low-stock alerts, Stock IN intake, and Admin Stock Adjustments with immutable audit history.
5. **Customer Master & Ledger**: Phone number lookup, order history, payment history, and live outstanding debt tracking.
6. **Payments & Collections**: Multi-payment tracking per bill (advances, counter payments, balance settlements), Cash/UPI channels, and printable payment receipts.
7. **Reports & Analytics**: Gross invoiced sales vs actual collections, retail vs function sales breakdown, plant sales velocity, and CSV export for Excel.
8. **Settings & Staff**: Official address, bill prefix sequence configuration (`KNG-RET`, `KNG-FNC`), and Staff account management with Admin / Staff roles.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui primitives, Lucide React
- **Data & State**: TanStack Query, React Context, LocalStorage persistence with Supabase PostgreSQL client
- **Database Backend**: PostgreSQL 15+ on Supabase (RLS policies, triggers, and atomic RPC functions)
- **Invoicing & Documents**: jsPDF, html2canvas, Google Noto Sans Tamil, and native `@media print` thermal 80mm layouts
- **Messaging**: Deep-linked WhatsApp URL (`https://wa.me/91...`) with pre-formatted bilingual customer bills

---

## 🏁 Quick Start Guide

### 1. Prerequisites
- Node.js `v18+` or `v20+` or `v26+`
- npm

### 2. Install Dependencies
```bash
npm install
# Note: On Windows PowerShell with script execution restrictions, use:
npm.cmd install
```

### 3. Run Development Server
```bash
npm.cmd run dev
```
Open `http://localhost:3000` in your web browser.

### 4. Build for Production
```bash
npm.cmd run build
```
The compiled output is located in `dist/`.

---

## 🔑 Registered Staff Accounts

| Profile Name | Mobile Number | Role | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **Viswanathan R** | `9488782488` | **Admin** | Full system control: stock adjustments, settings, staff management, financial reports. |
| **Sridhar V** | `8531859560` | **Staff** | Counter checkout, function order booking, balance collections, customer search. |
| **Parthiban V** | `8637406716` | **Staff** | Counter checkout, function order booking, balance collections. |
| **Janaki V** | `8637406716` | **Staff** | Counter checkout, function order booking, balance collections. |

---

## 📚 Architectural Documentation

All design blueprints and specifications are documented in [`docs/`](./docs/):

- [`docs/PROJECT_OVERVIEW.md`](./docs/PROJECT_OVERVIEW.md) — Scope, problem statement, business profile
- [`docs/SYSTEM_ARCHITECTURE.md`](./docs/SYSTEM_ARCHITECTURE.md) — Frontend & backend topology, directory structure
- [`docs/DATABASE_SCHEMA.md`](./docs/DATABASE_SCHEMA.md) — Complete PostgreSQL DDL, check constraints, RLS policies, RPCs
- [`docs/DATABASE_ERD.md`](./docs/DATABASE_ERD.md) — Entity-Relationship Diagram and data dictionary
- [`docs/UI_UX_SPECIFICATION.md`](./docs/UI_UX_SPECIFICATION.md) — Design system, Forest Green theme, screen specifications
- [`docs/BUSINESS_WORKFLOWS.md`](./docs/BUSINESS_WORKFLOWS.md) — Retail POS, Function lifecycle, WhatsApp reference format
- [`docs/SECURITY_PLAN.md`](./docs/SECURITY_PLAN.md) — RBAC matrix, threat model, row-locking transaction safety
- [`docs/IMPLEMENTATION_ROADMAP.md`](./docs/IMPLEMENTATION_ROADMAP.md) — Milestone breakdown and tasks
- [`docs/TESTING_PLAN.md`](./docs/TESTING_PLAN.md) — QA test suites and critical domain test cases

---

## 🗄️ Supabase Deployment (Optional Live Cloud DB)

1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL migration file in your Supabase SQL Editor:
   ```
   supabase/migrations/20261116000000_initial_schema.sql
   ```
3. Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://xyzcompany.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
