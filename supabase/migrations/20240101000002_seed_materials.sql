-- =============================================
-- SEED DATA FOR MATERIALS CATALOG
-- =============================================

-- Common construction materials in Kenya
INSERT INTO materials (name, category, unit_weight_kg, unit_type, requires_straps, requires_tarp, is_fragile, handling_fee_per_unit, description) VALUES

-- CEMENT
('Bamburi Cement 50kg', 'cement', 50.00, 'bag', false, true, false, 10.00, 'Standard Portland cement, 50kg bag'),
('Mombasa Cement 50kg', 'cement', 50.00, 'bag', false, true, false, 10.00, 'Portland cement, 50kg bag'),
('East African Portland Cement 50kg', 'cement', 50.00, 'bag', false, true, false, 10.00, 'EA Portland cement, 50kg bag'),

-- STEEL & REINFORCEMENT
('Y12 Steel Bars (6m)', 'steel', 53.30, 'piece', true, false, false, 20.00, '12mm reinforcement bar, 6 meters long'),
('Y16 Steel Bars (6m)', 'steel', 94.70, 'piece', true, false, false, 25.00, '16mm reinforcement bar, 6 meters long'),
('Y20 Steel Bars (6m)', 'steel', 148.00, 'piece', true, false, false, 30.00, '20mm reinforcement bar, 6 meters long'),
('Y25 Steel Bars (6m)', 'steel', 231.00, 'piece', true, false, false, 35.00, '25mm reinforcement bar, 6 meters long'),
('BRC Mesh A142 (4.8m x 2.4m)', 'steel', 35.00, 'sheet', true, false, false, 15.00, 'Welded wire mesh for slab reinforcement'),
('BRC Mesh A193 (4.8m x 2.4m)', 'steel', 48.00, 'sheet', true, false, false, 15.00, 'Heavy duty welded wire mesh'),

-- TIMBER
('Roofing Timber 2x3 (12ft)', 'timber', 8.50, 'piece', true, true, false, 5.00, 'Treated roofing timber, 2x3 inches, 12 feet'),
('Roofing Timber 2x4 (12ft)', 'timber', 11.30, 'piece', true, true, false, 5.00, 'Treated roofing timber, 2x4 inches, 12 feet'),
('Roofing Timber 3x3 (12ft)', 'timber', 12.70, 'piece', true, true, false, 5.00, 'Treated roofing timber, 3x3 inches, 12 feet'),
('Plywood 8x4 (18mm)', 'timber', 28.00, 'sheet', true, true, false, 20.00, 'Marine plywood sheet, 8x4 feet, 18mm thick'),
('Plywood 8x4 (12mm)', 'timber', 19.00, 'sheet', true, true, false, 15.00, 'Marine plywood sheet, 8x4 feet, 12mm thick'),

-- TILES & CERAMICS
('Floor Tiles 60x60cm', 'tiles', 25.00, 'box', false, false, true, 30.00, 'Porcelain floor tiles, 60x60cm, 4 pieces per box'),
('Wall Tiles 30x60cm', 'tiles', 18.00, 'box', false, false, true, 25.00, 'Ceramic wall tiles, 30x60cm, 6 pieces per box'),
('Roof Tiles (Terracotta)', 'tiles', 3.50, 'piece', false, false, true, 5.00, 'Clay roof tiles'),

-- AGGREGATES
('River Sand (per tonne)', 'aggregates', 1000.00, 'tonne', false, false, false, 50.00, 'Clean river sand for construction'),
('Ballast (per tonne)', 'aggregates', 1000.00, 'tonne', false, false, false, 50.00, 'Machine crushed ballast'),
('Blue Metal (20mm)', 'aggregates', 1000.00, 'tonne', false, false, false, 50.00, 'Machine crushed stones, 20mm'),
('Hardcore (per tonne)', 'aggregates', 1000.00, 'tonne', false, false, false, 50.00, 'Crushed rock for foundation'),

-- BLOCKS & BRICKS
('Concrete Block 6-inch', 'blocks', 18.00, 'piece', false, false, false, 5.00, 'Standard concrete building block, 6 inches'),
('Concrete Block 9-inch', 'blocks', 25.00, 'piece', false, false, false, 5.00, 'Standard concrete building block, 9 inches'),
('Machine Cut Stones', 'blocks', 35.00, 'piece', false, false, false, 10.00, 'Dressed building stones'),
('Red Bricks', 'blocks', 3.00, 'piece', false, false, false, 2.00, 'Standard red clay bricks'),

-- ROOFING SHEETS
('Mabati Box Profile 3m (Gauge 28)', 'roofing', 8.50, 'sheet', true, false, false, 15.00, 'Corrugated iron sheet, 3 meters, gauge 28'),
('Mabati Box Profile 3m (Gauge 30)', 'roofing', 7.20, 'sheet', true, false, false, 15.00, 'Corrugated iron sheet, 3 meters, gauge 30'),
('Aluminum Roofing Sheet 3m', 'roofing', 4.50, 'sheet', true, false, false, 15.00, 'Lightweight aluminum roofing, 3 meters'),

-- PAINT & FINISHING
('Crown Paint 20L (Emulsion)', 'paint', 24.00, 'bucket', false, false, false, 10.00, 'Interior/exterior emulsion paint, 20 liters'),
('Sadolin Paint 20L', 'paint', 24.00, 'bucket', false, false, false, 10.00, 'Premium paint, 20 liters'),

-- DOORS & WINDOWS
('Flush Door 6x3 ft', 'fixtures', 25.00, 'piece', false, true, true, 50.00, 'Standard wooden flush door'),
('Panel Door 6x3 ft', 'fixtures', 30.00, 'piece', false, true, true, 50.00, 'Wooden panel door'),
('Aluminum Window Frame 4x4 ft', 'fixtures', 18.00, 'piece', false, true, true, 40.00, 'Powder coated aluminum window frame');

-- =============================================
-- CONFIGURATION DATA
-- =============================================

-- Create a settings table for system-wide configuration
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default pricing settings
INSERT INTO system_settings (key, value, description) VALUES
('base_fee_amount', '500', 'Base fee for first 5km (KES)'),
('base_fee_distance_km', '5', 'Distance covered by base fee (kilometers)'),
('cost_per_km', '50', 'Cost per kilometer after base distance (KES)'),
('platform_markup_percentage', '20', 'Platform markup percentage'),
('max_vehicle_capacity_kg', '2000', 'Maximum vehicle capacity in kg'),
('overweight_tolerance_kg', '50', 'Tolerance before blocking overweight loads (kg)'),
('driver_commission_percentage', '70', 'Driver commission percentage of total fare');
