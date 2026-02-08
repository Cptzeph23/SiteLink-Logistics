-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create enum types
CREATE TYPE user_role AS ENUM ('client', 'driver', 'admin');
CREATE TYPE job_status AS ENUM ('pending', 'accepted', 'in_transit', 'delivered', 'cancelled');
CREATE TYPE vehicle_type AS ENUM ('isuzu_npr', 'toyota_dyna', 'mitsubishi_canter');
CREATE TYPE vehicle_body AS ENUM ('flatbed', 'box');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CLIENT PROFILES
-- =============================================
CREATE TABLE client_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    business_type VARCHAR(100), -- 'builder', 'hardware_store', 'contractor'
    default_pickup_address TEXT,
    default_pickup_location GEOGRAPHY(POINT, 4326),
    is_verified BOOLEAN DEFAULT false,
    credit_limit DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =============================================
-- DRIVER PROFILES
-- =============================================
CREATE TABLE driver_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(50) NOT NULL,
    license_expiry DATE NOT NULL,
    id_number VARCHAR(50) NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    is_available BOOLEAN DEFAULT true,
    current_location GEOGRAPHY(POINT, 4326),
    last_location_update TIMESTAMP WITH TIME ZONE,
    rating DECIMAL(3, 2) DEFAULT 5.00,
    total_jobs INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id),
    UNIQUE(license_number)
);

-- =============================================
-- VEHICLES
-- =============================================
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES driver_profiles(id) ON DELETE CASCADE,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    vehicle_type vehicle_type NOT NULL,
    body_type vehicle_body NOT NULL,
    max_capacity_kg INTEGER NOT NULL CHECK (max_capacity_kg >= 1500 AND max_capacity_kg <= 2000),
    manufacturing_year INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    insurance_expiry DATE NOT NULL,
    inspection_expiry DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for finding available vehicles
CREATE INDEX idx_vehicles_active ON vehicles(is_active);

-- =============================================
-- MATERIALS CATALOG
-- =============================================
CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'cement', 'steel', 'timber', 'tiles', 'aggregates'
    unit_weight_kg DECIMAL(10, 2) NOT NULL, -- Weight per unit
    unit_type VARCHAR(50) NOT NULL, -- 'bag', 'bundle', 'sheet', 'tonne', 'cubic_meter'
    requires_straps BOOLEAN DEFAULT false,
    requires_tarp BOOLEAN DEFAULT false,
    is_fragile BOOLEAN DEFAULT false,
    handling_fee_per_unit DECIMAL(10, 2) DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Common construction materials index
CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_materials_active ON materials(is_active);

-- =============================================
-- JOBS (Main booking table)
-- =============================================
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_number VARCHAR(50) UNIQUE NOT NULL,
    client_id UUID NOT NULL REFERENCES client_profiles(id),
    driver_id UUID REFERENCES driver_profiles(id),
    vehicle_id UUID REFERENCES vehicles(id),
    
    status job_status DEFAULT 'pending',
    
    -- Distance and pricing
    total_distance_km DECIMAL(10, 2) NOT NULL,
    estimated_duration_minutes INTEGER,
    
    -- Pricing breakdown
    base_fee DECIMAL(10, 2) NOT NULL,
    distance_fee DECIMAL(10, 2) NOT NULL,
    handling_fee DECIMAL(10, 2) DEFAULT 0,
    subtotal DECIMAL(10, 2) NOT NULL,
    platform_fee DECIMAL(10, 2) NOT NULL, -- 20% markup
    total_amount DECIMAL(10, 2) NOT NULL,
    
    -- Load details
    total_weight_kg DECIMAL(10, 2) NOT NULL,
    is_overweight BOOLEAN DEFAULT false,
    overweight_acknowledged BOOLEAN DEFAULT false,
    
    -- Special requirements
    requires_straps BOOLEAN DEFAULT false,
    requires_tarp BOOLEAN DEFAULT false,
    has_fragile_items BOOLEAN DEFAULT false,
    special_instructions TEXT,
    
    -- Timestamps
    scheduled_pickup_time TIMESTAMP WITH TIME ZONE,
    actual_pickup_time TIMESTAMP WITH TIME ZONE,
    actual_delivery_time TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generate job number automatically
CREATE OR REPLACE FUNCTION generate_job_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.job_number := 'SL' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('job_number_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE job_number_seq START 1;

CREATE TRIGGER set_job_number
BEFORE INSERT ON jobs
FOR EACH ROW
EXECUTE FUNCTION generate_job_number();

-- Indexes for job queries
CREATE INDEX idx_jobs_client ON jobs(client_id);
CREATE INDEX idx_jobs_driver ON jobs(driver_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

-- =============================================
-- JOB STOPS (Pickup and delivery locations)
-- =============================================
CREATE TABLE job_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    stop_order INTEGER NOT NULL, -- 1, 2, 3... for multi-stop routes
    stop_type VARCHAR(20) NOT NULL, -- 'pickup' or 'delivery'
    
    -- Location details
    address TEXT NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    contact_name VARCHAR(255),
    contact_phone VARCHAR(20),
    
    -- Access information
    is_difficult_access BOOLEAN DEFAULT false,
    access_notes TEXT,
    
    -- Timing
    estimated_arrival TIMESTAMP WITH TIME ZONE,
    actual_arrival TIMESTAMP WITH TIME ZONE,
    actual_departure TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_job_stops_job ON job_stops(job_id, stop_order);

-- =============================================
-- JOB MATERIALS (Items in each job)
-- =============================================
CREATE TABLE job_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_weight_kg DECIMAL(10, 2) NOT NULL,
    total_weight_kg DECIMAL(10, 2) NOT NULL,
    handling_fee DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_job_materials_job ON job_materials(job_id);

-- =============================================
-- TRACKING (GPS breadcrumbs)
-- =============================================
CREATE TABLE tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES driver_profiles(id),
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    speed_kmh DECIMAL(5, 2),
    heading DECIMAL(5, 2), -- Compass bearing 0-360
    accuracy_meters INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spatial index for location queries
CREATE INDEX idx_tracking_location ON tracking USING GIST(location);
CREATE INDEX idx_tracking_job ON tracking(job_id, created_at DESC);

-- =============================================
-- PROOF OF DELIVERY
-- =============================================
CREATE TABLE proof_of_delivery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    photo_url TEXT,
    signature_data TEXT, -- Base64 encoded signature
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(20),
    notes TEXT,
    delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id)
);

-- =============================================
-- PAYMENTS
-- =============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id),
    client_id UUID NOT NULL REFERENCES client_profiles(id),
    
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'mpesa', 'cash', 'credit'
    payment_status payment_status DEFAULT 'pending',
    
    -- M-Pesa specific fields
    mpesa_receipt_number VARCHAR(100),
    mpesa_phone_number VARCHAR(20),
    mpesa_transaction_id VARCHAR(100),
    
    transaction_reference VARCHAR(100) UNIQUE,
    payment_date TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_job ON payments(job_id);
CREATE INDEX idx_payments_client ON payments(client_id);
CREATE INDEX idx_payments_status ON payments(payment_status);

-- =============================================
-- UPDATED AT TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
