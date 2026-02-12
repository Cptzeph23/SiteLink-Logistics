import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const PRICING = {
  BASE_FEE: 500,           // KES - covers first 5km
  BASE_DISTANCE_KM: 5,     // km covered by base fee
  COST_PER_KM: 50,         // KES per km after base
  MARKUP_PERCENTAGE: 20,   // Platform markup %
};

/**
 * POST /api/pricing/calculate
 * Calculates job price based on distance and materials
 *
 * Body: {
 *   distance_km: number,         -- We accept distance directly (client-calculated)
 *   materials: [{ material_id, quantity }]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { distance_km, materials } = body;

    // Validate inputs
    if (!distance_km || distance_km <= 0) {
      return NextResponse.json(
        { error: 'Valid distance is required' },
        { status: 400 }
      );
    }

    if (!materials || materials.length === 0) {
      return NextResponse.json(
        { error: 'At least one material is required' },
        { status: 400 }
      );
    }

    // Fetch material details from database
    const materialIds = materials.map((m: any) => m.material_id);
    const { data: materialData, error: materialError } = await supabase
      .from('materials')
      .select('id, name, unit_weight_kg, handling_fee_per_unit, requires_straps, requires_tarp, is_fragile')
      .in('id', materialIds);

    if (materialError) {
      return NextResponse.json(
        { error: 'Failed to fetch material data' },
        { status: 500 }
      );
    }

    // Calculate total weight and handling fees
    let totalWeightKg = 0;
    let totalHandlingFee = 0;
    let requiresStraps = false;
    let requiresTarp = false;
    let hasFragileItems = false;
    const materialBreakdown: any[] = [];

    for (const selected of materials) {
      const material = materialData?.find((m: any) => m.id === selected.material_id);
      if (!material) continue;

      const itemWeight = material.unit_weight_kg * selected.quantity;
      const itemHandlingFee = material.handling_fee_per_unit * selected.quantity;

      totalWeightKg += itemWeight;
      totalHandlingFee += itemHandlingFee;

      if (material.requires_straps) requiresStraps = true;
      if (material.requires_tarp) requiresTarp = true;
      if (material.is_fragile) hasFragileItems = true;

      materialBreakdown.push({
        name: material.name,
        quantity: selected.quantity,
        unit_weight_kg: material.unit_weight_kg,
        total_weight_kg: itemWeight,
        handling_fee: itemHandlingFee,
      });
    }

    // =============================================
    // PRICING FORMULA
    // =============================================
    //
    // Step 1: Base fee covers first 5km
    const baseFee = PRICING.BASE_FEE;

    // Step 2: Distance fee for km beyond base distance
    const extraDistanceKm = Math.max(0, distance_km - PRICING.BASE_DISTANCE_KM);
    const distanceFee = extraDistanceKm * PRICING.COST_PER_KM;

    // Step 3: Material handling fees
    const handlingFee = totalHandlingFee;

    // Step 4: Subtotal before markup
    const subtotal = baseFee + distanceFee + handlingFee;

    // Step 5: Platform markup (20%)
    const platformFee = subtotal * (PRICING.MARKUP_PERCENTAGE / 100);

    // Step 6: Total
    const totalAmount = subtotal + platformFee;

    // Build transparent breakdown
    const breakdown = {
      base_fee_details: `Base fee: KSh ${baseFee} (covers first ${PRICING.BASE_DISTANCE_KM}km)`,
      distance_fee_details: distance_km <= PRICING.BASE_DISTANCE_KM
        ? `Distance: ${distance_km.toFixed(1)}km (within base distance)`
        : `Distance: ${distance_km.toFixed(1)}km × KSh ${PRICING.COST_PER_KM}/km after first ${PRICING.BASE_DISTANCE_KM}km = KSh ${distanceFee.toFixed(0)}`,
      handling_fee_details: handlingFee > 0
        ? `Handling fees: KSh ${handlingFee.toFixed(0)} (${materials.length} material type(s))`
        : 'No special handling required',
      platform_fee_details: `Platform fee: ${PRICING.MARKUP_PERCENTAGE}% of KSh ${subtotal.toFixed(0)} = KSh ${platformFee.toFixed(0)}`,
      materials: materialBreakdown,
    };

    return NextResponse.json({
      // Distance info
      total_distance_km: distance_km,
      estimated_duration_minutes: Math.ceil(distance_km * 2.5), // ~2.5 min/km in traffic

      // Weight info
      total_weight_kg: totalWeightKg,
      requires_straps: requiresStraps,
      requires_tarp: requiresTarp,
      has_fragile_items: hasFragileItems,

      // Pricing
      base_fee: baseFee,
      distance_fee: distanceFee,
      handling_fee: handlingFee,
      subtotal: subtotal,
      platform_fee: platformFee,
      total_amount: totalAmount,

      // Transparent breakdown
      breakdown,
    });

  } catch (error) {
    console.error('Pricing calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate pricing' },
      { status: 500 }
    );
  }
}