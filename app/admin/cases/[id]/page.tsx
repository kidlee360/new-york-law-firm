
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
  Check,
  Briefcase,
  Save,
  CheckCircle2,
  Trash2,
  Plus,
  MessageSquare,
  PlusCircle,
  FolderOpen,
  Receipt,
  Loader2
} from "lucide-react";
import { updateCase, deleteCase, updateDeadlineStatus, addAsset, addNote, uploadDocument, deleteDocument, deleteAsset, addExpense, deleteExpense } from './form/actions';
import { SubmitButton } from './submit-button'; // Import the new SubmitButton
import ConfirmButton from './confirm-button';
import DocumentDownloadButton from './document-download-button';
import FileUploadClient from './file-upload-client';
import React, { Suspense } from 'react';

async function getCaseDetails(id: string) {
  const supabase = await createClient();

  // Fetch current authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/auth/login'); // User not authenticated
  }

  // Fetch user's role from profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching user profile:', profileError);
    redirect('/auth/login'); // Or handle as unauthorized
  }

  const currentUserRole = profile.role;

  const { data: caseDataResult, error: caseError } = await supabase
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

  if (caseError || !caseDataResult) {
    notFound(); // Case not found or other error
  }

  // Security: If user is a client, verify they are a party to this specific case
  if (profile.role === 'client') {
    const isUserInCase = caseDataResult.parties?.some((p: any) => p.email === user.email);
    if (!isUserInCase) {
      redirect('/unauthorized'); // Or a generic portal page
    }
  }

  return { caseData: caseDataResult, currentUserRole, currentUserId: user.id };
}

