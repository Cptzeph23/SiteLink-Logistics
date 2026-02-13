# SiteLink Logistics — Complete File Map
# Every file in the project with its EXACT folder destination
# Root = ~/Desktop/Programs/NodeJS/sitelink-logistics/

==============================================================
📁 ROOT LEVEL (directly inside sitelink-logistics/)
==============================================================
middleware.ts              → sitelink-logistics/middleware.ts
tailwind.config.ts         → sitelink-logistics/tailwind.config.ts

==============================================================
📁 app/
==============================================================
app/globals.css            → app/globals.css
app/layout.tsx             → app/layout.tsx
app/page.tsx               → app/page.tsx

  📁 app/login/
  app/login/page.tsx       → app/login/page.tsx

  📁 app/register/
  app/register/page.tsx    → app/register/page.tsx

  📁 app/test-materials/
  app/test-materials/page.tsx → app/test-materials/page.tsx

  📁 app/api/
    📁 app/api/materials/
    app/api/materials/route.ts → app/api/materials/route.ts

    📁 app/api/pricing/
      📁 app/api/pricing/calculate/
      app/api/pricing/calculate/route.ts → app/api/pricing/calculate/route.ts

    📁 app/api/jobs/
    app/api/jobs/route.ts  → app/api/jobs/route.ts

      📁 app/api/jobs/[id]/
      app/api/jobs/[id]/route.ts → app/api/jobs/[id]/route.ts

      📁 app/api/jobs/available/
      app/api/jobs/available/route.ts → app/api/jobs/available/route.ts

    📁 app/api/tracking/
    app/api/tracking/route.ts → app/api/tracking/route.ts

  📁 app/client/
    📁 app/client/dashboard/
    app/client/dashboard/page.tsx → app/client/dashboard/page.tsx

    📁 app/client/bookings/
    app/client/bookings/page.tsx → app/client/bookings/page.tsx

      📁 app/client/bookings/new/
      app/client/bookings/new/page.tsx → app/client/bookings/new/page.tsx

      📁 app/client/bookings/[id]/
      app/client/bookings/[id]/page.tsx → app/client/bookings/[id]/page.tsx

  📁 app/driver/
    📁 app/driver/dashboard/
    app/driver/dashboard/page.tsx → app/driver/dashboard/page.tsx

    📁 app/driver/jobs/
      📁 app/driver/jobs/[id]/
      app/driver/jobs/[id]/page.tsx → app/driver/jobs/[id]/page.tsx

==============================================================
📁 components/
==============================================================

  📁 components/ui/          ← created automatically by shadcn
  (button.tsx, card.tsx, input.tsx, label.tsx,
   select.tsx, badge.tsx, textarea.tsx, checkbox.tsx)

  📁 components/shared/
  components/shared/Navbar.tsx          → components/shared/Navbar.tsx
  components/shared/LoadingSpinner.tsx  → components/shared/LoadingSpinner.tsx
  components/shared/LiveTrackingMap.tsx → components/shared/LiveTrackingMap.tsx

  📁 components/client/
  components/client/MaterialSelector.tsx → components/client/MaterialSelector.tsx
  components/client/PriceBreakdown.tsx   → components/client/PriceBreakdown.tsx

  📁 components/driver/
  components/driver/JobCard.tsx → components/driver/JobCard.tsx

==============================================================
📁 lib/
==============================================================

  📁 lib/supabase/
  lib/supabase/client.ts → lib/supabase/client.ts
  lib/supabase/server.ts → lib/supabase/server.ts

  📁 lib/services/
  lib/services/auth.service.ts → lib/services/auth.service.ts

  📁 lib/hooks/
  lib/hooks/useAuth.tsx → lib/hooks/useAuth.tsx

  📁 lib/utils/
  lib/utils/cn.ts          → lib/utils/cn.ts
  lib/utils/constants.ts   → lib/utils/constants.ts
  lib/utils/formatters.ts  → lib/utils/formatters.ts
  lib/utils/index.ts       → lib/utils/index.ts
  lib/utils/validation.ts  → lib/utils/validation.ts

==============================================================
📁 types/
==============================================================
types/index.ts → types/index.ts

==============================================================
📁 supabase/
==============================================================
  📁 supabase/migrations/
  supabase/migrations/20240101000000_initial_schema.sql
  supabase/migrations/20240101000001_rls_policies.sql
  supabase/migrations/20240101000002_seed_materials.sql

==============================================================
VISUAL TREE (complete)
==============================================================

sitelink-logistics/
├── middleware.ts
├── tailwind.config.ts
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   ├── test-materials/
│   │   └── page.tsx
│   ├── api/
│   │   ├── materials/
│   │   │   └── route.ts
│   │   ├── pricing/
│   │   │   └── calculate/
│   │   │       └── route.ts
│   │   ├── jobs/
│   │   │   ├── route.ts
│   │   │   ├── [id]/
│   │   │   │   └── route.ts
│   │   │   └── available/
│   │   │       └── route.ts
│   │   └── tracking/
│   │       └── route.ts
│   ├── client/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   └── bookings/
│   │       ├── page.tsx
│   │       ├── new/
│   │       │   └── page.tsx
│   │       └── [id]/
│   │           └── page.tsx
│   └── driver/
│       ├── dashboard/
│       │   └── page.tsx
│       └── jobs/
│           └── [id]/
│               └── page.tsx
├── components/
│   ├── ui/               ← shadcn auto-generated
│   ├── shared/
│   │   ├── Navbar.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── LiveTrackingMap.tsx
│   ├── client/
│   │   ├── MaterialSelector.tsx
│   │   └── PriceBreakdown.tsx
│   └── driver/
│       └── JobCard.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── services/
│   │   └── auth.service.ts
│   ├── hooks/
│   │   └── useAuth.tsx
│   └── utils/
│       ├── cn.ts
│       ├── constants.ts
│       ├── formatters.ts
│       ├── index.ts
│       └── validation.ts
├── types/
│   └── index.ts
└── supabase/
    └── migrations/
        ├── 20240101000000_initial_schema.sql
        ├── 20240101000001_rls_policies.sql
        └── 20240101000002_seed_materials.sql