import React from 'react';
import { AdminDashboard, PackageManagement } from '../../../components/features/admin';

const PackageManagementPage: React.FC = () => {
  return (
    <AdminDashboard>
      <PackageManagement />
    </AdminDashboard>
  );
};

export default PackageManagementPage;

