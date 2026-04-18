# Tash Lashes & Eyebrows

Mobile-first, bilingual booking web app for a beauty business built with Next.js 14.

## Stack

- Next.js 14 (App Router)
- Tailwind CSS + Framer Motion
- `next-intl` for Hebrew (default, RTL) and English (LTR)
- `lucide-react` icons
- Resend email notifications
- Prisma + PostgreSQL persistence

## Environment Variables

Copy `.env.example` to `.env.local` and fill values:

```bash
cp .env.example .env.local
```

- `RESEND_API_KEY`: your API key from Resend dashboard
- `NOTIFICATION_EMAIL`: Natasha's receiving email
- `ADMIN_PHONE_NUMBER`: used to build WhatsApp quick-chat link (`972...` format)
- `ADMIN_PASSWORD`: admin login password
- `ADMIN_SESSION_SECRET`: random secret for secure cookie signing
- `DATABASE_URL`: PostgreSQL connection string (recommended for Vercel/Supabase/Neon)

## Run Locally

```bash
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). App redirects to `/he`.

## Main Flows

- Client booking flow (4 steps): service/time -> details -> health declaration -> submit
- Slot becomes `pending` immediately after booking submission
- Notification email is sent with booking details + health summary + WhatsApp link
- Booking and slot state are stored in PostgreSQL for persistence
- Admin:
  - Login
  - Open slots by service type
  - View pending requests

## Deployment

Deploy on [Vercel](https://vercel.com/new). Add the same environment variables in project settings.

For production DB migrations, run:

```bash
npm run db:deploy
```
