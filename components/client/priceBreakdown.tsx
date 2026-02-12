'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Truck } from 'lucide-react';

interface PricingData {
  total_distance_km: number;
  estimated_duration_minutes: number;
  total_weight_kg: number;
  requires_straps: boolean;
  requires_tarp: boolean;
  has_fragile_items: boolean;
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

interface PriceBreakdownProps {
  pricing: PricingData;
}

function formatKES(amount: number): string {
  return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatWeight(kg: number): string {
  return kg >= 1000 ? `${(kg / 1000).toFixed(2)} tonnes` : `${kg.toFixed(0)} kg`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

export function PriceBreakdown({ pricing }: PriceBreakdownProps) {
  const isOverweight = pricing.total_weight_kg > 2000;

  return (
    <Card className="border-2 border-construction-orange">
      <CardHeader className="bg-construction-orange text-white rounded-t-lg pb-4">
        <CardTitle className="flex items-center gap-2 text-white">
          <Truck className="h-5 w-5" />
          Your Quote
        </CardTitle>
        <div className="flex justify-between items-end mt-2">
          <div>
            <p className="text-white/80 text-sm">Total Cost</p>
            <p className="text-4xl font-bold">{formatKES(pricing.total_amount)}</p>
          </div>
          <div className="text-right text-sm text-white/80">
            <p>{pricing.total_distance_km.toFixed(1)} km</p>
            <p>{formatDuration(pricing.estimated_duration_minutes)}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Weight & Requirements */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className={isOverweight ? 'border-red-500 text-red-600' : 'border-green-500 text-green-600'}
          >
            {isOverweight ? '⚠️' : '✓'} {formatWeight(pricing.total_weight_kg)}
          </Badge>
          {pricing.requires_straps && (
            <Badge variant="outline" className="border-yellow-500 text-yellow-700">
              🔗 Straps Required
            </Badge>
          )}
          {pricing.requires_tarp && (
            <Badge variant="outline" className="border-blue-500 text-blue-700">
              🛡️ Tarp Required
            </Badge>
          )}
          {pricing.has_fragile_items && (
            <Badge variant="outline" className="border-orange-500 text-orange-700">
              ⚠️ Fragile Items
            </Badge>
          )}
        </div>

        {/* Price Breakdown */}
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
            Price Breakdown
          </h4>

          {/* Base Fee */}
          <div className="flex justify-between items-start py-2 border-b border-slate-100">
            <div>
              <p className="font-medium text-slate-800">Base Fee</p>
              <p className="text-xs text-slate-500">{pricing.breakdown.base_fee_details}</p>
            </div>
            <span className="font-semibold">{formatKES(pricing.base_fee)}</span>
          </div>

          {/* Distance Fee */}
          <div className="flex justify-between items-start py-2 border-b border-slate-100">
            <div>
              <p className="font-medium text-slate-800">Distance Fee</p>
              <p className="text-xs text-slate-500">{pricing.breakdown.distance_fee_details}</p>
            </div>
            <span className="font-semibold">{formatKES(pricing.distance_fee)}</span>
          </div>

          {/* Handling Fee */}
          {pricing.handling_fee > 0 && (
            <div className="flex justify-between items-start py-2 border-b border-slate-100">
              <div>
                <p className="font-medium text-slate-800">Handling Fee</p>
                <p className="text-xs text-slate-500">{pricing.breakdown.handling_fee_details}</p>
              </div>
              <span className="font-semibold">{formatKES(pricing.handling_fee)}</span>
            </div>
          )}

          {/* Subtotal */}
          <div className="flex justify-between items-center py-2 border-b border-slate-200">
            <span className="text-slate-600">Subtotal</span>
            <span className="font-semibold">{formatKES(pricing.subtotal)}</span>
          </div>

          {/* Platform Fee */}
          <div className="flex justify-between items-start py-2 border-b border-slate-100">
            <div>
              <p className="font-medium text-slate-800">Platform Fee (20%)</p>
              <p className="text-xs text-slate-500">{pricing.breakdown.platform_fee_details}</p>
            </div>
            <span className="font-semibold">{formatKES(pricing.platform_fee)}</span>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center py-3 bg-slate-50 rounded-lg px-3">
            <span className="font-bold text-lg">Total</span>
            <span className="font-bold text-xl text-construction-orange">
              {formatKES(pricing.total_amount)}
            </span>
          </div>
        </div>

        {/* Info note */}
        <div className="flex gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
          <p>
            Payment via M-Pesa upon delivery. Price may vary slightly based on actual route conditions.
          </p>
        </div>

        {/* Overweight Warning */}
        {isOverweight && (
          <div className="flex gap-2 text-sm text-yellow-800 bg-yellow-50 border border-yellow-300 p-3 rounded-lg">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              Load exceeds 2,000kg capacity. You must acknowledge this overload to proceed.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}