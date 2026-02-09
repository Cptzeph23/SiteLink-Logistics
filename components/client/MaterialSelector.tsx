'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { Material } from '@/types';
import { formatWeight } from '@/lib/utils/formatters';
import { VEHICLE_CONSTRAINTS } from '@/lib/utils/constants';

interface SelectedMaterial {
  material_id: string;
  quantity: number;
}

interface MaterialSelectorProps {
  materials: Material[];
  selectedMaterials: SelectedMaterial[];
  onMaterialsChange: (materials: SelectedMaterial[]) => void;
  showWeight?: boolean;
}

export function MaterialSelector({
  materials,
  selectedMaterials,
  onMaterialsChange,
  showWeight = true,
}: MaterialSelectorProps) {
  const [totalWeight, setTotalWeight] = useState(0);

  // Calculate total weight whenever selections change
  useEffect(() => {
    const weight = selectedMaterials.reduce((total, selected) => {
      const material = materials.find((m) => m.id === selected.material_id);
      if (material) {
        return total + material.unit_weight_kg * selected.quantity;
      }
      return total;
    }, 0);
    setTotalWeight(weight);
  }, [selectedMaterials, materials]);

  const addMaterial = () => {
    onMaterialsChange([
      ...selectedMaterials,
      { material_id: '', quantity: 1 },
    ]);
  };

  const removeMaterial = (index: number) => {
    onMaterialsChange(selectedMaterials.filter((_, i) => i !== index));
  };

  const updateMaterial = (index: number, field: keyof SelectedMaterial, value: string | number) => {
    const updated = [...selectedMaterials];
    updated[index] = { ...updated[index], [field]: value };
    onMaterialsChange(updated);
  };

  const getAvailableMaterials = (currentIndex: number) => {
    const selectedIds = selectedMaterials
      .map((m, i) => (i !== currentIndex ? m.material_id : null))
      .filter(Boolean);
    return materials.filter((m) => !selectedIds.includes(m.id));
  };

  const getWeightStatus = () => {
    if (totalWeight > VEHICLE_CONSTRAINTS.MAX_CAPACITY_KG + VEHICLE_CONSTRAINTS.OVERWEIGHT_BLOCK_KG) {
      return { status: 'blocked', color: 'text-red-600', bg: 'bg-red-50 border-red-500' };
    }
    if (totalWeight > VEHICLE_CONSTRAINTS.MAX_CAPACITY_KG) {
      return { status: 'warning', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-500' };
    }
    return { status: 'ok', color: 'text-green-600', bg: 'bg-green-50 border-green-500' };
  };

  const weightStatus = getWeightStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Materials</CardTitle>
        <CardDescription>
          Choose the construction materials you need to transport
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedMaterials.map((selected, index) => {
          const material = materials.find((m) => m.id === selected.material_id);
          const availableMaterials = getAvailableMaterials(index);

          return (
            <div key={index} className="flex gap-4 items-end p-4 border rounded-lg bg-slate-50">
              <div className="flex-1 space-y-2">
                <Label>Material</Label>
                <Select
                  value={selected.material_id}
                  onValueChange={(value) => updateMaterial(index, 'material_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMaterials.map((mat) => (
                      <SelectItem key={mat.id} value={mat.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{mat.name}</span>
                          <span className="text-xs text-slate-500 ml-4">
                            {formatWeight(mat.unit_weight_kg)}/{mat.unit_type}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {material && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {material.requires_straps && (
                      <Badge variant="outline" className="text-xs">
                        Requires Straps
                      </Badge>
                    )}
                    {material.requires_tarp && (
                      <Badge variant="outline" className="text-xs">
                        Requires Tarp
                      </Badge>
                    )}
                    {material.is_fragile && (
                      <Badge variant="outline" className="text-xs text-yellow-600">
                        Fragile
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <div className="w-32 space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={selected.quantity}
                  onChange={(e) =>
                    updateMaterial(index, 'quantity', parseInt(e.target.value) || 1)
                  }
                  className="h-10"
                />
              </div>

              {material && (
                <div className="w-32 space-y-2">
                  <Label className="text-xs">Total Weight</Label>
                  <div className="h-10 flex items-center px-3 border rounded-md bg-white text-sm font-medium">
                    {formatWeight(material.unit_weight_kg * selected.quantity)}
                  </div>
                </div>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeMaterial(index)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}

        <Button
          variant="outline"
          onClick={addMaterial}
          className="w-full"
          disabled={selectedMaterials.length >= 20}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Material
        </Button>

        {/* Weight Summary */}
        {showWeight && selectedMaterials.length > 0 && (
          <div className={`p-4 border-2 rounded-lg ${weightStatus.bg}`}>
            <div className="flex items-start gap-3">
              {weightStatus.status !== 'ok' && (
                <AlertTriangle className={`h-5 w-5 mt-0.5 ${weightStatus.color}`} />
              )}
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Weight:</span>
                  <span className={`text-lg font-bold ${weightStatus.color}`}>
                    {formatWeight(totalWeight)}
                  </span>
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  Vehicle Capacity: {formatWeight(VEHICLE_CONSTRAINTS.MAX_CAPACITY_KG)}
                </div>

                {weightStatus.status === 'blocked' && (
                  <p className="text-sm text-red-600 font-medium mt-2">
                    ⚠️ This load significantly exceeds vehicle capacity and cannot be transported. 
                    Please reduce the quantity or split into multiple trips.
                  </p>
                )}

                {weightStatus.status === 'warning' && (
                  <p className="text-sm text-yellow-700 font-medium mt-2">
                    ⚠️ This load exceeds the recommended capacity by{' '}
                    {formatWeight(totalWeight - VEHICLE_CONSTRAINTS.MAX_CAPACITY_KG)}.
                    You will need to acknowledge this overload before proceeding.
                  </p>
                )}

                {weightStatus.status === 'ok' && (
                  <p className="text-sm text-green-600 font-medium mt-2">
                    ✓ Load is within safe capacity limits
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}