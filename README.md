# SiteLink Logistics

**Tagline:** Linking materials to sites

A construction-focused logistics platform for transporting heavy materials using 1.5-2 tonne Light Commercial Vehicles.

## 🚀 Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL + PostGIS)
- **Real-time:** Supabase Realtime
- **Maps:** Google Maps APIs
- **Payments:** M-Pesa (Daraja API)
- **Storage:** Cloudinary (images/documents)

## 📁 Project Structure

```
sitelink-logistics/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── jobs/            # Job management
│   │   ├── pricing/         # Dynamic pricing engine
│   │   ├── materials/       # Material catalog
│   │   ├── tracking/        # GPS tracking
│   │   └── payments/        # M-Pesa integration
│   ├── (auth)/              # Auth pages (login, register)
│   ├── client/              # Client dashboard
│   ├── driver/              # Driver app
│   └── admin/               # Admin dashboard
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── client/              # Client-specific components
│   ├── driver/              # Driver-specific components
│   ├── admin/               # Admin-specific components
│   └── shared/              # Shared components
├── lib/                     # Utility functions & services
│   ├── supabase/            # Supabase client & helpers
│   ├── utils/               # Helper functions
│   ├── hooks/               # Custom React hooks
│   └── services/            # Business logic services
├── types/                   # TypeScript type definitions
├── public/                  # Static assets
└── supabase/                # Supabase migrations & config
```

## 🏗️ Getting Started

### Prerequisites
- Node.js 18.17 or higher
- npm or yarn
- Git

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.local.example` to `.env.local` and fill in your credentials
4. Run development server: `npm run dev`
5. Open http://localhost:3000

## 🗄️ Database Setup

See `supabase/migrations/` for database schema.

## 📝 License

Proprietary - All rights reserved