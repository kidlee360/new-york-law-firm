import { createClient } from '@/lib/supabase/server';
import { getClientData } from './queries';
import { Scale, Calendar, FileText, MessageSquare, ArrowRight } from "lucide-react";
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

async function PortalContent() {
  const supabase = await createClient();    
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/auth/login');
  }
  
  // We reuse the query logic but it will only return cases linked to this user_id
  const cases = await getClientData();

  if (!cases || cases.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <Scale className="h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900">No Active Matters</h2>
        <p className="text-slate-500 max-w-sm mt-2">
          We couldn't find any cases associated with your account. If you believe this is an error, please contact your attorney.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Client Portal</h1>
        <p className="text-slate-500 text-lg">Welcome back. Here is the current status of your legal matters.</p>
      </header>

      <div className="grid gap-6">
        {cases.map((c: any) => {
          const nextDeadline = c.deadlines?.find((d: any) => !d.completed);
          
          return (
            <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 uppercase tracking-wide">
                      {c.status}
                    </span>
                    <span className="text-slate-400 font-mono text-sm">{c.case_number}</span>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-slate-900">Matrimonial Action: {c.grounds}</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">Next Task</p>
                        <p className="text-sm font-medium truncate max-w-[150px]">
                          {nextDeadline ? nextDeadline.title : 'No pending tasks'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">Documents</p>
                        <p className="text-sm font-medium">{c.documents?.length || 0} Files</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">Updates</p>
                        <p className="text-sm font-medium">{c.notes?.length || 0} Notes</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center md:border-l border-slate-100 md:pl-8">
                  <Link 
                    href={`/admin/cases/${c.id}`} 
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-all group"
                  >
                    View Full Case File
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PortalPage() {
  return (
    <Suspense fallback={<div className="p-8 max-w-5xl mx-auto animate-pulse">Loading portal...</div>}>
      <PortalContent />
    </Suspense>
  );
}