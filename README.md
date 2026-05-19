# Mini Lead Distribution System

A simple Next.js + MongoDB lead distribution app for the assignment.

## What it does

- Public lead form at `/request-service`
- Automatically assigns each lead to exactly 3 providers
- Uses persistent round-robin allocation for fair distribution
- Enforces duplicate lead rule at the database level
- Shows provider data on `/dashboard`
- Pushes dashboard updates in real time with Socket.IO
- Includes `/test-tools` for webhook and concurrency testing

## Seeded Data

- 3 services: Service 1, Service 2, Service 3
- 8 providers
- Monthly quota: 10 per provider

## Setup

1. Make sure MongoDB is running.
2. Copy `.env.example` to `.env.local` if needed.
3. Start the app:

```bash
npm install
npm run dev
```

4. Seed the database:

```bash
curl -X POST http://localhost:3000/api/init
```

## Routes

- `/request-service` - customer lead form
- `/dashboard` - provider dashboard
- `/test-tools` - webhook and concurrency tester

## Important Notes

- Duplicate lead protection uses a unique index on `phoneNumber + serviceType`.
- Round-robin allocation state is stored in MongoDB, so it survives restarts.
- Webhook idempotency is handled by a unique `eventId` log.
- The local MongoDB setup uses `retryWrites=false` for standalone compatibility.

## Implementation Summary

- Allocation algorithm: mandatory providers first, then round-robin from the remaining pool.
- Concurrency handling: MongoDB transactions when available, with standalone fallback for local MongoDB.
- Webhook idempotency: one log entry per `eventId`, so repeated webhook calls do not repeat the reset.
