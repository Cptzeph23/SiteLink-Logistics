'use client';

import { useState, useEffect } from 'react';
import { MaterialSelector } from '@/components/client/MaterialSelector';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { Material } from '@/types';

export default function TestMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<
    Array<{ material_id: string; quantity: number }>
  >([{ material_id: '', quantity: 1 }]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMaterials() {
      try {
        const response = await fetch('/api/materials');
        const data = await response.json();
        setMaterials(data.materials || []);
      } catch (error) {
        console.error('Error fetching materials:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMaterials();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading materials..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Material Selector Test
          </h1>
          <p className="text-slate-600">
            Testing the material selection component with real data from Supabase
          </p>
        </div>

        <MaterialSelector
          materials={materials}
          selectedMaterials={selectedMaterials}
          onMaterialsChange={setSelectedMaterials}
          showWeight={true}
        />

        <div className="mt-8 p-6 bg-white border rounded-lg">
          <h2 className="font-semibold mb-4">Selected Data (JSON):</h2>
          <pre className="bg-slate-50 p-4 rounded text-xs overflow-auto">
            {JSON.stringify(selectedMaterials, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}