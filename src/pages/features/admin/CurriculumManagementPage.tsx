import React from 'react';
import { AdminDashboard } from '../../../components/features/admin';
import CurriculumManagement from '../../../components/features/admin/CurriculumManagement';

const CurriculumManagementPage: React.FC = () => {
  return (
    <AdminDashboard>
      <CurriculumManagement />
    </AdminDashboard>
  );
};

export default CurriculumManagementPage;
