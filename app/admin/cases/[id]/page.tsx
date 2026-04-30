
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
  CheckCircle2,
  Trash2,
  Plus,
  MessageSquare,
  PlusCircle,
  FileIcon,
  FolderOpen,
  Receipt
} from "lucide-react";
import { updateCase, deleteCase, updateDeadlineStatus, addAsset, addNote, uploadDocument, deleteDocument, deleteAsset, addExpense, deleteExpense } from './form/actions';
import FileUploadClient from './file-upload-client';
import React, { Suspense } from 'react';

async function getCaseDetails(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('cases')
    .select(`
      *,
      parties (*),
      assets (*),
      deadlines (*),
      notes (*, profiles:user_id(full_name)),
      documents (*, profiles:uploaded_by(full_name)),
      expenses (*)
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
  const addAssetAction = addAsset.bind(null, id);
  const addNoteAction = addNote.bind(null, id);
  const deleteAssetAction = deleteAsset.bind(null, id);
  const addExpenseAction = addExpense.bind(null, id);
  const deleteExpenseAction = deleteExpense.bind(null, id);
  const uploadDocAction = uploadDocument.bind(null, id);

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
                      <th className="px-6 py-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {caseData.assets?.map((asset: any) => (
                      <tr key={asset.id}>
                        <td className="px-6 py-4 text-sm capitalize">
                          <input type="hidden" name={`assets[${asset.id}][id]`} value={asset.id} />
                          <select
                            name={`assets[${asset.id}][asset_type]`}
                            defaultValue={asset.asset_type}
                            className="bg-transparent border-none p-0 focus:ring-0 w-full"
                          >
                            <option value="real_estate">Real Estate</option>
                            <option value="bank_account">Bank Account</option>
                            <option value="investment">Investment</option>
                            <option value="retirement">Retirement</option>
                            <option value="vehicle">Vehicle</option>
                            <option value="other">Other</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          <input
                            name={`assets[${asset.id}][description]`}
                            defaultValue={asset.description}
                            className="bg-transparent border-none p-0 focus:ring-0 w-full"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-medium">
                          <div className="flex items-center justify-end">
                            <span>$</span>
                            <input
                              name={`assets[${asset.id}][estimated_value]`}
                              type="number"
                              step="0.01"
                              defaultValue={asset.estimated_value}
                              className="bg-transparent border-none p-0 focus:ring-0 font-medium text-right w-24"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            formAction={deleteAssetAction.bind(null, asset.id)}
                            className="text-slate-300 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {/* Quick Add Asset Row */}
                    <tr className="bg-blue-50/30">
                      <td className="px-6 py-3">
                        <select name="new_asset_type" className="bg-transparent border-dashed border-slate-300 rounded text-sm w-full focus:ring-blue-500">
                          <option value="real_estate">Real Estate</option>
                          <option value="bank_account">Bank Account</option>
                          <option value="investment">Investment</option>
                          <option value="retirement">Retirement</option>
                          <option value="other">Other</option>
                        </select>
                      </td>
                      <td className="px-6 py-3">
                        <input name="new_description" placeholder="New asset description..." className="bg-transparent border-dashed border-slate-300 rounded text-sm w-full" />
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-sm">$</span>
                          <input name="new_value" type="number" placeholder="0.00" className="bg-transparent border-dashed border-slate-300 rounded text-sm w-24 text-right" />
                          <button 
                            formAction={addAssetAction}
                            className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Expenses Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-slate-400" />
                    Monthly Expenses (Net Worth Statement Prep)
                  </h3>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
                    <tr>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Description</th>
                      <th className="px-6 py-3 text-right">Amount</th>
                      <th className="px-6 py-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {caseData.expenses?.map((exp: any) => (
                      <tr key={exp.id}>
                        <td className="px-6 py-4 text-sm">
                          <input 
                            name={`expenses[${exp.id}][category]`}
                            defaultValue={exp.category}
                            className="bg-transparent border-none p-0 focus:ring-0 w-full"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          <input 
                            name={`expenses[${exp.id}][description]`}
                            defaultValue={exp.description}
                            className="bg-transparent border-none p-0 focus:ring-0 w-full"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-medium">
                          <div className="flex items-center justify-end">
                            <span>$</span>
                            <input 
                              name={`expenses[${exp.id}][amount]`}
                              type="number"
                              step="0.01"
                              defaultValue={exp.amount}
                              className="bg-transparent border-none p-0 focus:ring-0 font-medium text-right w-20"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button formAction={deleteExpenseAction.bind(null, exp.id)} className="text-slate-300 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-50/30">
                      <td className="px-6 py-3">
                        <select name="new_exp_category" className="bg-transparent border-dashed border-slate-300 rounded text-sm w-full">
                          <option value="Housing">Housing</option>
                          <option value="Utilities">Utilities</option>
                          <option value="Food">Food</option>
                          <option value="Clothing">Clothing</option>
                          <option value="Medical">Medical</option>
                          <option value="Insurance">Insurance</option>
                          <option value="Other">Other</option>
                        </select>
                      </td>
                      <td className="px-6 py-3">
                        <input name="new_exp_description" placeholder="e.g. Electric Bill" className="bg-transparent border-dashed border-slate-300 rounded text-sm w-full" />
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <input name="new_exp_amount" type="number" placeholder="0.00" className="bg-transparent border-dashed border-slate-300 rounded text-sm w-20 text-right" />
                          <button formAction={addExpenseAction} className="p-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Deadlines Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="font-semibold">Case Deadlines</h3>
              </div>
              <div className="p-6 space-y-4">
                {caseData.deadlines?.map((deadline: any) => {
                  const markAsCompleteAction = updateDeadlineStatus.bind(null, id, deadline.id, true);
                  return (
                    <div key={deadline.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${deadline.completed ? 'bg-slate-300' : 'bg-amber-500'}`} />
                        <div>
                          <p className={`text-sm font-medium ${deadline.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{deadline.title}</p>
                          <p className="text-xs text-slate-500 italic">Due: {new Date(deadline.due_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {!deadline.completed && (
                        <form action={markAsCompleteAction}>
                          <button type="submit" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Complete
                          </button>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Discovery Repository / Document Management */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-semibold flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-slate-400" />
                  Discovery Repository
                </h3>
                <div className="flex gap-2">
                  <select name="category" className="text-xs border-slate-200 rounded-md py-1 bg-white">
                    <option value="Discovery">Discovery</option>
                    <option value="Pleading">Pleading</option>
                    <option value="Financial">Financial</option>
                    <option value="Correspondence">Correspondence</option>
                  </select>
                  <FileUploadClient uploadAction={uploadDocAction} />
                </div>
              </div>
              <div className="p-0">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-[10px] uppercase text-slate-400 font-bold border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-2">Document Name</th>
                      <th className="px-6 py-2 text-center">Category</th>
                      <th className="px-6 py-2 text-right">Size / Date</th>
                      <th className="px-6 py-2 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {caseData.documents?.map((doc: any) => (
                      <tr key={doc.id} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <FileIcon className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium text-slate-700">{doc.file_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">{doc.category}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-xs text-slate-900 font-medium">{(doc.file_size / 1024 / 1024).toFixed(2)} MB</div>
                          <div className="text-[10px] text-slate-400">{new Date(doc.created_at).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button formAction={deleteDocument.bind(null, id, doc.id, doc.file_path)} className="text-slate-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!caseData.documents?.length && (
                  <div className="py-12 text-center text-slate-400 text-sm italic">No documents uploaded yet.</div>
                )}
              </div>
            </div>

            {/* Case Notes Section */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-slate-400" />
                  Case Notes & Activity
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex gap-4">
                  <textarea 
                    name="note_content"
                    placeholder="Add a case update or strategy note..."
                    className="flex-1 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  />
                  <button formAction={addNoteAction} className="bg-slate-100 text-slate-700 px-4 rounded-lg hover:bg-slate-200 transition-colors self-end h-10 flex items-center gap-2 text-sm font-medium">
                    <PlusCircle className="h-4 w-4" />
                    Post Note
                  </button>
                </div>
                <div className="space-y-4 border-t border-slate-50 pt-4">
                  {caseData.notes?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((note: any) => (
                    <div key={note.id} className="bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-blue-600 uppercase">
                          {note.profiles?.full_name || 'Attorney'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">
                          {new Date(note.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-800 leading-relaxed">{note.content}</p>
                    </div>
                  ))}
                </div>
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