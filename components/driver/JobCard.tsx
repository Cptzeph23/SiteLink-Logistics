'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin, Package, Weight, Clock,
  ChevronDown, ChevronUp, Loader2,
  AlertTriangle, Truck
} from 'lucide-react';

interface JobCardProps {
  job: any;
  onAccept: (jobId: string) => Promise<void>;
}

function formatKES(amount: number) {
  return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
}

function formatWeight(kg: number) {
  return kg >= 1000 ? `${(kg / 1000).toFixed(2)} tonnes` : `${kg} kg`;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export function JobCard({ job, onAccept }: JobCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [accepting, setAccepting] = useState(false);

  const pickup = job.job_stops?.find((s: any) => s.stop_type === 'pickup');
  const delivery = job.job_stops?.find((s: any) => s.stop_type === 'delivery');
  const isOverweight = job.total_weight_kg > 2000;

  // Driver earns 70% of total
  const driverEarnings = job.total_amount * 0.7;

  async function handleAccept() {
    setAccepting(true);
    try {
      await onAccept(job.id);
    } finally {
      setAccepting(false);
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-construction-orange">
      <CardContent className="p-0">
        {/* Main Info Row */}
        <div className="p-5">
          <div className="flex justify-between items-start gap-4">
            {/* Left: Locations & Info */}
            <div className="flex-1 space-y-3">
              {/* Job number and time */}
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-800 text-sm">{job.job_number}</span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(job.created_at)}
                </span>
              </div>

              {/* Pickup → Delivery */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">P</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{pickup?.address}</p>
                    {pickup?.contact_name && (
                      <p className="text-xs text-slate-400">{pickup.contact_name} · {pickup.contact_phone}</p>
                    )}
                    {pickup?.is_difficult_access && (
                      <p className="text-xs text-yellow-600 flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="h-3 w-3" /> Difficult access
                      </p>
                    )}
                  </div>
                </div>

                {/* Route line */}
                <div className="ml-2.5 w-0.5 h-4 bg-slate-300" />

                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">D</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{delivery?.address}</p>
                    {delivery?.contact_name && (
                      <p className="text-xs text-slate-400">{delivery.contact_name} · {delivery.contact_phone}</p>
                    )}
                    {delivery?.is_difficult_access && (
                      <p className="text-xs text-yellow-600 flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="h-3 w-3" /> Difficult access
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {job.total_distance_km?.toFixed(1)} km
                </span>
                <span className={`flex items-center gap-1 ${isOverweight ? 'text-yellow-600 font-medium' : ''}`}>
                  <Package className="h-3 w-3" />
                  {formatWeight(job.total_weight_kg)}
                  {isOverweight && ' ⚠️'}
                </span>
                {job.requires_straps && (
                  <Badge variant="outline" className="text-xs py-0 h-5">Straps needed</Badge>
                )}
                {job.requires_tarp && (
                  <Badge variant="outline" className="text-xs py-0 h-5">Tarp needed</Badge>
                )}
                {job.has_fragile_items && (
                  <Badge variant="outline" className="text-xs py-0 h-5 border-orange-400 text-orange-600">Fragile</Badge>
                )}
              </div>
            </div>

            {/* Right: Earnings & Action */}
            <div className="flex flex-col items-end gap-3 flex-shrink-0">
              <div className="text-right">
                <p className="text-xs text-slate-400">Your Earnings</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatKES(driverEarnings)}
                </p>
                <p className="text-xs text-slate-400">
                  Total: {formatKES(job.total_amount)}
                </p>
              </div>
              <Button
                className="bg-construction-orange hover:bg-construction-orange/90 text-white w-full"
                onClick={handleAccept}
                disabled={accepting}
              >
                {accepting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Accepting...</>
                ) : (
                  <><Truck className="h-4 w-4 mr-2" /> Accept Job</>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Expandable Materials Section */}
        <button
          className="w-full px-5 py-3 border-t bg-slate-50 flex items-center justify-between text-sm text-slate-600 hover:bg-slate-100 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {job.job_materials?.length || 0} material type(s)
          </span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {expanded && (
          <div className="px-5 py-4 border-t bg-slate-50 space-y-2">
            {job.job_materials?.map((jm: any) => (
              <div key={jm.id} className="flex justify-between text-sm">
                <span className="text-slate-700">
                  {jm.material?.name}
                  <span className="text-slate-400 ml-1">× {jm.quantity}</span>
                </span>
                <span className="text-slate-500">{formatWeight(jm.total_weight_kg)}</span>
              </div>
            ))}
            {job.special_instructions && (
              <div className="mt-3 pt-3 border-t text-xs text-slate-500">
                <span className="font-medium">Note:</span> {job.special_instructions}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}