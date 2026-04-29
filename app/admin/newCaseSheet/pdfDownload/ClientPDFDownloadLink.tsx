"use client";

import { PDFDownloadLink } from '@react-pdf/renderer';
import { NetWorthPDF } from '@/components/docs/netWorthPdf';
import { CSSAWorksheetPDF } from '@/components/docs/cssaWorksheetPdf';
import { FileDown } from 'lucide-react';
import type { CaseData, Asset } from './DownloadCaseFilesContent';
import { calculateNYChildSupport } from '@/utils/childSupport2026';

// Type assertion for PDFDownloadLink
const DownloadLink = PDFDownloadLink as any;

interface ClientPDFDownloadLinkProps {
  caseData: CaseData | null;
  assets: Asset[];
}

export function ClientPDFDownloadLink({ caseData, assets }: ClientPDFDownloadLinkProps) {
  // Ensure caseData and assets are valid before rendering PDF
  if (!caseData || !assets || !caseData.case_number) {
    return (
      <div className="flex items-center gap-2 bg-gray-400 text-white px-3 py-1.5 rounded-md text-sm cursor-not-allowed">
        <FileDown className="h-4 w-4" />
        Missing data for PDF
      </div>
    );
  }

  // Prepare calculation for CSSA Worksheet
  const calculation = calculateNYChildSupport(
    caseData.custodial_income || 0,
    caseData.non_custodial_income || 0,
    caseData.children_count || 1
  );

  return (
    <div className="space-y-3">
      <DownloadLink
        document={<NetWorthPDF caseData={caseData} assets={assets} />}
        fileName={`NetWorth_${caseData.case_number}.pdf`}
        className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors"
      >
        {({ loading }: { loading: boolean }) => (
          <>
            <FileDown className="h-4 w-4" />
            {loading ? 'Preparing Net Worth Statement...' : 'Download Net Worth Statement'}
          </>
        )}
      </DownloadLink>

      <DownloadLink
        document={<CSSAWorksheetPDF 
          caseData={caseData} 
          calculation={calculation}
          custodialIncome={caseData.custodial_income || 0}
          nonCustodialIncome={caseData.non_custodial_income || 0}
          numChildren={caseData.children_count || 1}
        />}
        fileName={`CSSA_Worksheet_${caseData.case_number}.pdf`}
        className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-900 transition-colors"
      >
        {({ loading }: { loading: boolean }) => (
          <>
            <FileDown className="h-4 w-4" />
            {loading ? 'Preparing CSSA Worksheet...' : 'Download CSSA Worksheet'}
          </>
        )}
      </DownloadLink>
    </div>
  );
}
