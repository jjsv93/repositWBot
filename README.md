# Loan OS

A modern loan origination system for private lenders, built with Next.js, Prisma, and PostgreSQL.

## Quick Start

### Prerequisites

- **Node.js** 18+
- **PostgreSQL** running locally (or use Docker below)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up the database

Copy the example env file and update the database URL if needed:

```bash
cp .env.example .env
```

Default `.env`:
```
DATABASE_URL="postgresql://YOUR_USER@localhost:5432/loanos?schema=public"
```

> **No Postgres?** Use Docker:
> ```bash
> docker run -d --name loanos-db -e POSTGRES_DB=loanos -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:16
> ```
> Then set: `DATABASE_URL="postgresql://postgres:password@localhost:5432/loanos?schema=public"`

Create the database and tables:

```bash
npx prisma db push
```

### 3. Seed demo data

```bash
npx prisma db seed
```

This creates 4 demo users — **all with password `password123`**:

| Email | Role | Name |
|-------|------|------|
| `admin@loanos.com` | Admin | Admin User |
| `sarah@capitallending.com` | Broker | Sarah Chen |
| `john@email.com` | Borrower | John Smith |
| `emma@processing.com` | Processor | Emma Wilson |

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with any of the accounts above.

## Troubleshooting

### "Invalid credentials" or can't log in
The seed data lives in your **local PostgreSQL database**, not in the repo. You must run `npx prisma db push` and `npx prisma db seed` after cloning.

### Database connection errors
Make sure PostgreSQL is running and the `DATABASE_URL` in `.env` matches your setup. Common fixes:
- Mac (Homebrew): `brew services start postgresql@16`
- Docker: `docker start loanos-db`
- Check your Postgres username: `whoami` (macOS uses your system username by default)

### Reset everything
```bash
npx prisma db push --force-reset
npx prisma db seed
```

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js with credentials provider
- **UI:** Tailwind CSS
