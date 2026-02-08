# SiteLink Logistics - System Architecture

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Web App (Next.js)          Mobile App (Future - React Native)  │
│  ├── Client Dashboard       ├── Client App                      │
│  ├── Driver Dashboard       ├── Driver App                      │
│  └── Admin Dashboard        └── Admin App                       │
└────────────┬────────────────────────────────────┬───────────────┘
             │                                    │
             │          API REQUESTS              │
             │                                    │
┌────────────▼────────────────────────────────────▼───────────────┐
│                    APPLICATION LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                    Next.js API Routes                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Auth Service │  │Pricing Engine│  │ Job Manager  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Tracking   │  │   Payments   │  │ Notifications│         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────┬────────────────────────────────────┬───────────────┘
             │                                    │
             │      DATABASE QUERIES              │
             │      REAL-TIME SUBSCRIPTIONS       │
             │                                    │
┌────────────▼────────────────────────────────────▼───────────────┐
│                      DATA LAYER                                  │
├─────────────────────────────────────────────────────────────────┤
│                    Supabase PostgreSQL                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Tables: users, jobs, vehicles, materials, tracking, etc │  │
│  │  Extensions: PostGIS (geospatial), uuid-ossp             │  │
│  │  Features: Row-Level Security, Real-time Subscriptions   │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────┬────────────────────────────────────┬───────────────┘
             │                                    │
┌────────────▼────────────────────────────────────▼───────────────┐
│                   EXTERNAL SERVICES                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Google Maps  │  │    M-Pesa    │  │  Cloudinary  │         │
│  │   - Distance │  │  - Payments  │  │  - Images    │         │
│  │   - Routing  │  │  - Callbacks │  │  - Documents │         │
│  │   - Geocoding│  └──────────────┘  └──────────────┘         │
│  └──────────────┘                                               │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │Africa's Talk.│  │    Sentry    │                            │
│  │  - SMS       │  │  - Logging   │                            │
│  │  - Voice     │  │  - Monitoring│                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Core Workflows

### **1. Client Booking Flow**

```
Client Opens App
      ↓
Selects Materials → System calculates weight
      ↓
Enters Pickup Location → Geocodes address
      ↓
Enters Delivery Location(s) → Can add multiple stops
      ↓
System calls Google Maps Distance Matrix API
      ↓
Pricing Engine calculates:
  - Base Fee (first 5km)
  - Distance Fee (per km)
  - Handling Fees (material-specific)
  - Platform Markup (20%)
      ↓
Client sees price breakdown → Confirms booking
      ↓
Weight validation:
  - If < 2000kg → Booking created ✅
  - If > 2000kg → Warning shown ⚠️
  - If > 2050kg → Booking blocked ❌
      ↓
Job created with status: "pending"
      ↓
Available drivers notified
```

### **2. Driver Job Acceptance Flow**

```
Driver receives notification
      ↓
Views job details:
  - Pickup/delivery locations
  - Materials list
  - Total weight
  - Route preview
  - Payment amount
      ↓
Driver accepts job
      ↓
Job status → "accepted"
      ↓
Client notified
      ↓
Driver navigates to pickup
      ↓
GPS tracking starts
      ↓
Arrives at pickup → Verifies load
      ↓
Job status → "in_transit"
      ↓
Real-time tracking visible to client
      ↓
Arrives at delivery → Captures Proof of Delivery:
  - Photo of delivered materials
  - Recipient signature
  - Recipient name/phone
      ↓
Job status → "delivered"
      ↓
Payment processed
      ↓
Driver receives commission
```

### **3. Pricing Calculation Flow**

