import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { CaseData, Asset } from '@/app/admin/newCaseSheet/pdfDownload/DownloadCaseFilesContent';

// Type assertion to help TypeScript understand PDF components
const PDFDocument = Document as any;
const PDFPage = Page as any;
const PDFText = Text as any;
const PDFView = View as any;

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { textAlign: 'center', marginBottom: 20, textTransform: 'uppercase', fontWeight: 'bold' },
  captionBox: { border: '1pt solid black', padding: 10, marginBottom: 20, flexDirection: 'row' },
  captionSide: { flex: 1 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', backgroundColor: '#f0f0f0', padding: 4, marginTop: 15 },
  row: { flexDirection: 'row', borderBottom: '0.5pt solid #eee', paddingVertical: 4 },
  label: { flex: 2, fontWeight: 'bold' },
  value: { flex: 1, textAlign: 'right' },
});

interface NetWorthPDFProps {
  caseData: CaseData;
  assets: Asset[];
}

export const NetWorthPDF = ({ caseData, assets }: NetWorthPDFProps) => (
  <PDFDocument>
    <PDFPage size="A4" style={styles.page}>
      {/* 1. NY Court Caption */}
      <PDFText style={styles.header}>Supreme Court of the State of New York</PDFText>
      <PDFView style={styles.captionBox}>
        <PDFView style={styles.captionSide}>
          <PDFText>Plaintiff: {caseData.plaintiff_name}</PDFText>
          <PDFText style={{ marginVertical: 5 }}>- against -</PDFText>
          <PDFText>Defendant: {caseData.defendant_name}</PDFText>
        </PDFView>
        <PDFView style={{ width: 150, borderLeft: '1pt solid black', paddingLeft: 10 }}>
          <PDFText>Index No: {caseData.case_number}</PDFText>
          <PDFText style={{ marginTop: 10 }}>STATEMENT OF NET WORTH</PDFText>
        </PDFView>
      </PDFView>

      {/* 2. Assets Section */}
      <PDFText style={styles.sectionTitle}>ASSETS (DRL §236)</PDFText>
      {assets.map((asset: any, i: number) => (
        <PDFView key={i} style={styles.row}>
          <PDFText style={styles.label}>{asset.description || asset.asset_type}</PDFText>
          <PDFText style={styles.value}>${Number(asset.estimated_value).toLocaleString()}</PDFText>
        </PDFView>
      ))}

      {/* 3. Statutory Footer */}
      <PDFText style={{ marginTop: 40, fontSize: 8, fontStyle: 'italic' }}>
        I certify that the foregoing information is true and correct to the best of my knowledge under penalty of perjury.
      </PDFText>
    </PDFPage>
  </PDFDocument>
);