async function CaseContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { caseData, currentUserRole, currentUserId } = await getCaseDetails(id);

  // Determine permissions based on role
  const isAdmin = currentUserRole === 'admin';
  const isAttorneyOrParalegal = currentUserRole === 'attorney' || currentUserRole === 'paralegal';
  const isClient = currentUserRole === 'client';

  // Simplified permission flags for UI. Server actions will have their own checks.
  const canModifyCaseDetails = isAdmin || isAttorneyOrParalegal;
  const canDeleteCase = isAdmin; // Only admin can delete a whole case
  const canManageAssetsExpensesDocsNotesDeadlines = isAdmin || isAttorneyOrParalegal || currentUserRole === 'paralegal';

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12 transition-colors duration-300">
        {/* Top Navigation Bar */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link href={isClient ? "/client/portal" : "/admin/dashboard"} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </Link>
            <div className="flex gap-3">
              <SubmitButton
                form="case-form"
                icon={<Save className="h-4 w-4" />}
                loadingText="Saving..."
                className="flex items-center gap-2 bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                disabled={!canModifyCaseDetails} // Disable if not allowed to modify
              >
                Save Changes
              </SubmitButton>
              <ConfirmButton 
                action={deleteAction}
                form="case-form"
                confirmMessage="Are you sure you want to delete this entire case? This action cannot be undone."
                className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                loadingText="Deleting Case..."
                loadingIcon={<Loader2 className="h-4 w-4 animate-spin" />}
                disabled={!canDeleteCase} // Only admin can delete
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </ConfirmButton>
              {isClient ? (
                <div 
                  className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed"
                  title="Clients cannot generate documents"
                >
                  <Download className="h-4 w-4" />
                  Generate Documents
                </div>
              ) : (
                <Link 
                  href={`/admin/newCaseSheet/pdfDownload?case_number=${caseData.case_number}`}
                  className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Download className="h-4 w-4" />
                  Generate Documents
                </Link>
              )}
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
                  className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-0.5 rounded uppercase border-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  disabled={!canModifyCaseDetails}
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
                  className="text-slate-400 dark:text-slate-500 font-mono text-sm bg-transparent border-none p-0 focus:ring-0 w-32"
                  readOnly={!canModifyCaseDetails}
                />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {client?.first_name} {client?.last_name} v. {adverseParty?.last_name || 'Defendant'}
              </h1>
              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mt-1">
                <span>Grounds: NY DRL §</span>
                <input 
                  name="grounds" 
                  defaultValue={caseData.grounds} 
                  className="bg-transparent border-none p-0 focus:ring-0 font-medium text-slate-700 dark:text-slate-300 w-24" 
                  readOnly={!canModifyCaseDetails}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Financial Summary Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                  <h3 className="font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <DollarSign className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    Financial Guidelines
                  </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Maintenance (Annual)</p>
                    <div className="flex items-center text-2xl font-bold text-slate-900 dark:text-slate-100">
                      <span>$</span>
                      <input 
                        name="maintenance_guideline"
                        type="number"
                        step="0.01"
                        defaultValue={caseData.maintenance_guideline}
                        className="bg-transparent border-none p-0 focus:ring-0 font-bold w-full"
                        readOnly={!canModifyCaseDetails}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Child Support (Annual)</p>
                    <div className="flex items-center text-2xl font-bold text-slate-900 dark:text-slate-100">
                      <span>$</span>
                      <input 
                        name="child_support_guideline"
                        type="number"
                        step="0.01"
                        defaultValue={caseData.child_support_guideline}
                        className="bg-transparent border-none p-0 focus:ring-0 font-bold w-full"
                        readOnly={!canModifyCaseDetails}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Assets Table */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Marital Property Registry</h3>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500 dark:text-slate-400 font-bold">
                    <tr>
                      <th className="px-6 py-3">Asset Type</th>
                      <th className="px-6 py-3">Description</th>
                      <th className="px-6 py-3 text-right">Est. Value</th>
                      <th className="px-6 py-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {caseData.assets?.map((asset: any) => (
                      <tr key={asset.id}>
                        <td className="px-6 py-4 text-sm capitalize text-slate-700 dark:text-slate-300">
                          <input type="hidden" name={`assets[${asset.id}][id]`} value={asset.id} />
                          <select
                            name={`assets[${asset.id}][asset_type]`}
                            defaultValue={asset.asset_type}
                            className="bg-transparent border-none p-0 focus:ring-0 w-full cursor-pointer"
                            disabled={!canManageAssetsExpensesDocsNotesDeadlines}
                          >
                            <option value="real_estate">Real Estate</option>
                            <option value="bank_account">Bank Account</option>
                            <option value="investment">Investment</option>
                            <option value="retirement">Retirement</option>
                            <option value="vehicle">Vehicle</option>
                            <option value="other">Other</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          <input
                            name={`assets[${asset.id}][description]`}
                            defaultValue={asset.description}
                            className="bg-transparent border-none p-0 focus:ring-0 w-full"
                            readOnly={!canManageAssetsExpensesDocsNotesDeadlines}
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-medium text-slate-900 dark:text-slate-100">
                          <div className="flex items-center justify-end">
                            <span>$</span>
                            <input
                              name={`assets[${asset.id}][estimated_value]`}
                              type="number"
                              step="0.01"
                              defaultValue={asset.estimated_value}
                              className="bg-transparent border-none p-0 focus:ring-0 font-medium text-right w-24"
                              readOnly={!canManageAssetsExpensesDocsNotesDeadlines}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ConfirmButton 
                            action={deleteAssetAction.bind(null, asset.id)}
                            confirmMessage="Delete this asset from the registry?"
                            className="text-slate-300 dark:text-slate-600 hover:text-red-600 transition-colors"
                            loadingText="Deleting..."
                            loadingIcon={<Loader2 className="h-4 w-4 animate-spin" />}
                            disabled={!canManageAssetsExpensesDocsNotesDeadlines}
                          >
                            <Trash2 className="h-4 w-4" />
                          </ConfirmButton>
                        </td>
                      </tr>
                    ))}
                    {/* Quick Add Asset Row */}
                    {canManageAssetsExpensesDocsNotesDeadlines && (
                      <tr className="bg-blue-50/30 dark:bg-blue-900/10">
                      <td className="px-6 py-3">
                        <select name="new_asset_type" className="bg-transparent border-dashed border-slate-300 dark:border-slate-700 rounded text-sm w-full focus:ring-blue-500 dark:text-slate-300">
                          <option value="real_estate">Real Estate</option>
                          <option value="bank_account">Bank Account</option>
                          <option value="investment">Investment</option>
                          <option value="retirement">Retirement</option>
                          <option value="other">Other</option>
                        </select>
                      </td>
                      <td className="px-6 py-3">
                        <input name="new_description" placeholder="New asset description..." className="bg-transparent border-dashed border-slate-300 dark:border-slate-700 rounded text-sm w-full dark:text-slate-300" />
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 dark:text-slate-500 text-sm">$</span>
                          <input name="new_value" type="number" placeholder="0.00" className="bg-transparent border-dashed border-slate-300 dark:border-slate-700 rounded text-sm w-24 text-right dark:text-slate-300" />
                          <button 
                            formAction={addAssetAction}
                            className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            disabled={!canManageAssetsExpensesDocsNotesDeadlines}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td></td>
                    </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Expenses Table */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                  <h3 className="font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <Receipt className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    Monthly Expenses (Net Worth Statement Prep)
                  </h3>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500 dark:text-slate-400 font-bold">
                    <tr>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Description</th>
                      <th className="px-6 py-3 text-right">Amount</th>
                      <th className="px-6 py-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {caseData.expenses?.map((exp: any) => (
                      <tr key={exp.id}>
                        <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                          <input 
                            name={`expenses[${exp.id}][category]`}
                            defaultValue={exp.category}
                            className="bg-transparent border-none p-0 focus:ring-0 w-full"
                            readOnly={!canManageAssetsExpensesDocsNotesDeadlines}
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          <input 
                            name={`expenses[${exp.id}][description]`}
                            defaultValue={exp.description}
                            className="bg-transparent border-none p-0 focus:ring-0 w-full"
                            readOnly={!canManageAssetsExpensesDocsNotesDeadlines}
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-medium text-slate-900 dark:text-slate-100">
                          <div className="flex items-center justify-end">
                            <span>$</span>
                            <input 
                              name={`expenses[${exp.id}][amount]`}
                              type="number"
                              step="0.01"
                              defaultValue={exp.amount}
                              className="bg-transparent border-none p-0 focus:ring-0 font-medium text-right w-20"
                              readOnly={!canManageAssetsExpensesDocsNotesDeadlines}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ConfirmButton
                            action={deleteExpenseAction.bind(null, exp.id)}
                            confirmMessage="Delete this expense item?"
                            className="text-slate-300 dark:text-slate-600 hover:text-red-600"
                            loadingText="Deleting..."
                            loadingIcon={<Loader2 className="h-4 w-4 animate-spin" />}
                            disabled={!canManageAssetsExpensesDocsNotesDeadlines}
                          >
                            <Trash2 className="h-4 w-4" />
                          </ConfirmButton>
                        </td>
                      </tr>
                    ))}
                    {canManageAssetsExpensesDocsNotesDeadlines && (
                      <tr className="bg-emerald-50/30 dark:bg-emerald-900/10">
                      <td className="px-6 py-3">
                        <select name="new_exp_category" className="bg-transparent border-dashed border-slate-300 dark:border-slate-700 rounded text-sm w-full dark:text-slate-300">
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
                        <input name="new_exp_description" placeholder="e.g. Electric Bill" className="bg-transparent border-dashed border-slate-300 dark:border-slate-700 rounded text-sm w-full dark:text-slate-300" />
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <input name="new_exp_amount" type="number" placeholder="0.00" className="bg-transparent border-dashed border-slate-300 dark:border-slate-700 rounded text-sm w-20 text-right dark:text-slate-300" />
                          <SubmitButton formAction={addExpenseAction} className="p-1.5 bg-emerald-600 dark:bg-emerald-700 text-white rounded-md hover:bg-emerald-700 dark:hover:bg-emerald-600"
                            loadingText="Adding..."
                            disabled={!canManageAssetsExpensesDocsNotesDeadlines}
                          >
                            {<Plus className="h-4 w-4" />}
                          </SubmitButton>
                        </div>
                      </td>
                      <td></td>
                    </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Deadlines Section */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Case Deadlines</h3>
              </div>
              <div className="p-6 space-y-4">
                {caseData.deadlines?.map((deadline: any) => {
                  const markAsCompleteAction = updateDeadlineStatus.bind(null, id, deadline.id, true);
                  return (
                    <div key={deadline.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${deadline.completed ? 'bg-slate-300 dark:bg-slate-700' : 'bg-amber-500'}`} />
                        <div>
                          <p className={`text-sm font-medium ${deadline.completed ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-slate-100'}`}>{deadline.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic">Due: {new Date(deadline.due_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {!deadline.completed && (
                        <SubmitButton
                          formAction={markAsCompleteAction}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-md border border-blue-100 dark:border-blue-900 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all text-xs font-bold shadow-sm"
                          icon={<Check className="h-3.5 w-3.5" />}
                          loadingText="Processing..."
                        >
                          Mark as Complete
                        </SubmitButton>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Discovery Repository / Document Management */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <FolderOpen className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  Discovery Repository
                </h3>
                <div className="flex gap-2">
                  <select name="category" className="text-xs border-slate-200 dark:border-slate-700 rounded-md py-1 bg-white dark:bg-slate-800 dark:text-slate-300" disabled={!canManageAssetsExpensesDocsNotesDeadlines}>
                    <option value="Discovery">Discovery</option>
                    <option value="Pleading">Pleading</option>
                    <option value="Financial">Financial</option>
                    <option value="Correspondence">Correspondence</option>
                  </select>
                  <FileUploadClient 
                    uploadAction={uploadDocAction} 
                    disabled={!canManageAssetsExpensesDocsNotesDeadlines} 
                  />
                </div>
              </div>
              <div className="p-0">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-[10px] uppercase text-slate-400 dark:text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-2">Document Name</th>
                      <th className="px-6 py-2 text-center">Category</th>
                      <th className="px-6 py-2 text-right">Size / Date</th>
                      <th className="px-6 py-2 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {caseData.documents?.map((doc: any) => (
                      <tr key={doc.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4">
                          <DocumentDownloadButton 
                            filePath={doc.file_path} 
                            fileName={doc.file_name} 
                            disabled={isClient}
                          />  
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase">{doc.category}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-xs text-slate-900 dark:text-slate-100 font-medium">{(doc.file_size / 1024 / 1024).toFixed(2)} MB</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(doc.created_at).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ConfirmButton
                            action={deleteDocument.bind(null, id, doc.id, doc.file_path)}
                            confirmMessage={`Permanently delete "${doc.file_name}"?`}
                            className="text-slate-300 dark:text-slate-600 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                            loadingText="Deleting..."
                            loadingIcon={<Loader2 className="h-4 w-4 animate-spin" />}
                            disabled={!canManageAssetsExpensesDocsNotesDeadlines}
                          >
                            <Trash2 className="h-4 w-4" />
                          </ConfirmButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!caseData.documents?.length && (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm italic">No documents uploaded yet.</div>
                )}
              </div>
            </div>

            {/* Case Notes Section */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <MessageSquare className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  Case Notes & Activity
                </h3>
              </div>
              <div className="p-6 space-y-6">
                {canManageAssetsExpensesDocsNotesDeadlines && ( // Only show note input if user can manage
                  <div className="flex gap-4">
                  <textarea 
                    name="note_content"
                    placeholder="Add a case update or strategy note..."
                    className="flex-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 dark:text-slate-100 min-h-[80px]"
                  />
                  <SubmitButton formAction={addNoteAction} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors self-end h-10 flex items-center gap-2 text-sm font-medium"
                    icon={<PlusCircle className="h-4 w-4" />}
                    loadingText="Posting..."
                    disabled={!canManageAssetsExpensesDocsNotesDeadlines}
                  >
                    Post Note
                  </SubmitButton>
                </div>
                )}
                <div className="space-y-4 border-t border-slate-50 dark:border-slate-800 pt-4">
                  {caseData.notes?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((note: any) => (
                    <div key={note.id} className="bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">
                          {note.profiles?.full_name || 'Attorney'}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">
                          {new Date(note.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-800 dark:text-slate-300 leading-relaxed">{note.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Sidebar */}
            <div className="space-y-6">
              <div className="bg-slate-900 dark:bg-slate-900 text-white rounded-xl p-6 shadow-lg border border-slate-800">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">Case Timeline</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-emerald-400 dark:bg-emerald-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-white">Case Opened</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{new Date(caseData.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {caseData.date_filed && (
                    <div className="flex gap-3">
                      <div className="mt-1.5 h-2 w-2 rounded-full bg-blue-400 dark:bg-blue-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-white">Summons Filed</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{new Date(caseData.date_filed).toLocaleDateString()}</p>
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