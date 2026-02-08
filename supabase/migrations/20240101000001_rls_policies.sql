-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE proof_of_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- USERS POLICIES
-- =============================================
CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
USING (auth.uid()::text = id::text);

-- =============================================
-- CLIENT PROFILES POLICIES
-- =============================================
CREATE POLICY "Clients can view their own profile"
ON client_profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = client_profiles.user_id
        AND users.id::text = auth.uid()::text
    )
);

CREATE POLICY "Clients can update their own profile"
ON client_profiles FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = client_profiles.user_id
        AND users.id::text = auth.uid()::text
    )
);

-- Drivers can view client profiles for their jobs
CREATE POLICY "Drivers can view client profiles for assigned jobs"
ON client_profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM jobs j
        JOIN driver_profiles dp ON j.driver_id = dp.id
        JOIN users u ON dp.user_id = u.id
        WHERE j.client_id = client_profiles.id
        AND u.id::text = auth.uid()::text
    )
);

-- =============================================
-- DRIVER PROFILES POLICIES
-- =============================================
CREATE POLICY "Drivers can view their own profile"
ON driver_profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = driver_profiles.user_id
        AND users.id::text = auth.uid()::text
    )
);

CREATE POLICY "Drivers can update their own profile"
ON driver_profiles FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = driver_profiles.user_id
        AND users.id::text = auth.uid()::text
    )
);

-- Clients can view driver profiles for their jobs
CREATE POLICY "Clients can view driver profiles for their jobs"
ON driver_profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM jobs j
        JOIN client_profiles cp ON j.client_id = cp.id
        JOIN users u ON cp.user_id = u.id
        WHERE j.driver_id = driver_profiles.id
        AND u.id::text = auth.uid()::text
    )
);

-- =============================================
-- VEHICLES POLICIES
-- =============================================
CREATE POLICY "Drivers can view their own vehicles"
ON vehicles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM driver_profiles dp
        JOIN users u ON dp.user_id = u.id
        WHERE vehicles.driver_id = dp.id
        AND u.id::text = auth.uid()::text
    )
);

CREATE POLICY "Clients can view vehicles assigned to their jobs"
ON vehicles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM jobs j
        JOIN client_profiles cp ON j.client_id = cp.id
        JOIN users u ON cp.user_id = u.id
        WHERE j.vehicle_id = vehicles.id
        AND u.id::text = auth.uid()::text
    )
);

-- =============================================
-- MATERIALS POLICIES (Public read)
-- =============================================
CREATE POLICY "Anyone can view active materials"
ON materials FOR SELECT
USING (is_active = true);

-- =============================================
-- JOBS POLICIES
-- =============================================
CREATE POLICY "Clients can view their own jobs"
ON jobs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM client_profiles cp
        JOIN users u ON cp.user_id = u.id
        WHERE jobs.client_id = cp.id
        AND u.id::text = auth.uid()::text
    )
);

CREATE POLICY "Clients can create jobs"
ON jobs FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM client_profiles cp
        JOIN users u ON cp.user_id = u.id
        WHERE jobs.client_id = cp.id
        AND u.id::text = auth.uid()::text
    )
);

CREATE POLICY "Drivers can view their assigned jobs"
ON jobs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM driver_profiles dp
        JOIN users u ON dp.user_id = u.id
        WHERE jobs.driver_id = dp.id
        AND u.id::text = auth.uid()::text
    )
);

CREATE POLICY "Drivers can update their assigned jobs"
ON jobs FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM driver_profiles dp
        JOIN users u ON dp.user_id = u.id
        WHERE jobs.driver_id = dp.id
        AND u.id::text = auth.uid()::text
    )
);

-- =============================================
-- JOB STOPS POLICIES
-- =============================================
CREATE POLICY "Users can view stops for their jobs"
ON job_stops FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM jobs j
        LEFT JOIN client_profiles cp ON j.client_id = cp.id
        LEFT JOIN driver_profiles dp ON j.driver_id = dp.id
        LEFT JOIN users uc ON cp.user_id = uc.id
        LEFT JOIN users ud ON dp.user_id = ud.id
        WHERE job_stops.job_id = j.id
        AND (uc.id::text = auth.uid()::text OR ud.id::text = auth.uid()::text)
    )
);

-- =============================================
-- JOB MATERIALS POLICIES
-- =============================================
CREATE POLICY "Users can view materials for their jobs"
ON job_materials FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM jobs j
        LEFT JOIN client_profiles cp ON j.client_id = cp.id
        LEFT JOIN driver_profiles dp ON j.driver_id = dp.id
        LEFT JOIN users uc ON cp.user_id = uc.id
        LEFT JOIN users ud ON dp.user_id = ud.id
        WHERE job_materials.job_id = j.id
        AND (uc.id::text = auth.uid()::text OR ud.id::text = auth.uid()::text)
    )
);

-- =============================================
-- TRACKING POLICIES
-- =============================================
CREATE POLICY "Clients can view tracking for their jobs"
ON tracking FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM jobs j
        JOIN client_profiles cp ON j.client_id = cp.id
        JOIN users u ON cp.user_id = u.id
        WHERE tracking.job_id = j.id
        AND u.id::text = auth.uid()::text
    )
);

CREATE POLICY "Drivers can insert tracking for their jobs"
ON tracking FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM driver_profiles dp
        JOIN users u ON dp.user_id = u.id
        WHERE tracking.driver_id = dp.id
        AND u.id::text = auth.uid()::text
    )
);

-- =============================================
-- PROOF OF DELIVERY POLICIES
-- =============================================
CREATE POLICY "Users can view POD for their jobs"
ON proof_of_delivery FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM jobs j
        LEFT JOIN client_profiles cp ON j.client_id = cp.id
        LEFT JOIN driver_profiles dp ON j.driver_id = dp.id
        LEFT JOIN users uc ON cp.user_id = uc.id
        LEFT JOIN users ud ON dp.user_id = ud.id
        WHERE proof_of_delivery.job_id = j.id
        AND (uc.id::text = auth.uid()::text OR ud.id::text = auth.uid()::text)
    )
);

CREATE POLICY "Drivers can create POD for their jobs"
ON proof_of_delivery FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM jobs j
        JOIN driver_profiles dp ON j.driver_id = dp.id
        JOIN users u ON dp.user_id = u.id
        WHERE proof_of_delivery.job_id = j.id
        AND u.id::text = auth.uid()::text
    )
);

-- =============================================
-- PAYMENTS POLICIES
-- =============================================
CREATE POLICY "Clients can view their own payments"
ON payments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM client_profiles cp
        JOIN users u ON cp.user_id = u.id
        WHERE payments.client_id = cp.id
        AND u.id::text = auth.uid()::text
    )
);
