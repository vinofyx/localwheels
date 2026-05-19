import React from 'react';
import MRReportPage from './mr/MRReportPage';

// Filter: ENTRY DATE, EXP.BRANCH, EXPENSE NO, VENDOR, MEMO BRANCH, MEMO TYPE
const FILTER_OPTS = [
  'ENTRY DATE', 'EXP.BRANCH', 'EXPENSE NO',
  'VENDOR', 'MEMO BRANCH', 'MEMO TYPE',
];

const COLS = [
  'Expense No', 'Entry Date', 'Expense Type', 'Memo Type',
  'Exp Branch', 'Memo Branch', 'Vendor',
  'Memo No', 'Memo Date', 'Vehicle No',
  'Total Amount', 'Payment Mode', 'Narration',
];

export default function MemoExpensesReg() {
  return <MRReportPage title="Memo_Expenses_Reg" filterOpts={FILTER_OPTS} cols={COLS} />;
}
