# Passenger Management System (PMS) — Admin Portal

Production-ready, single-page Passenger Management System built with Next.js App Router, TypeScript, Tailwind CSS, Lucide React, and Neon Serverless PostgreSQL with Prisma ORM.

---

## Features

- **Single-Page Admin Dashboard**: Unified workspace with summary metrics, live search, full modal forms, details view, and delete confirmation.
- **Dynamic Database Metrics**: Real-time aggregation of Total Bookings, Total Passengers served, Active Bookings, and Total Weekly Active Days calculated directly from Neon PostgreSQL.
- **Complete Booking Management**:
  - Total passenger group count (represents the group size, not individual rows).
  - Pickup location & Drop-off location.
  - Budget in Pakistani Rupees (PKR) with formatted currency display.
  - Optional admin notes/remarks.
- **7-Day Weekly Schedule Management**:
  - Independent status configuration (`ACTIVE` vs `OFF`) for all 7 days (Monday through Sunday).
  - Pickup and drop-off time selectors.
  - **"Use Same Timings" Bulk Shortcut**: Configure default pickup and drop-off times and selectively apply them to chosen days with one click without silently overwriting unselected days.
  - **"Copy Monday's Schedule"**: Instant one-click shortcut to replicate Monday's timings to weekdays.
  - Disabled and cleared timing representations for `OFF` days to prevent misleading active schedules.
- **CSV Export & Backup**:
  - Real-time UTF-8 CSV export with Excel-compatible BOM.
  - Detailed columns for booking attributes and day-by-day status, pickup time, and drop-off time.
  - OWASP formula injection protection (`=`, `+`, `-`, `@` sanitization).
  - Filter-aware export (exports filtered records when searching).
- **Admin Access Control & Security**:
  - Server-side authentication and session cookies.
  - Server-side Zod validation on all mutations.
  - Atomic Prisma transactions to ensure consistent state between bookings and weekly schedules.
  - Neon credentials strictly isolated on the server.

---

## Getting Started

### 1. Prerequisites
- Node.js 18.x, 20.x, or 22.x
- A Neon Serverless PostgreSQL Database ([neon.tech](https://neon.tech))

### 2. Environment Variables Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Update `.env` with your actual Neon PostgreSQL connection strings:
```env
# Neon Serverless connection pooler URL (for serverless queries)
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Neon Direct connection URL (for Prisma migrations)
DIRECT_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-sample.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Admin Authentication Password
ADMIN_PASSWORD="your_admin_secret_password"
AUTH_SECRET="a_secure_random_string_for_sessions"
```

> **Note**: If `ADMIN_PASSWORD` is left unset in `.env`, the system defaults to open admin mode for local testing. Setting `ADMIN_PASSWORD` activates the secure admin sign-in modal.

### 3. Database Migration
To apply the database schema to your Neon PostgreSQL database:
```bash
# Push schema directly or run Prisma migrate:
npx prisma db push
# Or for migrations:
npm run db:migrate
```

### 4. Running Locally
Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Vercel Deployment Instructions

1. **Push Code to GitHub**:
   Ensure `.env` is **not** committed (`.gitignore` excludes all `.env*` files).

2. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new) and select your GitHub repository.
   - Framework Preset: **Next.js**.

3. **Configure Environment Variables in Vercel Dashboard**:
   Add the following under **Project Settings > Environment Variables**:
   - `DATABASE_URL`: Your Neon Pooled connection string.
   - `DIRECT_URL`: Your Neon Direct connection string.
   - `ADMIN_PASSWORD`: Your chosen administrative password.
   - `AUTH_SECRET`: A long random secret string.

4. **Production Database Migrations**:
   Run database migrations against production Neon before or during deploy:
   ```bash
   npx prisma migrate deploy
   ```
   The `package.json` includes:
   - `"postinstall": "prisma generate"` ensuring the Prisma Client engine matches Vercel's serverless runtime.
   - `"db:deploy": "prisma migrate deploy"` for CI/CD pipelines.

5. **Deploy**:
   Click **Deploy**. Vercel will build the application using Turbopack and deploy the serverless edge/lambda handlers.
