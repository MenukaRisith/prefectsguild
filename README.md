# Kekirawa Central College Prefects Guild

Professional, minimalist prefect management built with Next.js, Prisma, and MySQL.

## Features

- Prefect self-registration with local profile-picture storage
- Pending verification flow before full dashboard access
- Role-based dashboards for prefects, teachers, admins, and super admins
- QR pass generation with printable PDF output
- Web-based school attendance scanner
- Duty assignment for classes and named locations
- Tasks, calendar events, reminders, announcements, and audit logs
- CSV attendance export and cron-friendly job endpoints

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma ORM
- MySQL

## Environment

Create a local `.env` from `.env.example`.

Important values:

- `DATABASE_URL`
- `AUTH_SECRET`
- `QR_SECRET`
- `CRON_SECRET`
- `SMTP_*`
- `SEED_SUPER_ADMIN_*`

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Generate Prisma client:

```bash
npm run db:generate
```

3. Push the schema to MySQL:

```bash
npm run db:push
```

4. Seed the first super admin if needed:

```bash
npm run db:seed
```

5. Start development:

```bash
npm run dev
```

## Cron endpoints

Use the bearer token `CRON_SECRET`.

- `POST /api/jobs/daily-audit`
- `POST /api/jobs/reminders`

## Upload storage

Runtime uploads are stored in the local `storage/` directory and are ignored by git.

## Attendance export

Staff roles can download attendance CSV from:

- `GET /api/reports/attendance`
