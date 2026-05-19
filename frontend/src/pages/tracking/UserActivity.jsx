import React from 'react';
import MRReportPage from '../account-reports/mr/MRReportPage';

const FILTER_OPTS = ['DOCUMENT NO', 'ACTIVITY DATE', 'USER NAME', 'DOCUMENT TYPE', 'ACTIVITIY TYPE'];

const COLS = [
  'Document No', 'Activity Date', 'User Name', 'Document Type',
  'Activity Type', 'Branch', 'Remark',
];

export default function UserActivity() {
  return (
    <MRReportPage
      title="User Activity"
      filterOpts={FILTER_OPTS}
      cols={COLS}
      singleInput={true}
    />
  );
}
