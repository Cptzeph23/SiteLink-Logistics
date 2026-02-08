// Database table types - matching our Supabase schema

export type UserRole = 'client' | 'driver' | 'admin';

export type JobStatus = 
  | 'pending' 
  | 'accepted' 
  | 'in_transit' 
  | 'delivered' 
  | 'cancelled';

export type VehicleType = 'isuzu_npr' | 'toyota_dyna' | 'mitsubishi_canter';

export type VehicleBody = 'flatbed' | 'box';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type PaymentMethod = 'mpesa' | 'cash' | 'credit';

// =============================================
// USER TYPES
// =============================================

export interface User {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientProfile {
  id: string;
  user_id: string;
  company_name?: string;
  business_type?: 'builder' | 'hardware_store' | 'contractor';
  default_pickup_address?: string;
  default_pickup_location?: GeoLocation;
  is_verified: boolean;
  credit_limit: number;
  created_at: string;
}

export interface DriverProfile {
  id: string;
  user_id: string;
  license_number: string;
  license_expiry: string;
  id_number: string;
  is_verified: boolean;
  is_available: boolean;
  current_location?: GeoLocation;
  last_location_update?: string;
  rating: number;
  total_jobs: number;
  created_at: string;
}

// =============================================
// VEHICLE TYPES
// =============================================

export interface Vehicle {
  id: string;
  driver_id: string;
  registration_number: string;
  vehicle_type: VehicleType;
  body_type: VehicleBody;
  max_capacity_kg: number;
  manufacturing_year: number;
  is_active: boolean;
  insurance_expiry: string;
  inspection_expiry: string;
  created_at: string;
  updated_at: string;
}

// =============================================
// MATERIAL TYPES
// =============================================

export interface Material {
  id: string;
  name: string;
  category: string;
  unit_weight_kg: number;
  unit_type: string;
  requires_straps: boolean;
  requires_tarp: boolean;
  is_fragile: boolean;
  handling_fee_per_unit: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================
// JOB TYPES
// =============================================

export interface Job {
  id: string;
  job_number: string;
  client_id: string;
  driver_id?: string;
  vehicle_id?: string;
  status: JobStatus;
  
  // Distance and pricing
  total_distance_km: number;
  estimated_duration_minutes?: number;
  
  // Pricing breakdown
  base_fee: number;
  distance_fee: number;
  handling_fee: number;
  subtotal: number;
  platform_fee: number;
  total_amount: number;
  
  // Load details
  total_weight_kg: number;
  is_overweight: boolean;
  overweight_acknowledged: boolean;
  
  // Special requirements
  requires_straps: boolean;
  requires_tarp: boolean;
  has_fragile_items: boolean;
  special_instructions?: string;
  
  // Timestamps
  scheduled_pickup_time?: string;
  actual_pickup_time?: string;
  actual_delivery_time?: string;
  created_at: string;
  updated_at: string;
}

export interface JobStop {
  id: string;
  job_id: string;
  stop_order: number;
  stop_type: 'pickup' | 'delivery';
  
  // Location details
  address: string;
  location: GeoLocation;
  contact_name?: string;
  contact_phone?: string;
  
  // Access information
  is_difficult_access: boolean;
  access_notes?: string;
  
  // Timing
  estimated_arrival?: string;
  actual_arrival?: string;
  actual_departure?: string;
  created_at: string;
}

export interface JobMaterial {
  id: string;
  job_id: string;
  material_id: string;
  quantity: number;
  unit_weight_kg: number;
  total_weight_kg: number;
  handling_fee: number;
  created_at: string;
  
  // Populated from join
  material?: Material;
}

// =============================================
// TRACKING TYPES
// =============================================

export interface Tracking {
  id: string;
  job_id: string;
  driver_id: string;
  location: GeoLocation;
  speed_kmh?: number;
  heading?: number;
  accuracy_meters?: number;
  created_at: string;
}

export interface ProofOfDelivery {
  id: string;
  job_id: string;
  photo_url?: string;
  signature_data?: string;
  recipient_name: string;
  recipient_phone?: string;
  notes?: string;
  delivered_at: string;
  created_at: string;
}

// =============================================
// PAYMENT TYPES
// =============================================

export interface Payment {
  id: string;
  job_id: string;
  client_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  
  // M-Pesa specific
  mpesa_receipt_number?: string;
  mpesa_phone_number?: string;
  mpesa_transaction_id?: string;
  
  transaction_reference?: string;
  payment_date?: string;
  created_at: string;
  updated_at: string;
}

// =============================================
// UTILITY TYPES
// =============================================

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface SystemSettings {
  id: string;
  key: string;
  value: string;
  description?: string;
  updated_at: string;
}

// =============================================
// API REQUEST/RESPONSE TYPES
// =============================================

export interface PricingCalculationRequest {
  origin: GeoLocation;
  destinations: GeoLocation[];
  materials: Array<{
    material_id: string;
    quantity: number;
  }>;
}

export interface PricingCalculationResponse {
  total_distance_km: number;
  estimated_duration_minutes: number;
  base_fee: number;
  distance_fee: number;
  handling_fee: number;
  subtotal: number;
  platform_fee: number;
  total_amount: number;
  breakdown: {
    base_fee_details: string;
    distance_fee_details: string;
    handling_fee_details: string;
    platform_fee_details: string;
  };
}

export interface CreateJobRequest {
  materials: Array<{
    material_id: string;
    quantity: number;
  }>;
  stops: Array<{
    stop_type: 'pickup' | 'delivery';
    address: string;
    location: GeoLocation;
    contact_name?: string;
    contact_phone?: string;
    is_difficult_access?: boolean;
    access_notes?: string;
  }>;
  scheduled_pickup_time?: string;
  special_instructions?: string;
  overweight_acknowledged?: boolean;
}

export interface JobWithDetails extends Job {
  client?: ClientProfile & { user?: User };
  driver?: DriverProfile & { user?: User };
  vehicle?: Vehicle;
  stops?: JobStop[];
  materials?: JobMaterial[];
  proof_of_delivery?: ProofOfDelivery;
  payments?: Payment[];
}

// =============================================
// FORM TYPES
// =============================================

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  phone: string;
  full_name: string;
  password: string;
  role: UserRole;
  
  // Client-specific
  company_name?: string;
  business_type?: string;
  
  // Driver-specific
  license_number?: string;
  license_expiry?: string;
  id_number?: string;
}

export interface MaterialSelectionFormData {
  material_id: string;
  quantity: number;
}

export interface LocationFormData {
  address: string;
  location: GeoLocation;
  contact_name?: string;
  contact_phone?: string;
  is_difficult_access?: boolean;
  access_notes?: string;
}

// =============================================
// COMPONENT PROP TYPES
// =============================================

export interface MaterialSelectorProps {
  selectedMaterials: MaterialSelectionFormData[];
  onMaterialsChange: (materials: MaterialSelectionFormData[]) => void;
  maxWeight?: number;
}

export interface WeightCalculatorProps {
  materials: Array<{
    material_id: string;
    quantity: number;
  }>;
  materialsData: Material[];
}

export interface TrackingMapProps {
  jobId: string;
  stops: JobStop[];
  trackingPoints: Tracking[];
  isLive?: boolean;
}

// =============================================
// AUTH TYPES
// =============================================

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  profile: ClientProfile | DriverProfile | null;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: RegisterFormData) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}