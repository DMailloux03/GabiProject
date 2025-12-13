This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## PocketBase integration

The exit ticket form persists submissions to PocketBase. To run it locally:

1. Start your PocketBase instance (`./pocketbase serve` from the repo root).
2. Create a collection named `exitTickets` with fields that match:
   - `mode` (text)
   - `name` (text)
   - `partnerNames` (text, optional)
   - `understanding` (number)
   - `partnerUnderstanding` (number, optional)
   - `exitTicketResponse` (text)
   - `lingeringQuestions` (text, optional)
3. Add a `.env.local` file in `my-app/` that contains the PocketBase URL the app should use:

```
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
```

### Teacher dashboard

Visit `/teacher` to access the teacher portal. It authenticates using your PocketBase `users` collection, so sign in with a teacher/admin account. Once authenticated you can refresh and review the exit ticket table, complete with timestamps and partner info.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
