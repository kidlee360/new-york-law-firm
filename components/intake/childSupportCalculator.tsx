// components/intake/ChildSupportCalculator.tsx
"use client";
import { useState, useEffect } from 'react';
import { calculateNYChildSupport, ChildSupportCalculation } from '@/utils/childSupport2026';

interface ChildSupportCalculatorProps {
  onCalculate?: (result: ChildSupportCalculation, custodial: number, nonCustodial: number, children: number) => void;
}

export function ChildSupportCalculator({ onCalculate }: ChildSupportCalculatorProps) {
  const [incomes, setIncomes] = useState({ custodial: 0, nonCustodial: 0, children: 1 });
  const [result, setResult] = useState<ChildSupportCalculation | null>(null);

  useEffect(() => {
    if (incomes.custodial > 0 || incomes.nonCustodial > 0) {
      const calc = calculateNYChildSupport(incomes.custodial, incomes.nonCustodial, incomes.children);
      setResult(calc);
      onCalculate?.(calc, incomes.custodial, incomes.nonCustodial, incomes.children);
    }
  }, [incomes, onCalculate]);

  return (
    <div className="p-6 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-700">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        📊 2026 Child Support Estimator (CSSA)
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="text-xs text-slate-400 uppercase font-bold">Client Income</label>
          <input 
            type="number" 
            onChange={(e) => setIncomes({...incomes, custodial: Number(e.target.value)})}
            className="w-full bg-slate-800 border-slate-700 rounded p-2 mt-1"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 uppercase font-bold">Spouse Income</label>
          <input 
            type="number" 
            onChange={(e) => setIncomes({...incomes, nonCustodial: Number(e.target.value)})}
            className="w-full bg-slate-800 border-slate-700 rounded p-2 mt-1"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 uppercase font-bold">Children</label>
          <select 
            onChange={(e) => setIncomes({...incomes, children: Number(e.target.value)})}
            className="w-full bg-slate-800 border-slate-700 rounded p-2 mt-1"
          >
            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {result && (
        <div className="border-t border-slate-700 pt-4 flex justify-between items-end">
          <div>
            <p className="text-xs text-slate-400 font-medium">Estimated Monthly Payment</p>
            <p className="text-3xl font-black text-emerald-400">
              ${result.monthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 italic">
              {result.isAboveCap ? "*Income exceeds $193k cap" : "Based on combined pro-rata share"}
            </p>
            <p className="text-xs font-bold text-slate-300">Share: {result.shareRatio}%</p>
          </div>
        </div>
      )}
    </div>
  );
}