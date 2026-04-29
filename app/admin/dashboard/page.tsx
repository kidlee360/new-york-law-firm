

import { createClient } from '@/lib/supabase/server';
import { getAttorneyDashboardData } from './queries';
import { Scale, Clock, AlertCircle, FileText } from "lucide-react";
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

async function DashboardContent() {
  const supabase = await createClient();    
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/auth/login');
  }
  
  const cases = await getAttorneyDashboardData(user.id);

  // Calculate statistics
  const activeCasesCount = cases.length;
  const pendingServiceCount = cases.filter(c => c.status === 'intake' || c.status === 'pending').length;
  
  const today = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(today.getDate() + 7);

  let urgentDeadlinesCount = 0;
  cases.forEach(c => {
    c.deadlines?.forEach(d => {
      const dueDate = new Date(d.due_date);
      if (!d.completed && dueDate >= today && dueDate <= sevenDaysFromNow) {
        urgentDeadlinesCount++;
      }
    });
  });
  const filesToReviewCount = cases.filter(c => c.status === 'discovery').length;
  
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Case Management</h1>
          <p className="text-slate-500">New York Matrimonial Division</p>
        </div>
        <Link className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors"
         href="/admin/newCaseSheet"
        >
          + New Divorce Case
        </Link>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Active Cases" value={activeCasesCount} icon={<Scale className="h-4 w-4" />} />
        <StatCard title="Pending Service" value={pendingServiceCount} icon={<Clock className="h-4 w-4" />} color="text-amber-600" />
        <StatCard title="Urgent Deadlines" value={urgentDeadlinesCount} icon={<AlertCircle className="h-4 w-4" />} color="text-red-600" />
        <StatCard title="Files to Review" value={filesToReviewCount} icon={<FileText className="h-4 w-4" />} />
      </div>

      {/* Case Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-700">Client / Matter</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-700">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-700">Grounds</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-700">Next Deadline</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cases.map((c) => {
              const client = c.parties?.find(p => p.is_client);
              const nextDeadline = c.deadlines?.find(d => !d.completed);
              
              return (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{client?.first_name} {client?.last_name}</div>
                    <div className="text-xs text-slate-400 font-mono uppercase">{c.case_number || 'UNASSIGNED'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{c.grounds}</td>
                  <td className="px-6 py-4 text-sm">
                    {nextDeadline ? (
                      <span className="text-amber-700 font-medium">{nextDeadline.title} ({nextDeadline.due_date})</span>
                    ) : (
                      <span className="text-slate-400">No pending tasks</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link className="text-sm font-medium text-slate-900 hover:underline" href={`/admin/cases/${c.id}`}>
                      View File
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color = "text-slate-600" }: any) {
  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={color}>{icon}</div>
      </div>
      <div className="text-2xl font-bold mt-2">{value}</div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-64 mb-2"></div>
        <div className="h-4 bg-slate-200 rounded w-48"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-200 rounded-lg"></div>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <DashboardContent />
    </Suspense>
  );
}