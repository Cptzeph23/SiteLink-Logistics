// App configuration constants

export const APP_NAME = "SiteLink Logistics";
export const APP_TAGLINE = "Linking materials to sites";

// Pricing constants (also in .env, but duplicated here for type safety)
export const PRICING = {
  BASE_FEE_AMOUNT: Number(process.env.BASE_FEE_AMOUNT) || 500,
  BASE_FEE_DISTANCE_KM: Number(process.env.BASE_FEE_DISTANCE_KM) || 5,
  COST_PER_KM: Number(process.env.COST_PER_KM) || 50,
  PLATFORM_MARKUP_PERCENTAGE: Number(process.env.PLATFORM_MARKUP_PERCENTAGE) || 20,
} as const;

// Vehicle constraints
export const VEHICLE_CONSTRAINTS = {
  MIN_CAPACITY_KG: 1500,
  MAX_CAPACITY_KG: 2000,
  OVERWEIGHT_TOLERANCE_KG: 50, // Warning threshold
  OVERWEIGHT_BLOCK_KG: 100, // Hard block threshold
} as const;

// Material categories
export const MATERIAL_CATEGORIES = [
  'cement',
  'steel',
  'timber',
  'tiles',
  'aggregates',
  'blocks',
  'roofing',
  'paint',
  'fixtures',
] as const;

// Business types
export const BUSINESS_TYPES = [
  { value: 'builder', label: 'Builder/Contractor' },
  { value: 'hardware_store', label: 'Hardware Store' },
  { value: 'contractor', label: 'Construction Contractor' },
] as const;

// Vehicle types with display names
export const VEHICLE_TYPES = [
  { value: 'isuzu_npr', label: 'Isuzu NPR', capacity: 2000 },
  { value: 'toyota_dyna', label: 'Toyota Dyna', capacity: 2000 },
  { value: 'mitsubishi_canter', label: 'Mitsubishi Canter', capacity: 1500 },
] as const;

// Job status with colors and labels
export const JOB_STATUSES = {
  pending: { label: 'Pending', color: 'yellow', description: 'Waiting for driver' },
  accepted: { label: 'Accepted', color: 'blue', description: 'Driver assigned' },
  in_transit: { label: 'In Transit', color: 'purple', description: 'On the way' },
  delivered: { label: 'Delivered', color: 'green', description: 'Completed' },
  cancelled: { label: 'Cancelled', color: 'red', description: 'Cancelled' },
} as const;

// Tracking settings
export const TRACKING = {
  UPDATE_INTERVAL_MS: 10000, // 10 seconds
  MAP_ZOOM_LEVEL: 13,
  MARKER_ICON_SIZE: 40,
} as const;

// Validation rules
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_SPECIAL_INSTRUCTIONS_LENGTH: 500,
  MAX_MATERIALS_PER_JOB: 20,
  MAX_STOPS_PER_JOB: 5,
  PHONE_REGEX: /^(\+254|0)[17]\d{8}$/, // Kenyan phone format
} as const;

// M-Pesa configuration
export const MPESA = {
  BUSINESS_SHORT_CODE: process.env.MPESA_SHORTCODE || '',
  PASSKEY: process.env.MPESA_PASSKEY || '',
  CALLBACK_URL: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/mpesa/callback`,
} as const;

// Google Maps configuration
export const GOOGLE_MAPS = {
  DEFAULT_CENTER: { lat: -1.286389, lng: 36.817223 }, // Nairobi
  REGION: 'KE', // Kenya
  LANGUAGE: 'en',
} as const;

// Date/Time formats
export const DATE_FORMATS = {
  DISPLAY_DATE: 'MMM dd, yyyy',
  DISPLAY_TIME: 'h:mm a',
  DISPLAY_DATETIME: 'MMM dd, yyyy h:mm a',
  API_DATETIME: "yyyy-MM-dd'T'HH:mm:ss",
} as const;

// Currency
export const CURRENCY = {
  CODE: 'KES',
  SYMBOL: 'KSh',
  LOCALE: 'en-KE',
} as const;

// Roles and permissions
export const ROLES = {
  CLIENT: 'client',
  DRIVER: 'driver',
  ADMIN: 'admin',
} as const;

// API routes
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
  },
  JOBS: {
    LIST: '/api/jobs',
    CREATE: '/api/jobs',
    DETAIL: (id: string) => `/api/jobs/${id}`,
    AVAILABLE: '/api/jobs/available',
  },
  PRICING: {
    CALCULATE: '/api/pricing/calculate',
  },
  MATERIALS: {
    LIST: '/api/materials',
  },
  TRACKING: {
    CREATE: '/api/tracking',
    BY_JOB: (jobId: string) => `/api/tracking/${jobId}`,
  },
  PAYMENTS: {
    MPESA_INITIATE: '/api/payments/mpesa/initiate',
    MPESA_CALLBACK: '/api/payments/mpesa/callback',
  },
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  OVERWEIGHT: 'Total weight exceeds vehicle capacity.',
  REQUIRED_FIELD: 'This field is required.',
  INVALID_PHONE: 'Please enter a valid Kenyan phone number.',
  INVALID_EMAIL: 'Please enter a valid email address.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  JOB_CREATED: 'Job created successfully!',
  JOB_UPDATED: 'Job updated successfully!',
  PAYMENT_INITIATED: 'Payment request sent to your phone.',
  DELIVERY_CONFIRMED: 'Delivery confirmed successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
} as const;