```
Input: Origin, Destination(s), Materials List
      ↓
Step 1: Calculate Distance
  - Call Google Maps Distance Matrix API
  - Get optimized route for multi-stops
  - Extract total distance in km
      ↓
Step 2: Base Fee
  baseFee = distance <= 5km ? BASE_FEE_AMOUNT : BASE_FEE_AMOUNT
      ↓
Step 3: Distance Fee
  distanceFee = (distance - 5) * COST_PER_KM
      ↓
Step 4: Material Handling Fees
  For each material:
    handlingFee += material.quantity * material.handling_fee_per_unit
      ↓
Step 5: Calculate Subtotal
  subtotal = baseFee + distanceFee + handlingFee
      ↓
Step 6: Platform Markup
  platformFee = subtotal * (PLATFORM_MARKUP_PERCENTAGE / 100)
      ↓
Step 7: Total Amount
  totalAmount = subtotal + platformFee
      ↓
Output: Detailed price breakdown
```

---

## 📊 Database Entity Relationships

```
users (1) ──────→ (1) client_profiles
                      │
                      │ (1 to many)
                      ↓
                    jobs ←──────── (many to 1) driver_profiles
                      │                              │
                      │                              │ (1 to many)
                      │                              ↓
                      │                          vehicles
                      │
                      ├──→ (1 to many) job_stops
                      │
                      ├──→ (1 to many) job_materials ←─ materials
                      │
                      ├──→ (1 to many) tracking
                      │
                      ├──→ (1 to 1) proof_of_delivery
                      │
                      └──→ (1 to many) payments
```

---

## 🔐 Authentication & Authorization

### **User Roles**

| Role | Permissions |
|------|-------------|
| **Client** | - Create jobs<br>- View own jobs<br>- Track deliveries<br>- View invoices |
| **Driver** | - View available jobs<br>- Accept jobs<br>- Update job status<br>- Submit PoD<br>- View earnings |
| **Admin** | - View all jobs<br>- Manage users<br>- View analytics<br>- Configure pricing<br>- Resolve disputes |

### **Authentication Flow**

```
User Registration
      ↓
Email/Phone verification
      ↓
Supabase Auth creates user
      ↓
Insert into users table
      ↓
Create role-specific profile:
  - client_profiles (if builder/hardware store)
  - driver_profiles (if driver)
      ↓
User can log in
      ↓
JWT token issued by Supabase
      ↓
Token includes user_id + role
      ↓
Row-Level Security enforces permissions
```

---

## 🗺️ Real-Time Tracking Architecture

### **GPS Data Flow**

```
Driver App (Mobile)
      ↓
Captures GPS coordinates every 10 seconds
      ↓
Sends to API: POST /api/tracking
{
  job_id: "uuid",
  location: { lat, lng },
  speed: 45.5,
  heading: 180,
  accuracy: 10
}
      ↓
Inserts into tracking table
      ↓
Supabase Realtime broadcasts to subscribers
      ↓
Client App receives update
      ↓
Updates marker on map
      ↓
Calculates ETA based on distance + speed
```

### **Real-Time Subscription (Client Side)**

```javascript
// Client subscribes to job tracking updates
const subscription = supabase
  .channel(`job:${jobId}`)
  .on('postgres_changes', 
    { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'tracking',
      filter: `job_id=eq.${jobId}`
    },
    (payload) => {
      // Update map with new location
      updateDriverMarker(payload.new.location)
    }
  )
  .subscribe()
```

---

## 💳 Payment Processing Flow (M-Pesa)

```
Job Status: "delivered"
      ↓
Client sees invoice
      ↓
Clicks "Pay with M-Pesa"
      ↓
Enters M-Pesa phone number
      ↓
Backend: POST /api/payments/mpesa/initiate
      ↓
Call Safaricom Daraja API:
  - STK Push to client phone
      ↓
Client receives M-Pesa prompt
      ↓
Client enters PIN
      ↓
M-Pesa sends callback to our server
      ↓
POST /api/payments/mpesa/callback
      ↓
Update payment record:
  - payment_status: "completed"
  - mpesa_receipt_number
      ↓
Calculate driver commission (70%)
      ↓
Update driver earnings
      ↓
Send SMS receipts to both parties
```

---

## 📁 Frontend Directory Structure (Detailed)

