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
  const [clientName, setClientName] = useState("");
  const [clientAddress1, setClientAddress1] = useState("");
  const [clientAddress2, setClientAddress2] = useState("");
  const [clientCity, setClientCity] = useState("");
  const [clientState, setClientState] = useState("");
  const [clientZip, setClientZip] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [spouseName, setSpouseName] = useState("");
  const [spouseAddress1, setSpouseAddress1] = useState("");
  const [spouseAddress2, setSpouseAddress2] = useState("");
  const [spouseCity, setSpouseCity] = useState("");
  const [spouseState, setSpouseState] = useState("");
  const [spouseZip, setSpouseZip] = useState("");
  const [spousePhone, setSpousePhone] = useState("");
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
        date_filed: dateFiled || null,
      };

      const clientPartyData = {
        first_name: clientName.split(' ')[0] || clientName,
        last_name: clientName.split(' ').slice(1).join(' ') || '',
        phone: clientPhone,
        address_line_1: clientAddress1,
        address_line_2: clientAddress2,
        city: clientCity,
        state: clientState,
        zip_code: clientZip,
        is_client: true,
        role: 'plaintiff', // Assuming client is always plaintiff
      };

      const spousePartyData = {
        first_name: spouseName.split(' ')[0] || spouseName,
        last_name: spouseName.split(' ').slice(1).join(' ') || '',
        phone: spousePhone,
        address_line_1: spouseAddress1,
        address_line_2: spouseAddress2,
        city: spouseCity,
        state: spouseState,
        zip_code: spouseZip,
        is_client: false,
        role: 'defendant', // Assuming spouse is always defendant
      };

      const newCase = await createNewNYCase(caseData, deadlinePreview, clientPartyData, spousePartyData);

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
            {/* Section 1: Parties Information */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700">Client Full Name</label>
                  <input
                    className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="First & Last Name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700">Adverse Party (Spouse) Name</label>
                  <input
                    className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="First & Last Name"
                    value={spouseName}
                    onChange={(e) => {
                      setSpouseName(e.target.value);
                      handleNameSearch(e.target.value);
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700">Client Phone Number</label>
                  <input
                    type="tel"
                    className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="(555) 555-5555"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700">Spouse Phone Number</label>
                  <input
                    type="tel"
                    className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="(555) 555-5555"
                    value={spousePhone}
                    onChange={(e) => setSpousePhone(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700">Client Address Line 1</label>
                  <input type="text" className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Street Address" value={clientAddress1} onChange={(e) => setClientAddress1(e.target.value)} />
                  <label className="text-sm font-semibold text-slate-700">Client Address Line 2 (Optional)</label>
                  <input type="text" className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Apt, Suite, etc." value={clientAddress2} onChange={(e) => setClientAddress2(e.target.value)} />
                  <div className="grid grid-cols-3 gap-3">
                    <input type="text" className="col-span-2 border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="City" value={clientCity} onChange={(e) => setClientCity(e.target.value)} />
                    <input type="text" className="border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="State" value={clientState} onChange={(e) => setClientState(e.target.value)} />
                  </div>
                  <input type="text" className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Zip Code" value={clientZip} onChange={(e) => setClientZip(e.target.value)} />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700">Spouse Address Line 1</label>
                  <input type="text" className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Street Address" value={spouseAddress1} onChange={(e) => setSpouseAddress1(e.target.value)} />
                  <label className="text-sm font-semibold text-slate-700">Spouse Address Line 2 (Optional)</label>
                  <input type="text" className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Apt, Suite, etc." value={spouseAddress2} onChange={(e) => setSpouseAddress2(e.target.value)} />
                  <div className="grid grid-cols-3 gap-3">
                    <input type="text" className="col-span-2 border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="City" value={spouseCity} onChange={(e) => setSpouseCity(e.target.value)} />
                    <input type="text" className="border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="State" value={spouseState} onChange={(e) => setSpouseState(e.target.value)} />
                  </div>
                  <input type="text" className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Zip Code" value={spouseZip} onChange={(e) => setSpouseZip(e.target.value)} />
                </div>
              </div>

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