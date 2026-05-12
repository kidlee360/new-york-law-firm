'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, Filter } from 'lucide-react';
import { useTransition } from 'react';

export function DashboardFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by client name or case number..."
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 transition-all text-sm"
          defaultValue={searchParams.get('search') ?? ''}
          onChange={(e) => updateParams('search', e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-slate-400 hidden md:block" />
        <select
          className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 min-w-[150px] dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 transition-all"
          defaultValue={searchParams.get('status') ?? 'all'}
          onChange={(e) => updateParams('status', e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="intake">Intake</option>
          <option value="pending">Pending</option>
          <option value="discovery">Discovery</option>
          <option value="trial">Trial</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      {isPending && (
        <div className="flex items-center gap-2 text-xs text-slate-400 italic animate-pulse">
          Filtering results...
        </div>
      )}
    </div>
  );
}