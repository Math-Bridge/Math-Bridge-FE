import React, { useState, useEffect } from 'react';
import {
  getTutorStatistics,
  getTopRatedTutors,
  getMostActiveTutors,
  TutorStatisticsDto,
  TopRatedTutorsListDto,
  MostActiveTutorsListDto,
} from '../../services/api';
import { LoadingSpinner } from '../common';
import { GraduationCap, Star, Activity } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const TutorStatistics: React.FC = () => {
  const [overview, setOverview] = useState<TutorStatisticsDto | null>(null);
  const [topRated, setTopRated] = useState<TopRatedTutorsListDto | null>(null);
  const [mostActive, setMostActive] = useState<MostActiveTutorsListDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    fetchAllData();
  }, [limit]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, topRatedRes, mostActiveRes] = await Promise.all([
        getTutorStatistics(),
        getTopRatedTutors(limit),
        getMostActiveTutors(limit),
      ]);

      if (overviewRes.success && overviewRes.data) {
        setOverview(overviewRes.data);
      }
      if (topRatedRes.success && topRatedRes.data) {
        setTopRated(topRatedRes.data);
      }
      if (mostActiveRes.success && mostActiveRes.data) {
        setMostActive(mostActiveRes.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchAllData}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      {overview && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Tutor Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Total Tutors</div>
              <div className="text-2xl font-bold text-blue-600">{overview.totalTutors}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Average Rating</div>
              <div className="text-2xl font-bold text-yellow-600">{overview.averageRating.toFixed(2)}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">With Feedback</div>
              <div className="text-2xl font-bold text-green-600">{overview.tutorsWithFeedback}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Without Feedback</div>
              <div className="text-2xl font-bold text-gray-600">{overview.tutorsWithoutFeedback}</div>
            </div>
          </div>
        </div>
      )}

      {/* Top Rated Tutors */}
      {topRated && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Star className="w-5 h-5" />
              Top Rated Tutors
            </h2>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
              <option value={50}>Top 50</option>
            </select>
          </div>
          <div className="bg-white p-4 rounded-lg mb-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topRated.tutors.map(tutor => ({
                name: tutor.tutorName.length > 15 ? tutor.tutorName.substring(0, 15) + '...' : tutor.tutorName,
                rating: tutor.averageRating,
                feedbacks: tutor.feedbackCount
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="rating" fill="#fbbf24" name="Average Rating" />
                <Bar yAxisId="right" dataKey="feedbacks" fill="#3b82f6" name="Feedback Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tutor Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feedback Count</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topRated.tutors.map((tutor, index) => (
                  <tr key={tutor.tutorId}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{index + 1}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{tutor.tutorName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{tutor.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold">{tutor.averageRating.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{tutor.feedbackCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Most Active Tutors */}
      {mostActive && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Most Active Tutors
            </h2>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
              <option value={50}>Top 50</option>
            </select>
          </div>
          <div className="bg-white p-4 rounded-lg mb-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mostActive.tutors.map(tutor => ({
                name: tutor.tutorName.length > 15 ? tutor.tutorName.substring(0, 15) + '...' : tutor.tutorName,
                total: tutor.sessionCount,
                completed: tutor.completedSessions
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#3b82f6" name="Total Sessions" />
                <Bar dataKey="completed" fill="#10b981" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tutor Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Sessions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mostActive.tutors.map((tutor, index) => (
                  <tr key={tutor.tutorId}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{index + 1}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{tutor.tutorName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{tutor.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">{tutor.sessionCount}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600">{tutor.completedSessions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorStatistics;
