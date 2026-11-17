# Project Overview: Kalaiselvi Nursery Garden (KNG) Business Management System

## 1. Executive Summary

**Kalaiselvi Nursery Garden (KNG)** is a premier retail and wholesale plant nursery located in Kutteripattu, Villupuram District, Tamil Nadu. The nursery caters to walk-in retail customers, home gardeners, landscapers, and bulk function/event orders (such as weddings, temple festivals, corporate gatherings, and community events).

Currently, nursery operations rely on manual record-keeping, paper slips, and informal payment tracking. This leads to common business challenges:
- Difficulty tracking customer credit balances and pending receivables.
- Discrepancies between estimated plants booked for an event and actual plants delivered/returned.
- Accidental stock miscalculations.
- Inability to quickly share professional receipts with customers via WhatsApp in their native language (Tamil).
- Lack of daily and monthly revenue visibility.

This project delivers a specialized, responsive, web-based business management system designed specifically for a single nursery business. It emphasizes simplicity, rapid billing, mobile-friendly usability for nursery staff on the ground, bilingual clarity (English UI + Tamil customer bills), and strict transaction integrity for inventory and payments.

---

## 2. Business Profile & Reference Data

| Attribute | Details |
| :--- | :--- |
| **Business Name (English)** | Kalaiselvi Nursery Garden |
| **Business Name (Tamil)** | கலைச்செல்வி நர்சரி கார்டன் |
| **Street Address** | Mailam Road, Kutteripattu |
| **Postal Details** | Tindivanam Taluk, Villupuram District, Tamil Nadu – 604304 |
| **Primary Contact Numbers** | `+91 9488782488`, `+91 8531859560`, `+91 8637406716` |
| **Operating Currency** | Indian Rupee (INR / ₹) |
| **Customer Bill Language** | Tamil (கலைச்செல்வி நர்சரி கார்டன் - தமிழ் ரசீது) |
| **Application UI Language** | English (with bilingual Tamil subtitles on key fields) |
| **Operating Model** | Single Business, Multi-Staff (Admin & Staff roles) |

---

## 3. Problem Statement & Key Challenges

1. **Dual Billing Nature**:
   - **Retail Sales**: High volume, fast counter checkout. Plant inventory must be deducted instantly upon payment.
   - **Function Orders**: Advance booking weeks or days before an event. At booking, plant quantities and rates are *estimates*. Plants cannot be deducted from stock at booking because seedlings and potted plants remain in the nursery until the event day. After the event, plants returned or unused must be accounted for, and actual numbers billed.
2. **Payment Tracking Disconnect**:
   - Customers frequently pay a partial amount or booking advance via UPI/Cash, and settle the remainder weeks later.
   - Traditional systems overwrite invoice payment records, erasing historical audit trails of who collected what and when.
3. **Language & Usability on Ground**:
   - Nursery helpers and staff operate predominantly on Android mobile phones or basic tablets under sunlight.
   - Bills sent to customers must be in clear Tamil and easily shareable on WhatsApp with one click.
4. **Data Isolation & Cost Efficiency**:
   - The business does not require expensive ERP software, SaaS monthly seat fees, or complex enterprise abstractions. It needs a lightweight, reliable, zero-maintenance web application.

---

## 4. Application Scope

### In Scope
- **Dashboard**: Real-time sales, collections, pending dues, stock levels, low-stock alerts, upcoming functions.
- **Retail Billing**: Quick search, instant cart calculation, discount, cash/UPI payment, instant stock decrement, PDF invoice, direct WhatsApp sharing.
- **Function Order Management**: Lifecycle (`OPEN` → `CONFIRMED` → `COMPLETED` / `CANCELLED`), estimated vs. actual quantities, advance tracking, final stock settlement on completion.
- **Customer Directory**: Centralized ledger, phone search, order history, lifetime spend, real-time outstanding balance.
- **Plant Inventory**: Catalog with English & Tamil names, categorization, selling rates, current stock, low stock thresholds, Stock IN, adjustments, immutable movement ledger.
- **Payments & Receipts**: Multi-payment tracking per bill, advance receipts, balance collection dialog, cash/UPI breakdown.
- **Reports & Analytics**: Daily/Monthly summaries, retail vs. function breakdown, cash vs. UPI collection, pending receivables aging, plant sales velocity, CSV/PDF exports.
- **Business Settings**: Store address, phone numbers, bill numbering sequence, logo upload, staff accounts with role-based access.

### Explicitly Out of Scope
- Multi-tenancy or SaaS subscription management.
- Supplier/vendor purchase order lifecycles and accounts payable (simplified Stock IN suffices).
- Complex payroll, HR, and employee timesheets.
- Direct payment gateway API integration (Razorpay/Stripe); payments are collected via physical Cash or merchant UPI QR and logged manually.
- E-commerce customer-facing store (this is an internal Point-of-Sale & Management tool).

---

## 5. Technology Stack

| Layer | Selected Technology | Justification |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 / 19 with Vite | Fast build times, lightweight bundle, rapid dev cycle. |
| **Language** | TypeScript | Strong typing across bill models, inventory, and payment schemas prevents runtime errors. |
| **Styling** | Tailwind CSS | Utility-first, responsive mobile design, consistent design tokens. |
| **UI Components** | shadcn/ui (Radix Primitives) | Accessible, customizable, high-performance headless components without heavy library lock-in. |
| **Icons** | Lucide React | Clean, tree-shakeable icons for nursery items, payments, and navigation. |
| **State & Data Fetching**| TanStack Query (React Query) | Server-state caching, automatic revalidation, optimistic updates, query invalidation. |
| **Backend & DB** | Supabase (PostgreSQL 15+) | Managed Postgres, Row Level Security (RLS), atomic stored procedures (RPC), instant REST API. |
| **Authentication** | Supabase Auth | Secure session management, password-based staff logins, role claims in JWT/profiles. |
| **File Storage** | Supabase Storage | Secure bucket for nursery logo, plant reference images, and bill receipts. |
| **PDF Generation** | jsPDF + html2canvas | Client-side generation of lightweight, printable Tamil receipts without external PDF rendering servers. |
| **Messaging** | WhatsApp Deep Linking | Direct `https://wa.me/{phone}?text={encoded}` integration requiring zero external API subscription. |

---

## 6. Existing Project Audit & Environment

An inspection of the workspace was conducted on November 16, 2026:
- **Repository Path**: `C:\Users\Parthi\Documents\KNGG`
- **Current State**: Fresh, clean directory. No conflicting files or legacy code exist.
- **Runtime Environment**: Node.js `v26.13.1`, npm `11.20.0`.
- **Operating System**: Windows with PowerShell environment.
- **Execution Strategy**: Modern Vite + React + TypeScript application with full architectural documentation created prior to code scaffolding.
