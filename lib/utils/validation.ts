import { z } from 'zod';
import { VALIDATION, VEHICLE_CONSTRAINTS } from './constants';

// =============================================
// AUTH SCHEMAS
// =============================================

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(VALIDATION.MIN_PASSWORD_LENGTH, `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`),
});

export const registerClientSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().regex(VALIDATION.PHONE_REGEX, 'Please enter a valid Kenyan phone number (e.g., 0712345678)'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  password: z.string().min(VALIDATION.MIN_PASSWORD_LENGTH, `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`),
  role: z.literal('client'),
  company_name: z.string().optional(),
  business_type: z.enum(['builder', 'hardware_store', 'contractor']).optional(),
});

export const registerDriverSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().regex(VALIDATION.PHONE_REGEX, 'Please enter a valid Kenyan phone number'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  password: z.string().min(VALIDATION.MIN_PASSWORD_LENGTH, `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`),
  role: z.literal('driver'),
  license_number: z.string().min(5, 'License number is required'),
  license_expiry: z.string().min(1, 'License expiry date is required'),
  id_number: z.string().min(5, 'ID number is required'),
});

// =============================================
// MATERIAL SCHEMAS
// =============================================

export const materialSelectionSchema = z.object({
  material_id: z.string().uuid('Invalid material ID'),
  quantity: z.number().int().positive('Quantity must be a positive number'),
});

// =============================================
// LOCATION SCHEMAS
// =============================================

export const geoLocationSchema = z.object({
  lat: z.number().min(-90).max(90, 'Invalid latitude'),
  lng: z.number().min(-180).max(180, 'Invalid longitude'),
});

export const jobStopSchema = z.object({
  stop_type: z.enum(['pickup', 'delivery']),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  location: geoLocationSchema,
  contact_name: z.string().optional(),
  contact_phone: z.string().regex(VALIDATION.PHONE_REGEX, 'Invalid phone number').optional().or(z.literal('')),
  is_difficult_access: z.boolean().optional(),
  access_notes: z.string().max(VALIDATION.MAX_SPECIAL_INSTRUCTIONS_LENGTH).optional(),
});

// =============================================
// JOB SCHEMAS
// =============================================

export const createJobSchema = z.object({
  materials: z.array(materialSelectionSchema)
    .min(1, 'At least one material is required')
    .max(VALIDATION.MAX_MATERIALS_PER_JOB, `Maximum ${VALIDATION.MAX_MATERIALS_PER_JOB} materials per job`),
  stops: z.array(jobStopSchema)
    .min(2, 'At least one pickup and one delivery location required')
    .max(VALIDATION.MAX_STOPS_PER_JOB, `Maximum ${VALIDATION.MAX_STOPS_PER_JOB} stops per job`),
  scheduled_pickup_time: z.string().optional(),
  special_instructions: z.string().max(VALIDATION.MAX_SPECIAL_INSTRUCTIONS_LENGTH, 'Instructions too long').optional(),
  overweight_acknowledged: z.boolean().optional(),
});

export const updateJobStatusSchema = z.object({
  status: z.enum(['pending', 'accepted', 'in_transit', 'delivered', 'cancelled']),
  actual_pickup_time: z.string().optional(),
  actual_delivery_time: z.string().optional(),
});

// =============================================
// PRICING SCHEMAS
// =============================================

export const pricingCalculationSchema = z.object({
  origin: geoLocationSchema,
  destinations: z.array(geoLocationSchema).min(1, 'At least one destination required'),
  materials: z.array(materialSelectionSchema).min(1, 'At least one material required'),
});

// =============================================
// TRACKING SCHEMAS
// =============================================

export const trackingPointSchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
  location: geoLocationSchema,
  speed_kmh: z.number().min(0).max(200).optional(),
  heading: z.number().min(0).max(360).optional(),
  accuracy_meters: z.number().min(0).optional(),
});

// =============================================
// PROOF OF DELIVERY SCHEMAS
// =============================================

