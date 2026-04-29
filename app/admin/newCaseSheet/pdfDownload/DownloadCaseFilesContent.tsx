"use client";
import dynamic from 'next/dynamic';
import { FileDown } from 'lucide-react';
import { useEffect, useState, use } from 'react'; // Keep 'use' here for the client component
import { AlertTriangle } from 'lucide-react'; // Assuming AlertTriangle is used for error states
import { createClient } from '@/lib/supabase/client';

export interface CaseData {
  case_number: string;
  plaintiff_name: string;
  defendant_name: string;
  maintenance_guideline?: number;
  child_support_guideline?: number;
  custodial_income?: number;
  non_custodial_income?: number;
  children_count?: number;
  [key: string]: any;
}

export interface Asset {
  asset_type: string;
  estimated_value: number;
  description: string;
}

async function fetchCaseDetails(caseNumber: string) {
  const supabase = createClient();
  
  // Fetch case data including joined parties and assets
  const { data, error } = await supabase
    .from('cases')
    .select(`
      *,
      parties (first_name, last_name, is_client),
      assets (asset_type, estimated_value, description)
    `)
    .eq('case_number', caseNumber)
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Case not found');
  }

  // Extract plaintiff and defendant from the parties relation
  const plaintiff = data.parties?.find((p: any) => p.is_client);
  const defendant = data.parties?.find((p: any) => !p.is_client);

  return {
    caseData: {
      ...data,
      plaintiff_name: plaintiff ? `${plaintiff.first_name} ${plaintiff.last_name}` : 'Unknown',
      defendant_name: defendant ? `${defendant.first_name} ${defendant.last_name}` : 'Unknown',
    } as CaseData,
    assets: (data.assets || []) as Asset[],
  };
}

// Dynamically import the client-only component, disabling SSR
const ClientPDFDownloadLink = dynamic(
  () => import('./ClientPDFDownloadLink').then((mod) => mod.ClientPDFDownloadLink),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-2 bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm cursor-wait">
        <FileDown className="h-4 w-4 animate-pulse" />
        Loading PDF component...
      </div>
    ),
  }
);

interface DownloadCaseFilesPageProps {
  searchParams: Promise<{
    case_number?: string;
  }>;
}

export default function DownloadCaseFilesContent({ searchParams }: DownloadCaseFilesPageProps) {
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Unwrap the searchParams promise using React.use()
  const resolvedParams = use(searchParams);
  const caseNumber = resolvedParams?.case_number;

  useEffect(() => {
    if (caseNumber) {
      const loadData = async () => {
        try {
          setIsLoading(true);
          const data = await fetchCaseDetails(caseNumber);
          setCaseData(data.caseData);
          setAssets(data.assets);
        } catch (err) {
          console.error("Failed to fetch case details:", err);
          setError("Failed to load case details for PDF generation.");
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    } else {
      setError("No case number provided in URL.");
      setIsLoading(false);
    }
  }, [caseNumber]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-lg text-gray-700">
          <FileDown className="h-6 w-6 animate-bounce" />
          Preparing PDF data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4 text-red-800">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <p className="text-lg font-semibold">Error:</p>
        <p>{error}</p>
        <p className="text-sm mt-2">Please ensure a valid case number is provided in the URL.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Download Net Worth Statement</h1>
        <p className="text-slate-600 mb-6">
          This page allows you to download the Net Worth Statement for case{' '}
          <span className="font-semibold">{caseData?.case_number}</span>.
        </p>
        <ClientPDFDownloadLink caseData={caseData} assets={assets} />
        <p className="mt-6 text-sm text-gray-500">
          The PDF generation process occurs entirely in your browser.
          If the download doesn't start automatically, please click the button above.
        </p>
      </div>
    </div>
  );
}