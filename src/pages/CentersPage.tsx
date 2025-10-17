import React from 'react';
import CenterList from '../components/centers/CenterList';

const CentersPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CenterList />
      </div>
    </div>
  );
};

export default CentersPage;