export const proofOfDeliverySchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
  photo_url: z.string().url('Invalid photo URL').optional(),
  signature_data: z.string().optional(), // Base64 encoded
  recipient_name: z.string().min(2, 'Recipient name is required'),
  recipient_phone: z.string().regex(VALIDATION.PHONE_REGEX, 'Invalid phone number').optional(),
  notes: z.string().max(500).optional(),
});

// =============================================
// PAYMENT SCHEMAS
// =============================================

export const mpesaInitiateSchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
  phone_number: z.string().regex(VALIDATION.PHONE_REGEX, 'Invalid M-Pesa phone number'),
  amount: z.number().positive('Amount must be positive'),
});

// =============================================
// PROFILE SCHEMAS
// =============================================

export const updateClientProfileSchema = z.object({
  company_name: z.string().optional(),
  business_type: z.enum(['builder', 'hardware_store', 'contractor']).optional(),
  default_pickup_address: z.string().optional(),
  default_pickup_location: geoLocationSchema.optional(),
});

export const updateDriverProfileSchema = z.object({
  is_available: z.boolean().optional(),
  current_location: geoLocationSchema.optional(),
});

// =============================================
// VEHICLE SCHEMAS
// =============================================

export const vehicleSchema = z.object({
  registration_number: z.string().min(5, 'Registration number is required'),
  vehicle_type: z.enum(['isuzu_npr', 'toyota_dyna', 'mitsubishi_canter']),
  body_type: z.enum(['flatbed', 'box']),
  max_capacity_kg: z.number()
    .int()
    .min(VEHICLE_CONSTRAINTS.MIN_CAPACITY_KG, `Capacity must be at least ${VEHICLE_CONSTRAINTS.MIN_CAPACITY_KG}kg`)
    .max(VEHICLE_CONSTRAINTS.MAX_CAPACITY_KG, `Capacity cannot exceed ${VEHICLE_CONSTRAINTS.MAX_CAPACITY_KG}kg`),
  manufacturing_year: z.number()
    .int()
    .min(2000, 'Vehicle too old')
    .max(new Date().getFullYear() + 1, 'Invalid year'),
  insurance_expiry: z.string().min(1, 'Insurance expiry date is required'),
  inspection_expiry: z.string().min(1, 'Inspection expiry date is required'),
});

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Validate weight doesn't exceed vehicle capacity
 */
export function validateWeight(totalWeightKg: number, vehicleCapacityKg: number = VEHICLE_CONSTRAINTS.MAX_CAPACITY_KG) {
  if (totalWeightKg > vehicleCapacityKg + VEHICLE_CONSTRAINTS.OVERWEIGHT_BLOCK_KG) {
    return {
      isValid: false,
      isBlocked: true,
      message: `Total weight (${totalWeightKg}kg) significantly exceeds vehicle capacity (${vehicleCapacityKg}kg). This load cannot be transported.`,
    };
  }
  
  if (totalWeightKg > vehicleCapacityKg) {
    return {
      isValid: true,
      isWarning: true,
      message: `Total weight (${totalWeightKg}kg) exceeds vehicle capacity (${vehicleCapacityKg}kg) by ${totalWeightKg - vehicleCapacityKg}kg. Please acknowledge this overload.`,
    };
  }
  
  return {
    isValid: true,
    isWarning: false,
    message: `Total weight: ${totalWeightKg}kg (within capacity)`,
  };
}

/**
 * Type exports for use in forms
 */
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterClientFormData = z.infer<typeof registerClientSchema>;
export type RegisterDriverFormData = z.infer<typeof registerDriverSchema>;
export type CreateJobFormData = z.infer<typeof createJobSchema>;
export type PricingCalculationData = z.infer<typeof pricingCalculationSchema>;
export type TrackingPointData = z.infer<typeof trackingPointSchema>;
export type ProofOfDeliveryData = z.infer<typeof proofOfDeliverySchema>;
export type MpesaInitiateData = z.infer<typeof mpesaInitiateSchema>;