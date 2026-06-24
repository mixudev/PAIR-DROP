# PairDrop

**PairDrop** is a modern real-time platform for syncing and sharing files, links, text, and clipboard content across devices. Built with Next.js 15, Supabase, and a production-ready feature-based architecture.

![PairDrop](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-green?style=flat-square&logo=supabase)

## Features

- **Pair Mode** — QR code one-time pairing between desktop and mobile without login
- **Room Mode** — Create/join shared rooms with codes like `PAIR-4827`
- **File Sharing** — Drag & drop upload with progress, preview, download
- **Clipboard Sync** — Instant text/code sync with history (max 50 items)
- **Notes Sync** — Collaborative markdown notes with autosave
- **Real-time** — Supabase Realtime channels (no separate WebSocket server)
- **Dark/Light Mode** — Dark default, follows system preference with manual toggle
- **Responsive** — Optimized for desktop, tablet, and mobile

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 App Router |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| UI | Shadcn/UI + Radix UI |
| Animation | Framer Motion |
| Database | Supabase PostgreSQL |
| Realtime | Supabase Realtime |
| Storage | Supabase Storage |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Deployment | Vercel |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── modules/                # Feature modules (domain-driven)
│   ├── pair-session/
│   ├── rooms/
│   ├── files/
│   ├── clipboard/
│   ├── notes/
│   ├── settings/
│   └── dashboard/
├── components/             # Shared UI components
│   ├── ui/                 # Shadcn/UI primitives
│   ├── forms/
│   ├── layouts/
│   └── shared/
├── services/               # Business logic layer
├── repositories/           # Data access layer (Supabase)
├── hooks/                  # Custom React hooks
├── actions/                # Next.js Server Actions
├── providers/              # React context providers
├── stores/                 # Zustand global state
├── types/                  # TypeScript type definitions
├── lib/                    # Utilities & Supabase clients
├── config/                 # Environment configuration
└── constants/              # App constants
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account ([supabase.com](https://supabase.com))

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd pairdrop
npm install
```

### 2. Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_STORAGE_BUCKET=pairdrop-files
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Supabase Setup

#### Create Project
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Copy **Project URL**, **anon key**, and **service_role key** to `.env.local`

#### Run Database Migration
1. Open **SQL Editor** in Supabase Dashboard
2. Run `supabase/migrations/001_initial_schema.sql`
3. Run `supabase/migrations/002_storage_bucket.sql`
4. (Optional) Run `supabase/seed.sql` for demo data

#### Enable Realtime
In Supabase Dashboard → **Database** → **Replication**, ensure these tables are enabled for Realtime:
- `rooms`, `room_members`, `files`, `messages`, `clipboard_items`, `notes`, `activity_logs`, `pair_sessions`

#### Storage Bucket
The migration creates the `pairdrop-files` bucket. Verify in **Storage** → **Buckets** that it exists with a 50MB file size limit.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial PairDrop setup"
git push origin main
```

### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Add all environment variables from `.env.example`
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel domain (e.g. `https://pairdrop.vercel.app`)
5. Deploy

### 3. Update Supabase

Add your Vercel domain to Supabase **Authentication** → **URL Configuration** → **Site URL** (if using auth in the future).

## Usage Guide

### Pair Mode
1. Open PairDrop on desktop → **Create Pair Session**
2. Scan the QR code with your phone
3. Both devices connect to a private room instantly

### Room Mode
1. **Create Room** → set name, visibility, expiry
2. Share the room code (e.g. `PAIR-4827`) with others
3. Others join via **Join Room** page or QR scan

### Workspace
Once in a room, use the sidebar:
- **Files** — Upload via drag & drop or browse
- **Links** — Share URLs instantly
- **Clipboard** — Send/paste/copy text across devices
- **Notes** — Collaborative markdown notes
- **Members** — View connected devices & activity
- **Settings** — Room code, device name

## Security

- Pair sessions expire after 30 minutes (configurable)
- Rooms support 1h, 24h, or never expiry
- Row Level Security (RLS) on all tables
- Server Actions use service role with access token validation
- File upload size limits via environment variables
- Input sanitization on all user content
- One-time QR tokens for pairing

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | — |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | — |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) | — |
| `NEXT_PUBLIC_STORAGE_BUCKET` | Storage bucket name | `pairdrop-files` |
| `NEXT_PUBLIC_APP_URL` | App public URL | `http://localhost:3000` |
| `PAIR_SESSION_EXPIRY_MINUTES` | Pair session TTL | `30` |
| `MAX_FILE_SIZE_MB` | Max upload size | `50` |
| `CLIPBOARD_HISTORY_LIMIT` | Max clipboard items per room | `50` |
| `NOTES_AUTOSAVE_INTERVAL_MS` | Notes autosave interval | `3000` |

## Troubleshooting

### Realtime not working
- Verify tables are added to `supabase_realtime` publication
- Check Supabase Dashboard → Database → Replication
- Ensure RLS SELECT policies exist

### File upload fails
- Verify storage bucket exists and policies are applied
- Check `MAX_FILE_SIZE_MB` and bucket file size limit match
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set

### "Not a member of this room"
- Re-join the room to get a new access token
- Clear localStorage and join again

### Camera/QR scanner not working
- Ensure HTTPS in production (required for camera access)
- Allow camera permissions in browser settings
- Use manual room code entry as fallback

### Build fails on Vercel
- Add all environment variables in Vercel project settings
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (not prefixed with `NEXT_PUBLIC_`)

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## License

MIT
