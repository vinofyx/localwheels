import React from 'react';
import MRReportPage from './mr/MRReportPage';

// Filter: Entry date, Entry No, Party, Note Type  (range inputs)
const FILTER_OPTS = ['Entry date', 'Entry No', 'Party', 'Note Type'];

const COLS = [
  'Entry No', 'Entry Date', 'Entry Type', 'Note Type',
  'Billing Party', 'Total Amount', 'CGST', 'SGST', 'IGST',
  'Round Up', 'Net Amount', 'Remark',
];

export default function CustCrDrNoteReg() {
  return <MRReportPage title="Cust_Cr/Dr_Note_Reg" filterOpts={FILTER_OPTS} cols={COLS} />;
}