```
app/
├── (auth)/                    # Auth routes (grouped)
│   ├── login/
│   │   └── page.tsx          # Login page
│   ├── register/
│   │   └── page.tsx          # Registration page
│   └── layout.tsx            # Auth layout (no navbar)
│
├── client/                    # Client dashboard routes
│   ├── dashboard/
│   │   └── page.tsx          # Client home
│   ├── bookings/
│   │   ├── new/
│   │   │   └── page.tsx      # Create new booking
│   │   └── [id]/
│   │       └── page.tsx      # View booking details
│   ├── tracking/
│   │   └── [id]/
│   │       └── page.tsx      # Live tracking page
│   └── layout.tsx            # Client layout (navbar)
│
├── driver/                    # Driver dashboard routes
│   ├── dashboard/
│   │   └── page.tsx          # Driver home (available jobs)
│   ├── jobs/
│   │   └── [id]/
│   │       └── page.tsx      # Job details & navigation
│   ├── earnings/
│   │   └── page.tsx          # Earnings history
│   └── layout.tsx            # Driver layout
│
├── admin/                     # Admin dashboard routes
│   ├── dashboard/
│   │   └── page.tsx          # Analytics overview
│   ├── jobs/
│   │   └── page.tsx          # All jobs list
│   ├── users/
│   │   └── page.tsx          # User management
│   └── layout.tsx            # Admin layout
│
├── api/                       # API routes
│   ├── auth/
│   │   ├── login/
│   │   │   └── route.ts
│   │   ├── register/
│   │   │   └── route.ts
│   │   └── logout/
│   │       └── route.ts
│   ├── jobs/
│   │   ├── route.ts          # GET (list), POST (create)
│   │   ├── [id]/
│   │   │   └── route.ts      # GET, PATCH, DELETE
│   │   └── available/
│   │       └── route.ts      # GET available jobs for drivers
│   ├── pricing/
│   │   └── calculate/
│   │       └── route.ts      # POST - calculate job price
│   ├── materials/
│   │   └── route.ts          # GET materials catalog
│   ├── tracking/
│   │   ├── route.ts          # POST - add GPS point
│   │   └── [jobId]/
│   │       └── route.ts      # GET - tracking history
│   └── payments/
│       ├── mpesa/
│       │   ├── initiate/
│       │   │   └── route.ts  # POST - start M-Pesa payment
│       │   └── callback/
│       │       └── route.ts  # POST - M-Pesa callback
│       └── route.ts          # GET payment history
│
├── layout.tsx                 # Root layout
├── page.tsx                   # Landing page
└── globals.css                # Global styles
```

---

## 🧩 Component Architecture

```
components/
├── ui/                        # shadcn/ui base components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── select.tsx
│   └── ...
│
├── shared/                    # Shared across all roles
│   ├── Navbar.tsx            # Role-aware navigation
│   ├── Footer.tsx
│   ├── Map.tsx               # Google Maps wrapper
│   ├── LoadingSpinner.tsx
│   └── ErrorBoundary.tsx
│
├── client/                    # Client-specific components
│   ├── MaterialSelector.tsx  # Select materials with quantities
│   ├── WeightCalculator.tsx  # Real-time weight calculation
│   ├── LocationPicker.tsx    # Address input with autocomplete
│   ├── PriceBreakdown.tsx    # Price component display
│   ├── JobCard.tsx           # Job summary card
│   └── TrackingMap.tsx       # Live tracking display
│
├── driver/                    # Driver-specific components
│   ├── JobListItem.tsx       # Available job card
│   ├── RoutePreview.tsx      # Route map preview
│   ├── LoadVerification.tsx  # Checklist before pickup
│   ├── NavigationMap.tsx     # Turn-by-turn navigation
│   └── PodCapture.tsx        # Photo + signature capture
│
└── admin/                     # Admin-specific components
    ├── JobsTable.tsx         # Data table for all jobs
    ├── UserManagement.tsx    # User CRUD operations
    ├── AnalyticsDashboard.tsx
    └── PricingConfig.tsx     # Configure pricing settings
```

