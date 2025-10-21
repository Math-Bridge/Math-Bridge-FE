import React from 'react';
import { Calendar, Clock, Video } from 'lucide-react';

interface Session {
  id: string;
  course: string;
  tutor: string;
  date: string;
  time: string;
  duration: number;
}

const UpcomingSessions: React.FC = () => {
  const sessions: Session[] = [
    {
      id: '1',
      course: 'Linear Algebra',
      tutor: 'Prof. Sarah Johnson',
      date: '2024-10-22',
      time: '14:00',
      duration: 90
    },
    {
      id: '2',
      course: 'Calculus I',
      tutor: 'Dr. Michael Chen',
      date: '2024-10-23',
      time: '16:00',
      duration: 60
    },
    {
      id: '3',
      course: 'Discrete Mathematics',
      tutor: 'Dr. John Smith',
      date: '2024-10-24',
      time: '10:00',
      duration: 120
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Calendar className="h-6 w-6 text-green-500 mr-2" />
          Upcoming Sessions
        </h2>
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {sessions.map((session, index) => (
          <div
            key={session.id}
            className={`p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 ${
              index === 0 ? 'bg-blue-50' : 'bg-white'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg border-2 border-blue-200">
                {session.tutor.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {session.course}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  with {session.tutor}
                </p>

                <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                  <span className="flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    {session.date}
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    {session.time} ({session.duration} min)
                  </span>
                  <span className="flex items-center">
                    <Video className="h-3.5 w-3.5 mr-1" />
                    Online
                  </span>
                </div>
              </div>

              {index === 0 && (
                <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-200">
                  Join Now
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No upcoming sessions</p>
          <button className="mt-4 text-blue-600 hover:text-blue-700 font-medium">
            Book a Session
          </button>
        </div>
      )}
    </div>
  );
};

export default UpcomingSessions;
