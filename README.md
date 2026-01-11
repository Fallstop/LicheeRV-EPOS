# FlatOS - Shared Flat Finances

A modern web application for managing shared household expenses, tracking flatmate payments, and maintaining transparency in shared living arrangements.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)
![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?logo=sqlite)

## Features

- 🏦 **Bank Account Integration** - Syncs transactions via [Akahu](https://akahu.nz) (NZ Open Banking)
- 👥 **Flatmate Management** - Add flatmates and associate their bank accounts
- 📊 **Payment Tracking** - Automatically match payments to flatmates with smart detection
- 📅 **Flexible Payment Schedules** - Configure historical and future weekly payment amounts
- 💰 **Balance Calculations** - See who owes what, with weekly breakdowns
- 🔐 **Secure Authentication** - Google OAuth with email whitelist
- 📱 **Responsive Design** - Works great on desktop and mobile
- 🌙 **Dark Mode** - Easy on the eyes

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Google OAuth credentials
- Akahu personal app credentials

### Development

```bash
# Clone and install
git clone <repo-url>
cd web-service
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Initialize database
pnpm db:push

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to access the app.

### Production (Docker)

```bash
# Build and run with Docker Compose
docker compose up -d

# Or build manually
docker build -t flatos .
docker run -d \
  -p 3000:3000 \
  -v ./data:/app/data \
  --env-file .env \
  flatos
```

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `AKAHU_API_KEY` | Your Akahu user token |
| `AKAHU_APP_TOKEN` | Your Akahu app token |
| `AKAHU_ACCOUNT_ID` | The shared bank account ID to track |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `AUTH_SECRET` | NextAuth secret (`openssl rand -base64 32`) |
| `ADMIN_USER` | Admin email address (always allowed to sign in) |
| `SQLITE_DB_PATH` | Path to SQLite database file |
| `CRON_SECRET` | Secret for authenticating cron job requests |

### Setting Up Akahu

1. Create a personal app at [my.akahu.io](https://my.akahu.io)
2. Connect your bank account
3. Copy the user token, app token, and account ID to your `.env`

### Setting Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google` (and your production URL)
4. Copy client ID and secret to your `.env`

## Usage

### Admin Setup

1. Sign in with the admin email configured in `ADMIN_USER`
2. Go to **Flatmates** → Add flatmates (name, email, bank account number)
3. Go to **Payment Schedule** → Configure weekly payment amounts per flatmate
4. Set the **Analysis Start Date** in Settings

### For Flatmates

1. Request the admin to add your email to the whitelist
2. Sign in with Google
3. View your payment balance and transaction history

### Automatic Transaction Sync

Set up a cron job to sync transactions every 2 hours:

```bash
# Using curl
0 */2 * * * curl -X POST "https://your-domain.com/api/cron/sync" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: SQLite with Drizzle ORM
- **Auth**: NextAuth.js v5 with Google OAuth
- **Styling**: Tailwind CSS 4
- **Banking API**: Akahu
- **Container**: Docker with Alpine Node

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── (dashboard)/  # Protected dashboard routes
│   ├── api/          # API routes
│   └── auth/         # Auth pages
├── components/       # React components
├── lib/              # Utilities & business logic
│   ├── db/           # Database schema & connection
│   ├── calculations.ts  # Balance calculations
│   ├── matching.ts   # Transaction matching
│   └── sync.ts       # Akahu sync logic
└── types/            # TypeScript definitions
```

## License

Private - For personal use only.