---

## 🛠️ Services Layer

```
lib/
├── supabase/
│   ├── client.ts             # Browser Supabase client
│   ├── server.ts             # Server-side Supabase client
│   └── middleware.ts         # Auth middleware
│
├── services/
│   ├── auth.service.ts       # Authentication logic
│   ├── job.service.ts        # Job CRUD operations
│   ├── pricing.service.ts    # Pricing calculations
│   ├── maps.service.ts       # Google Maps integration
│   ├── tracking.service.ts   # GPS tracking logic
│   ├── payment.service.ts    # M-Pesa integration
│   └── notification.service.ts # SMS/Push notifications
│
├── hooks/
│   ├── useAuth.ts            # Auth state hook
│   ├── useJobs.ts            # Jobs data hook
│   ├── useTracking.ts        # Real-time tracking hook
│   └── useLocalStorage.ts    # Offline persistence
│
└── utils/
    ├── validation.ts         # Zod schemas
    ├── formatters.ts         # Date, currency formatters
    ├── constants.ts          # App constants
    └── cn.ts                 # Tailwind class merger
```

---

## 🔄 State Management Strategy

**We'll use a simple approach:**

1. **Server State**: React Query / SWR for API data
2. **Auth State**: Supabase Auth + React Context
3. **Form State**: React Hook Form
4. **Real-time State**: Supabase Realtime subscriptions
5. **Local State**: React useState/useReducer

**No Redux needed** - keeps things simple!

---

## 📱 Responsive Design Strategy

### **Breakpoints**

```css
/* Mobile First Approach */
sm: 640px   /* Large phones */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

### **Touch Targets**

All interactive elements: **minimum 44px × 44px**
- Buttons: 48px height
- Input fields: 48px height
- List items: 56px height

---

## 🚀 Performance Optimizations

1. **Code Splitting**: Next.js automatic route-based splitting
2. **Image Optimization**: Next.js Image component
3. **API Route Caching**: Cache distance calculations
4. **Database Indexing**: Already defined in migrations
5. **Real-time Throttling**: GPS updates every 10s (not 1s)

---

## 🔒 Security Measures

1. **Row-Level Security**: Database-level access control
2. **API Rate Limiting**: Prevent abuse
3. **Input Validation**: Zod schemas on client + server
4. **SQL Injection Prevention**: Supabase prepared statements
5. **XSS Prevention**: React automatic escaping
6. **HTTPS Only**: Enforce in production
7. **Environment Variables**: Never expose secrets client-side

---

## 📈 Scalability Considerations

### **Current Architecture** (0-1000 jobs/day)
- Single Next.js instance
- Supabase Free/Pro tier
- Direct Google Maps API calls

### **Growth Phase** (1000-10,000 jobs/day)
- Vercel Pro (multiple regions)
- Supabase Pro tier
- Redis cache for pricing
- CDN for static assets

### **Scale Phase** (10,000+ jobs/day)
- Microservices architecture
- Separate pricing service
- Message queue for notifications
- Dedicated tracking service

---

## ✅ PHASE C COMPLETE!

**What we've accomplished:**
- ✅ Documented complete system architecture
- ✅ Defined core workflows
- ✅ Mapped database relationships
- ✅ Planned frontend structure
- ✅ Designed component hierarchy
- ✅ Outlined security measures

---

## 🎯 NEXT STEPS: START CODING!

We'll now begin implementation in this order:

### **Phase D: Core Setup**
1. TypeScript types definition
2. Supabase client configuration
3. Authentication utilities
4. Base UI components

### **Phase E: Features (Iterative)**
1. Material catalog & selector
2. Pricing engine
3. Job booking flow
4. Driver job acceptance
5. GPS tracking
6. Proof of delivery
7. M-Pesa payments

---

**Ready to start coding? Reply "Start Phase D" and we'll begin with TypeScript types and core utilities!** 🚀
