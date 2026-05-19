import React from 'react';
import MRReportPage from '../account-reports/mr/MRReportPage';

const FILTER_OPTS = ['LR NO', 'CONSIGNOR', 'CONSIGNEE', 'LRDATE'];

const COLS = [
  'LR No', 'LR Date', 'From', 'To', 'Consignor', 'Consignee',
  'Packages', 'Weight', 'Status', 'Current Location',
];

export default function LRTracking() {
  return (
    <MRReportPage
      title="LR Tracking"
      filterOpts={FILTER_OPTS}
      cols={COLS}
      singleInput={true}
    />
  );
}
