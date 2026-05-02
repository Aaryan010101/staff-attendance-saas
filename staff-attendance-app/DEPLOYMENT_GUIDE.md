# Deployment & Production Readiness Guide

This document outlines the essential steps to prepare and deploy the "Staff Attendance & Salary Calculator" SaaS application to production.

## 1. Environment Variables Configuration

Before deploying, ensure all required environment variables are set up. Create a `.env.local` based on the `.env.example` in the root directory. You will need similar variables set via Vercel dashboard.

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... # Update to Live Key for prod
CLERK_SECRET_KEY=sk_test_...                 # Update to Live Key for prod
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase (Database & Storage)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...              # Keep this secret! Never use NEXT_PUBLIC_ on this

# Razorpay Subscriptions
RAZORPAY_KEY_ID=rzp_test_...                  # Update to Live Key for prod
RAZORPAY_KEY_SECRET=your_secret_...
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Resend Emails (if used in Phase 3)
RESEND_API_KEY=re_...
```

## 2. Supabase Setup

### Creating Tables and Rows-Level Security (RLS)

1. Navigate to the **SQL Editor** in your Supabase dashboard.
2. Run the full database schema outlined in Phase 1 (businesses, staff, attendance, advances, salary_records).
3. Ensure **Row-Level Security (RLS)** is properly enabled on all tables so that a business owner only query data associated with their own `owner_id`. 
   *Example RLS Policy for businesses table:*
   ```sql
   create policy "Enable select for users based on owner_id"
   on "public"."businesses"
   as PERMISSIVE
   for ALL
   to public
   using ( (auth.uid()::text = owner_id) )
   with check ( (auth.uid()::text = owner_id) );
   ```
4. Verify you have created the storage buckets used for document upload (e.g., `brand` for business logos, `slips` for salary PDF slips) and their corresponding RLS storage policies.

## 3. Clerk Authentication Configuration

1. In the Clerk Dashboard, create a new application or configure the existing one.
2. Ensure you have **Email/Password** and **Google** enabled as Social Connections under *User & Authentication -> Social Connections*.
3. Go to the **API Keys** section to grab your Publishable & Secret Keys. Ensure the "Live" toggle is turned on before launching to users.
4. If setting up custom branding, navigate to *Customization -> Branding* in Clerk and configure the app’s logo, colors, and font stack.

## 4. Razorpay Configuration

1. Go to the Razorpay Dashboard. Toggle to "Live Mode" for production usage.
2. In Settings -> API Keys, generate your Live environment `Key ID` and `Key Secret`.
3. In *Webhooks*, create a new Webhook targeting your production Vercel URL: `https://your-domain.com/api/webhooks/razorpay`.
   - Setup Webhook Secrets: Make sure this exactly matches what you provide to `RAZORPAY_WEBHOOK_SECRET` in `.env`.
   - Subscribe to required subscription and payment events:
     - `subscription.activated`
     - `subscription.cancelled`
     - `payment.captured`
     - `payment.failed`
4. Set up Free (0 INR), Basic (599 INR/mo) and Pro (1299 INR/mo) subscription plans within Razorpay dashboard under *Subscriptions -> Plans* and grab the corresponding `plan_id`s to map into your Next.js application codebase.

## 5. Vercel Deployment

1. Make sure your local codebase builds without issue by running `npm run build` locally.
2. Push your final code base to a Git repository like GitHub, GitLab, or Bitbucket.
3. Open the **Vercel Dashboard**. Click "Add New" -> "Project" and select your repository.
4. Expand the **Environment Variables** section from the configuration options. Do not skip this step!
5. Paste the entire content of your production environment variables.
6. Click **Deploy**. Vercel will initiate building.
7. Upon successful build, navigate to *Settings -> Domains* to configure your custom top-level domain if desired.

## 6. Testing Production Flow

Once deployed, manually perform the following functional verifications on the live instance:

- **Create a New Account:** Verify Clerk sign-up flow, email inbox check, or Google SSO.
- **Onboarding:** Input a business name, check Supabase to confirm the `businesses` row is successfully created.
- **Add Staff:** Verify the 5-staff limit logic handles correctly in a Free plan. Check if Staff avatars & info appear accurately.
- **Attendance Marking:** Input attendance for today, review dashboard statistics update.
- **Calculate Salaries:** Ensure mathematical precision of formulas to standard payroll structures.
- **Generate Slip/PDF:** Check the speed/format of `@react-pdf/renderer` rendering, confirm it downloads or opens successfully in a new tab.

## Final Note
Monitor errors using Vercel application logs during the first few weeks of production to catch unexpected tenant-specific quirks or data-shape edge cases.
