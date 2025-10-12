import React from 'react';
import { Calendar, Clock, User, Video, MapPin } from 'lucide-react';

const UpcomingSessions: React.FC = () => {
  const sessions = [
    {
      id: 1,
      subject: 'Algebra II',
      tutor: 'Dr. Sarah Johnson',
      student: 'Emma',
      date: 'Today',
      time: '3:00 PM',
      duration: '60 min',
      type: 'video',
      status: 'confirmed',
      avatar: '👩‍🏫'
    },
    {
      id: 2,
      subject: 'Calculus',
      tutor: 'Prof. Michael Chen',
      student: 'Noah',
      date: 'Tomorrow',
      time: '10:00 AM',
      duration: '90 min',
      type: 'in-person',
      status: 'confirmed',
      avatar: '👨‍🏫'
    },
    {
      id: 3,
      subject: 'Statistics',
      tutor: 'Ms. Emily Davis',
      student: 'Emma',
      date: 'Friday',
      time: '2:30 PM',
      duration: '45 min',
      type: 'video',
      status: 'pending',
      avatar: '👩‍💼'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover-lift animate-slide-in-left">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Calendar className="h-6 w-6 text-blue-500 mr-2" />
          Children's Upcoming Sessions
        </h2>
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          View All
        </button>
      </div>
      
      <div className="space-y-4">
        {sessions.map((session, index) => (
          <div
            key={session.id}
            className={`p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 animate-fade-in stagger-${index + 1}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{session.avatar}</div>
                <div>
                  <h3 className="font-semibold text-gray-900">{session.subject}</h3>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-teal-700">{session.student}</span> with {session.tutor}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(session.status)}`}>
                {session.status}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {session.date}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {session.time} ({session.duration})
                </div>
              </div>
              <div className="flex items-center">
                {session.type === 'video' ? (
                  <Video className="h-4 w-4 mr-1 text-blue-500" />
                ) : (
                  <MapPin className="h-4 w-4 mr-1 text-green-500" />
                )}
                <span className="capitalize">{session.type}</span>
              </div>
            </div>
            
            {session.status === 'confirmed' && (
              <div className="mt-3 flex space-x-2">
                <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  {session.type === 'video' ? 'Join Video Call' : 'Get Directions'}
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  Reschedule
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingSessions;