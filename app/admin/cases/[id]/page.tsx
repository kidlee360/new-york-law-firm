
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Scale, 
  User, 
  Calendar, 
  FileText, 
  ArrowLeft, 
  Download,
  DollarSign,
  Briefcase,
  Save,
  Trash2
} from "lucide-react";
import { updateCase, deleteCase } from './form/actions';
import React, { Suspense } from 'react';

async function getCaseDetails(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('cases')
    .select(`
      *,
      parties (*),
      assets (*),
      deadlines (*)
    `)
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data;
}

async function CaseContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caseData = await getCaseDetails(id);

  if (!caseData) {
    notFound();
  }

  const updateAction = updateCase.bind(null, id);
  const deleteAction = deleteCase.bind(null, id);

  const client = caseData.parties?.find((p: any) => p.is_client);
  const adverseParty = caseData.parties?.find((p: any) => !p.is_client);

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
        {/* Top Navigation Bar */}
        <div className="bg-white border-b border-slate-200 px-8 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link href="/admin/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </Link>
            <div className="flex gap-3">
              <button 
                type="submit" 
                form="case-form"
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
              <button 
                formAction={deleteAction}
                form="case-form"
                className="flex items-center gap-2 bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
              <Link 
                href={`/admin/newCaseSheet/pdfDownload?case_number=${caseData.case_number}`}
                className="flex items-center gap-2 bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Generate Documents
              </Link>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-8 py-8">
          <form id="case-form" action={updateAction} className="space-y-8">
          {/* Case Header */}
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <select 
                  name="status"
                  defaultValue={caseData.status}
                  className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded uppercase border-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="intake">Intake</option>
                  <option value="pending">Pending</option>
                  <option value="discovery">Discovery</option>
                  <option value="trial">Trial</option>
                  <option value="closed">Closed</option>
                </select>
                <input 
                  name="case_number"
                  defaultValue={caseData.case_number}
                  className="text-slate-400 font-mono text-sm bg-transparent border-none p-0 focus:ring-0 w-32"
                />
              </div>
              <h1 className="text-3xl font-bold text-slate-900">
                {client?.first_name} {client?.last_name} v. {adverseParty?.last_name || 'Defendant'}
              </h1>
              <div className="flex items-center gap-1 text-slate-500 mt-1">
                <span>Grounds: NY DRL §</span>
                <input name="grounds" defaultValue={caseData.grounds} className="bg-transparent border-none p-0 focus:ring-0 font-medium text-slate-700 w-24" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Financial Summary Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-semibold flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-slate-400" />
                    Financial Guidelines
                  </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 uppercase font-bold">Maintenance (Annual)</p>
                    <div className="flex items-center text-2xl font-bold text-slate-900">
                      <span>$</span>
                      <input 
                        name="maintenance_guideline"
                        type="number"
                        step="0.01"
                        defaultValue={caseData.maintenance_guideline}
                        className="bg-transparent border-none p-0 focus:ring-0 font-bold w-full"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 uppercase font-bold">Child Support (Annual)</p>
                    <div className="flex items-center text-2xl font-bold text-slate-900">
                      <span>$</span>
                      <input 
                        name="child_support_guideline"
                        type="number"
                        step="0.01"
                        defaultValue={caseData.child_support_guideline}
                        className="bg-transparent border-none p-0 focus:ring-0 font-bold w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Assets Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="font-semibold">Marital Property Registry</h3>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
                    <tr>
                      <th className="px-6 py-3">Asset Type</th>
                      <th className="px-6 py-3">Description</th>
                      <th className="px-6 py-3 text-right">Est. Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {caseData.assets?.map((asset: any) => (
                      <tr key={asset.id}>
                        <td className="px-6 py-4 text-sm capitalize">{asset.asset_type.replace('_', ' ')}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{asset.description}</td>
                        <td className="px-6 py-4 text-sm text-right font-medium">
                          ${Number(asset.estimated_value).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Sidebar */}
            <div className="space-y-6">
              <div className="bg-slate-900 text-white rounded-xl p-6 shadow-lg">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Case Timeline</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Case Opened</p>
                      <p className="text-xs text-slate-400">{new Date(caseData.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {caseData.date_filed && (
                    <div className="flex gap-3">
                      <div className="mt-1.5 h-2 w-2 rounded-full bg-blue-400 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Summons Filed</p>
                        <p className="text-xs text-slate-400">{new Date(caseData.date_filed).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          </form>
        </main>
      </div>
  );
}

export default function CaseViewPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 pb-12 flex items-center justify-center">
      <div className="text-slate-500">Loading case details...</div>
    </div>}>
      <CaseContent params={params} />
    </Suspense>
  );
}