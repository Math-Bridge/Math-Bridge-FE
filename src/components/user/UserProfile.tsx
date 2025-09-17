import React from 'react';
import { User, Mail, Phone, Calendar, MapPin, Edit } from 'lucide-react';

const UserProfile: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
        <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
          <Edit className="h-4 w-4" />
          <span>Edit</span>
        </button>
      </div>
      
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">John Doe</h3>
          <p className="text-gray-600">Mathematics Student</p>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center space-x-3 text-gray-600">
          <Mail className="h-4 w-4" />
          <span>john.doe@email.com</span>
        </div>
        <div className="flex items-center space-x-3 text-gray-600">
          <Phone className="h-4 w-4" />
          <span>+1 (555) 123-4567</span>
        </div>
        <div className="flex items-center space-x-3 text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>Joined March 2024</span>
        </div>
        <div className="flex items-center space-x-3 text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>San Francisco, CA</span>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;