"use client";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

// 1. Define the "Props" type so TypeScript knows what onChange is
interface AssetTrackerProps {
  onChange: (assets: any[]) => void;
}

// 2. Pass those props into the function
export function AssetTracker({ onChange }: AssetTrackerProps) {
  const [assets, setAssets] = useState([{ type: 'real_estate', desc: '', value: 0 }]);

  const updateAsset = (index: number, field: string, value: any) => {
    const newAssets = [...assets];
    
    // Ensure value is a number if we are updating the 'value' field
    const processedValue = field === 'value' ? parseFloat(value) || 0 : value;
    
    newAssets[index] = { ...newAssets[index], [field]: processedValue };
    
    setAssets(newAssets);
    
    // 3. This will no longer be red because it's defined in the arguments above
    onChange(newAssets); 
  };

  const addAsset = () => {
    const newAssets = [...assets, { type: 'bank_account', desc: '', value: 0 }];
    setAssets(newAssets);
    onChange(newAssets);
  };

  const removeAsset = (index: number) => {
    const newAssets = assets.filter((_, i) => i !== index);
    setAssets(newAssets);
    onChange(newAssets);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold uppercase tracking-tight text-slate-500">Marital Assets</h3>
        <button 
          onClick={addAsset}
          type="button" // Important to prevent form submission
          className="text-xs flex items-center gap-1 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200"
        >
          <Plus className="h-3 w-3" /> Add Asset
        </button>
      </div>

      {assets.map((asset, index) => (
        <div key={index} className="flex gap-2 items-start bg-slate-50 p-3 rounded-lg border border-slate-200">
          <select 
            value={asset.type}
            onChange={(e) => updateAsset(index, 'type', e.target.value)}
            className="text-sm border rounded p-1 bg-white"
          >
            <option value="real_estate">🏠 Real Estate</option>
            <option value="bank_account">💰 Bank/Brokerage</option>
            <option value="vehicle">🚗 Vehicle</option>
            <option value="retirement">📈 Retirement/401k</option>
          </select>
          
          <input 
            value={asset.desc}
            onChange={(e) => updateAsset(index, 'desc', e.target.value)}
            placeholder="Description" 
            className="flex-1 text-sm border rounded p-1"
          />

          <div className="relative">
            <span className="absolute left-2 top-1.5 text-slate-400 text-sm">$</span>
            <input 
              type="number" 
              value={asset.value}
              onChange={(e) => updateAsset(index, 'value', e.target.value)}
              className="w-24 text-sm border rounded p-1 pl-5"
            />
          </div>

          <button 
            type="button"
            onClick={() => removeAsset(index)}
            className="text-slate-400 hover:text-red-500 pt-1"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}