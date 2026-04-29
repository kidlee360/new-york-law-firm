import { Suspense } from 'react';
import DownloadCaseFilesContent from './DownloadCaseFilesContent';
import { FileDown } from 'lucide-react';

interface DownloadCaseFilesPageProps {
  searchParams: Promise<{
    case_number?: string;
  }>;
}

// This is the new page.tsx, which is a Server Component by default.
// It wraps the client component (DownloadCaseFilesContent) in Suspense.
export default function DownloadCaseFilesPage({ searchParams }: DownloadCaseFilesPageProps) {
  // The 'use' hook for searchParams is now implicitly handled by Next.js
  // when passing it as a prop to a client component wrapped in Suspense.
  // Alternatively, you could use `const resolvedSearchParams = use(searchParams);` here
  // if this were a Server Component that needed to access it directly.
  // For passing to a client component, Next.js handles the Promise resolution.

  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-lg text-gray-700">
          <FileDown className="h-6 w-6 animate-bounce" />
          Loading PDF data...
        </div>
      </div>
    }>
      <DownloadCaseFilesContent searchParams={searchParams} />
    </Suspense>
  );
}