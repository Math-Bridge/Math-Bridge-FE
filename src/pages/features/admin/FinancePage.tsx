import React from 'react';
import { AdminDashboard } from '../../../components/features/admin';
import FinancialStatistics from '../../../components/statistics/FinancialStatistics';

const FinancePage: React.FC = () => {
  return (
    <AdminDashboard>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finance & Reports</h1>
          <p className="text-gray-600 mt-1">Financial overview and transaction reports</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <FinancialStatistics />
        </div>
      </div>
    </AdminDashboard>
  );
};

export default FinancePage;




