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

## Supabase integration

Exit tickets are saved to Supabase and the teacher dashboard reads from the same project.

1. [Create a Supabase project](https://supabase.com/dashboard/projects) and note the project URL and anon key.
2. Create a table named `exit_tickets` with the following schema (all nullable except `mode`, `student_name`, `understanding`, `exit_ticket_response`):
   - `mode` (text)
   - `student_name` (text)
   - `partner_names` (text)
   - `understanding` (numeric)
   - `partner_understanding` (numeric)
   - `exit_ticket_response` (text)
   - `lingering_questions` (text)
   - `created_at` (timestamp with time zone, default `now()`)
3. Enable Row Level Security on `exit_tickets` and add policies:
   - allow `insert` for the `anon` role (students submitting the form)
   - allow `select` for the `authenticated` role (teachers signed in through Supabase Auth)
4. In Supabase Auth, create teacher accounts that should be able to review tickets.
5. Create `my-app/.env` (or `.env.local`) with:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Teacher dashboard

Visit `/teacher` and sign in with a Supabase Auth email/password. The dashboard lets you pick a day and review every exit ticket submitted on that date.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
