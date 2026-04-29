"use client";
import { useState, useEffect } from 'react';
import { calculateMaintenance, MaintenanceCalculation } from '@/utils/nyCalculations2026';

interface MaintenanceCalculatorProps {
  onCalculate?: (result: MaintenanceCalculation, payor: number, payee: number) => void;
}

export function MaintenanceCalculator({ onCalculate }: MaintenanceCalculatorProps) {
  const [incomes, setIncomes] = useState({ payor: 0, payee: 0 });
  const [result, setResult] = useState<MaintenanceCalculation | null>(null);

  useEffect(() => {
    if (incomes.payor > 0) {
      const calc = calculateMaintenance(incomes.payor, incomes.payee);
      setResult(calc);
      onCalculate?.(calc, incomes.payor, incomes.payee);
    }
  }, [incomes, onCalculate]);

  return (
    <div className="p-6 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-700 mb-4">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        ⚖️ 2026 Maintenance Estimator (Alimony)
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-xs text-slate-400 uppercase font-bold">Payor Annual Income</label>
          <input 
            type="number" 
            onChange={(e) => setIncomes({...incomes, payor: Number(e.target.value)})}
            className="w-full bg-slate-800 border-slate-700 rounded p-2 mt-1"
            placeholder="0"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 uppercase font-bold">Payee Annual Income</label>
          <input 
            type="number" 
            onChange={(e) => setIncomes({...incomes, payee: Number(e.target.value)})}
            className="w-full bg-slate-800 border-slate-700 rounded p-2 mt-1"
            placeholder="0"
          />
        </div>
      </div>

      {result && (
        <div className="border-t border-slate-700 pt-4 flex justify-between items-end">
          <div>
            <p className="text-xs text-slate-400 font-medium">Guideline Monthly Maintenance</p>
            <p className="text-3xl font-black text-blue-400">
              {result.formatted.split('.')[0]}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 italic">
              {result.isLowIncomeAdjustment ? "*Adjusted for Self-Support Reserve" : "Based on NY statutory formula"}
            </p>
            <p className="text-xs font-bold text-slate-300">Annual: ${result.annual.toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}