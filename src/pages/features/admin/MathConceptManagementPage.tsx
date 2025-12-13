import React from 'react';
import { AdminDashboard } from '../../../components/features/admin';
import MathConceptManagement from '../../../components/features/admin/MathConceptManagement';

const MathConceptManagementPage: React.FC = () => {
  return (
    <AdminDashboard>
      <MathConceptManagement />
    </AdminDashboard>
  );
};

export default MathConceptManagementPage;


