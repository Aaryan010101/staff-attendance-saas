# Staff Attendance & Salary Calculator SaaS

A complete mobile-first SaaS web application for small Indian businesses to manage staff attendance, advances, and calculate salaries. Built with Next.js 14, Tailwind CSS, Supabase, and Clerk.

## Features

- **Mobile-First Dashboard:** Quick overview of daily attendance, payroll estimates, and pending payments.
- **Staff Management:** Add, edit, and deactivate staff with monthly or daily wages.
- **Daily Attendance Marking:** Fast attendance marking (Present, Absent, Half Day) with bulk options.
- **Salary Engine:** Automatic salary calculation handling half-days, holidays, and advance deductions.
- **Advances Tracking:** Record staff advances and auto-deduct them from specific monthly salaries.
- **PDF Salary Slips:** Generate professional salary slips and share via WhatsApp in one click.
- **Excel Exports:** Download monthly attendance reports.

## Prerequisites

- Node.js 18.x or later
- [Clerk](https://clerk.com) account (for Auth)
- [Supabase](https://supabase.com) account (Database & Storage)
- [Razorpay](https://razorpay.com) account (for Subscriptions)
- [Vercel](https://vercel.com) account (for Hosting)

## Setup Guide

### 1. Environment Variables

1. Copy the `.env.example` file to create a `.env.local` file:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in the values in `.env.local` based on your project keys from Clerk, Supabase, and Razorpay.

### 2. Clerk Configuration (Authentication)

1. Create a new Clerk application.
2. Select **Email address** and **Google** as the signup methods.
3. Copy your Publishable and Secret keys to `.env.local`.
4. Go to **Paths** in your Clerk settings and ensure the standard routing matches the app's setup.

### 3. Supabase Configuration (Database & Storage)

1. Create a new Supabase project.
2. Get your `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from Settings > API.

#### Running Database Migrations (SQL Editor)

Run the following SQL in your Supabase SQL Editor to create tables, storage, and Row-Level Security (RLS) policies:

```sql
-- 1. Create Tables
CREATE TABLE businesses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  logo_url TEXT,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE staff (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT,
  salary_type TEXT,
  monthly_salary NUMERIC,
  daily_wage NUMERIC,
  joining_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL,
  note TEXT,
  UNIQUE(staff_id, date)
);

CREATE TABLE advances (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  given_date DATE NOT NULL,
  month_to_deduct TEXT,
  is_deducted BOOLEAN DEFAULT false
);

CREATE TABLE salary_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  total_days INTEGER,
  present_days NUMERIC,
  base_salary NUMERIC,
  advance_deduction NUMERIC,
  overtime_amount NUMERIC DEFAULT 0,
  bonus NUMERIC DEFAULT 0,
  final_salary NUMERIC NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  paid_date DATE,
  slip_url TEXT,
  UNIQUE(staff_id, month)
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_records ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Note: Clerk `user_id` needs to be securely passed or checked via API routes using the service role, 
-- or by passing a custom JWT to Supabase. Assuming backend routes use Supabase Admin Client for bypass.
-- If querying from client, implement custom JWT integrations.
```

*(Note: Since this app uses `supabaseAdmin` (Service Role Key) heavily on the server via Server Actions and Route Handlers, RLS rules can be bypassed for server-side logic as long as you verify the `owner_id` against Clerk's `userId` manually. If client side querying is needed, ensure Clerk custom JWTs are mapped).*

#### Storage Configuration

1. Go to **Storage** and create a new public bucket named `logos`.
2. Create a public bucket named `slips`.
3. Add a bucket policy to allow public reads.

### 4. Razorpay Configuration (Payments)

1. Create subscription plans in Razorpay matching the app (`free`, `basic`, `pro`).
2. Add your keys to `.env.local`.
3. Set up a Webhook in the Razorpay Dashboard pointing to `https://your-domain.com/api/webhooks/razorpay`.
4. Listen to events: `payment.captured`, `payment.failed`, `subscription.activated`, `subscription.cancelled`.
5. Add the Webhook secret to `.env.local`.

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Vercel Deployment

1. Push your code to a private GitHub repository.
2. In Vercel, click **Add New Project** and import the repository.
3. In the Configuration screen, add all the environment variables from your `.env.local`.
4. Click **Deploy**.
5. Once deployed, take the production URL and update your Clerk and Razorpay redirect/webhook URLs.

## Tech Stack Overview

- **Framework:** Next.js 14 App Router
- **Database:** Supabase (PostgreSQL)
- **Auth:** Clerk
- **Styles:** Tailwind CSS
- **Icons:** Lucide React
- **PDF Generation:** @react-pdf/renderer
- **State/Form:** React intrinsic state
- **File Storage:** Supabase Storage
