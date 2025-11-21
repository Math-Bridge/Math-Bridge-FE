import React from 'react';
import { AdminDashboard } from '../../../components/features/admin';
import UnitManagement from '../../../components/features/admin/UnitManagement';

const UnitManagementPage: React.FC = () => {
  return (
    <AdminDashboard>
      <UnitManagement />
    </AdminDashboard>
  );
};

export default UnitManagementPage;
