import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { CaseData } from '@/app/admin/newCaseSheet/pdfDownload/DownloadCaseFilesContent';
import type { ChildSupportCalculation } from '@/utils/childSupport2026';

const PDFDocument = Document as any;
const PDFPage = Page as any;
const PDFText = Text as any;
const PDFView = View as any;

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { textAlign: 'center', marginBottom: 20, textTransform: 'uppercase', fontWeight: 'bold', fontSize: 14 },
  section: { marginBottom: 15 },
  title: { fontSize: 12, fontWeight: 'bold', borderBottom: '1pt solid black', marginBottom: 5, paddingBottom: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottom: '0.5pt solid #eee' },
  label: { flex: 1 },
  value: { width: 120, textAlign: 'right', fontWeight: 'bold' },
  footer: { marginTop: 30, fontSize: 8, fontStyle: 'italic', color: '#666' },
});

interface CSSAWorksheetPDFProps {
  caseData: CaseData;
  calculation: ChildSupportCalculation;
  custodialIncome: number;
  nonCustodialIncome: number;
  numChildren: number;
}

export const CSSAWorksheetPDF = ({
  caseData,
  calculation,
  custodialIncome,
  nonCustodialIncome,
  numChildren
}: CSSAWorksheetPDFProps) => (
  <PDFDocument>
    <PDFPage size="A4" style={styles.page}>
      <PDFText style={styles.header}>Child Support Standards Act (CSSA) Worksheet</PDFText>
      
      <PDFView style={styles.section}>
        <PDFText style={styles.title}>PART I: CASE INFORMATION</PDFText>
        <PDFView style={styles.row}>
          <PDFText style={styles.label}>Case Number:</PDFText>
          <PDFText style={styles.value}>{caseData.case_number}</PDFText>
        </PDFView>
        <PDFView style={styles.row}>
          <PDFText style={styles.label}>Plaintiff (Client):</PDFText>
          <PDFText style={styles.value}>{caseData.plaintiff_name}</PDFText>
        </PDFView>
        <PDFView style={styles.row}>
          <PDFText style={styles.label}>Defendant (Spouse):</PDFText>
          <PDFText style={styles.value}>{caseData.defendant_name}</PDFText>
        </PDFView>
      </PDFView>

      <PDFView style={styles.section}>
        <PDFText style={styles.title}>PART II: ADJUSTED GROSS INCOME & PRO-RATA SHARE</PDFText>
        <PDFView style={styles.row}>
          <PDFText style={styles.label}>Custodial Parent Gross Income:</PDFText>
          <PDFText style={styles.value}>${Number(custodialIncome).toLocaleString()}</PDFText>
        </PDFView>
        <PDFView style={styles.row}>
          <PDFText style={styles.label}>Non-Custodial Parent Gross Income:</PDFText>
          <PDFText style={styles.value}>${Number(nonCustodialIncome).toLocaleString()}</PDFText>
        </PDFView>
        <PDFView style={styles.row}>
          <PDFText style={styles.label}>Non-Custodial Parent Pro-Rata Share:</PDFText>
          <PDFText style={styles.value}>{calculation.shareRatio}%</PDFText>
        </PDFView>
      </PDFView>

      <PDFView style={styles.section}>
        <PDFText style={styles.title}>PART III: CALCULATED OBLIGATION</PDFText>
        <PDFView style={styles.row}>
          <PDFText style={styles.label}>Number of Children:</PDFText>
          <PDFText style={styles.value}>{numChildren}</PDFText>
        </PDFView>
        <PDFView style={styles.row}>
          <PDFText style={styles.label}>Combined Annual Support Obligation:</PDFText>
          <PDFText style={styles.value}>${calculation.annual.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</PDFText>
        </PDFView>
        <PDFView style={styles.row}>
          <PDFText style={styles.label}>Non-Custodial Monthly Payment:</PDFText>
          <PDFText style={styles.value}>${calculation.monthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</PDFText>
        </PDFView>
      </PDFView>

      {calculation.isAboveCap && (
        <PDFText style={{ fontSize: 9, color: '#cc0000', marginTop: 10 }}>
          Note: Combined income exceeds the statutory cap (projected $193,000 for 2026).
        </PDFText>
      )}

      <PDFText style={styles.footer}>
        Calculated using NY CSSA 2026 Statutory Guidelines. This document is for informational purposes only.
      </PDFText>
    </PDFPage>
  </PDFDocument>
);