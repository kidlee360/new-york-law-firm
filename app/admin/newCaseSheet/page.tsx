"use client";

import { useState, useCallback } from "react";
import { performConflictCheck } from "./queries";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { calculateServiceDeadline } from "./utils";
import { toast } from "sonner";
import { createNewNYCase, saveCaseAssets } from "./queries";
import { AssetTracker } from "@/components/intake/assetTracker";
import { ChildSupportCalculator } from "@/components/intake/childSupportCalculator";
import { MaintenanceCalculator } from "@/components/intake/maintenanceCalculator";
import { MaintenanceCalculation } from "@/utils/nyCalculations2026";
import { ChildSupportCalculation } from "@/utils/childSupport2026";
import Link from "next/link";

type ConflictResult = {
  hasConflict: boolean;
  matches: any[];
  error: any;
};

export default function NewCaseSheet() {
  const [conflict, setConflict] = useState<ConflictResult | null>(null);
  const [dateFiled, setDateFiled] = useState("");
  const [deadlinePreview, setDeadlinePreview] = useState("");
  const [selectedGrounds, setSelectedGrounds] = useState("170.7");
  const [assets, setAssets] = useState<any[]>([]);
  const [financials, setFinancials] = useState({
    maintenance: null as MaintenanceCalculation | null,
    childSupport: null as ChildSupportCalculation | null,
    custodialIncome: 0,
    nonCustodialIncome: 0,
    numChildren: 1
  });

  // Stable handlers to prevent infinite re-render loops in estimators
  const handleMaintenanceCalc = useCallback((res: MaintenanceCalculation) => {
    setFinancials(prev => ({ ...prev, maintenance: res }));
  }, []);

  const handleChildSupportCalc = useCallback((
    res: ChildSupportCalculation, 
    cust: number, 
    nonCust: number, 
    count: number
  ) => {
    setFinancials(prev => ({
      ...prev,
      childSupport: res,
      custodialIncome: cust,
      nonCustodialIncome: nonCust,
      numChildren: count
    }));
  }, []);

  const handleNameSearch = async (name: string) => {
    if (name.length > 3) {
      const result = await performConflictCheck(name);
      setConflict(result);
    } else {
      setConflict(null);
    }
  };

  const handleDateChange = (date: string) => {
    setDateFiled(date);
    if (date) {
      const deadline = calculateServiceDeadline(date);
      setDeadlinePreview(deadline);
    }
  };

  const handleSaveCase = async () => {
    try {
      const caseData = {
        case_number: `MAT-${Date.now().toString().slice(-6)}`,
        grounds: selectedGrounds,
        status: 'intake',
        maintenance_guideline: financials.maintenance?.annual,
        child_support_guideline: financials.childSupport?.annual,
        custodial_income: financials.custodialIncome,
        non_custodial_income: financials.nonCustodialIncome,
        children_count: financials.numChildren,
        date_filed: dateFiled || null
      };

      const newCase = await createNewNYCase(caseData, deadlinePreview);

      if (assets.length > 0) {
        await saveCaseAssets(newCase.id, assets);
      }

      toast.success("Case file created successfully.");

      toast.error("Action Required: Automatic Orders", {
        description: "Under NY DRL §236, the plaintiff is now bound by Automatic Orders. You must serve the notice on the defendant immediately.",
        duration: 10000,
        action: {
          label: "Download Notice",
          onClick: () => window.open(`/admin/newCaseSheet/pdfDownload?case_number=${newCase.case_number}`, '_blank'),
        },
      });

    } catch (error) {
      toast.error("Failed to create case. Please check database logs.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <Link href="/admin/dashboard" className="hover:underline">Dashboard</Link>
              <span>/</span>
              <span className="text-slate-900">New Case</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Intake: New Matrimonial Matter</h1>
            <p className="text-slate-500 mt-1">Create a new divorce case file with client and adverse party information.</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-8 py-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 space-y-8">
            {/* Section 1: Adverse Party (Conflict Check First!) */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">Adverse Party (Spouse) Name</label>
              <input
                className="w-full border border-slate-300 p-3 rounded-lg"
                placeholder="Full Name"
                onChange={(e) => handleNameSearch(e.target.value)}
              />
              {conflict?.hasConflict && (
                <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Conflict Warning:</strong> {conflict.matches[0].full_name} was found in Case #{conflict.matches[0].case_id.slice(0,8)}.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Section 2: Grounds */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">Grounds for Divorce (NY DRL §170)</label>
              <select className="w-full border border-slate-300 p-3 rounded-lg bg-white"
                value={selectedGrounds}
                onChange={(e) => setSelectedGrounds(e.target.value)}
              >
                <option value="170.7">Irretrievable Breakdown (No-fault)</option>
                <option value="170.1">Cruel and Inhuman Treatment</option>
                <option value="170.2">Abandonment (1 Year+)</option>
                <option value="170.3">Imprisonment (3 Years+)</option>
              </select>
            </div>

            {/* Section 3: Date Filed */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">Date Filed (Summons with Notice)</label>
              <input
                type="date"
                className="w-full border border-slate-300 p-3 rounded-lg"
                onChange={(e) => handleDateChange(e.target.value)}
              />
              {deadlinePreview && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800 font-semibold uppercase tracking-wider">
                    CPLR 306-b Deadline
                  </p>
                  <p className="text-lg font-bold text-amber-900 mt-1">
                    {new Date(deadlinePreview).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric'
                    })}</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Service must be completed and affidavit filed by this date.
                  </p>
                </div>
              )}
            </div>

            {/* Section 4: Marital Assets */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">Marital Assets</label>
              <AssetTracker onChange={(data) => setAssets(data)} />
            </div>

            {/* Section 5: Financial Estimators */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">Maintenance Estimator</label>
              <MaintenanceCalculator onCalculate={handleMaintenanceCalc} />
              <label className="text-sm font-semibold text-slate-700">Child Support Estimator (CSSA)</label>
              <ChildSupportCalculator onCalculate={handleChildSupportCalc} />
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-200">
              <button
                disabled={conflict?.hasConflict}
                className="w-full bg-slate-900 text-white py-4 rounded-lg font-semibold disabled:bg-slate-300 hover:bg-slate-800 transition-colors"
                onClick={handleSaveCase}
              >
                Open Case File
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}