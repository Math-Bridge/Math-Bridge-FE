import React, { useState, useEffect } from 'react';
import {
  getTutorStatistics,
  getTopRatedTutors,
  getWorstRatedTutors,
  getMostActiveTutors,
  TutorStatisticsDto,
  TopRatedTutorsListDto,
  WorstRatedTutorsListDto,
  MostActiveTutorsListDto,
} from '../../services/api';
import { LoadingSpinner } from '../common';
import { GraduationCap, Star, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [topRated, setTopRated] = useState<TopRatedTutorsListDto | WorstRatedTutorsListDto | null>(null);
  const [mostActive, setMostActive] = useState<MostActiveTutorsListDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(10);
  const [topRatedOrder, setTopRatedOrder] = useState<'top' | 'bottom'>('top');
  const [topRatedPage, setTopRatedPage] = useState(1);
  const [mostActivePage, setMostActivePage] = useState(1);
  const [topRatedTablePage, setTopRatedTablePage] = useState(1);
  const [mostActiveTablePage, setMostActiveTablePage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchAllData();
  }, [limit, topRatedOrder, topRatedPage, mostActivePage]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, topRatedRes, mostActiveRes] = await Promise.all([
        getTutorStatistics(),
        // request enough items to cover the current page
        topRatedOrder === 'top' ? getTopRatedTutors(limit * topRatedPage) : getWorstRatedTutors(limit * topRatedPage),
        getMostActiveTutors(limit * mostActivePage),
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
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
            <GraduationCap className="w-6 h-6 text-blue-600" />
            Tutor Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <Activity className="w-8 h-8 opacity-80" />
              </div>
              <p className="text-blue-100 text-sm font-medium mb-1">Total Tutors</p>
              <p className="text-3xl font-bold">{overview.totalTutors.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Star className="w-6 h-6" />
                </div>
                <Star className="w-8 h-8 opacity-80" />
              </div>
              <p className="text-yellow-100 text-sm font-medium mb-1">Average Rating</p>
              <p className="text-3xl font-bold">{overview.averageRating.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Star className="w-6 h-6" />
                </div>
                <Activity className="w-8 h-8 opacity-80" />
              </div>
              <p className="text-green-100 text-sm font-medium mb-1">With Feedback</p>
              <p className="text-3xl font-bold">{overview.tutorsWithFeedback.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <Activity className="w-8 h-8 opacity-80" />
              </div>
              <p className="text-gray-100 text-sm font-medium mb-1">Without Feedback</p>
              <p className="text-3xl font-bold">{overview.tutorsWithoutFeedback.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Rated Tutors */}
      {topRated && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
              <Star className="w-6 h-6 text-yellow-600" />
              {topRatedOrder === 'top' ? 'Top Rated Tutors' : 'Worst Rated Tutors'}
            </h2>
            <div className="flex items-center gap-3">
              <select
                value={topRatedOrder}
                onChange={(e) => { 
                  setTopRatedOrder(e.target.value as 'top' | 'bottom'); 
                  setTopRatedPage(1);
                  setTopRatedTablePage(1);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent shadow-sm"
                aria-label="Order"
              >
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
              </select>
              <select
                value={limit}
                onChange={(e) => { 
                  setLimit(Number(e.target.value)); 
                  setTopRatedPage(1); 
                  setMostActivePage(1);
                  setTopRatedTablePage(1);
                  setMostActiveTablePage(1);
                }}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent shadow-sm"
                aria-label="Limit"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={1000}>All</option>
              </select>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 mb-6">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={topRated.tutors.map(tutor => ({
                  name: tutor.tutorName.length > 15 ? tutor.tutorName.substring(0, 15) + '...' : tutor.tutorName,
                  rating: tutor.averageRating,
                  feedbacks: tutor.feedbackCount
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  stroke="#6b7280"
                  style={{ fontSize: '11px' }}
                  tick={{ fill: '#6b7280' }}
                />
                <YAxis 
                  yAxisId="left" 
                  stroke="#fbbf24"
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#fbbf24' }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#3b82f6"
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#3b82f6' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                />
                <Bar 
                  yAxisId="left" 
                  dataKey="rating" 
                  fill="#fbbf24" 
                  name="Average Rating"
                  radius={[8, 8, 0, 0]}
                  animationDuration={1000}
                />
                <Bar 
                  yAxisId="right" 
                  dataKey="feedbacks" 
                  fill="#3b82f6" 
                  name="Feedback Count"
                  radius={[8, 8, 0, 0]}
                  animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Tutor Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Avg Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feedback Count</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topRated.tutors
                  .slice((topRatedTablePage - 1) * ITEMS_PER_PAGE, topRatedTablePage * ITEMS_PER_PAGE)
                  .map((tutor, index) => (
                  <tr key={tutor.tutorId}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm border-r border-gray-200">{(topRatedTablePage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium border-r border-gray-200">{tutor.tutorName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">{tutor.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm border-r border-gray-200">
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
          {/* Pagination for Top Rated */}
          {topRated.tutors.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
              <div className="flex justify-between flex-1 sm:hidden">
                <button
                  onClick={() => setTopRatedTablePage(Math.max(1, topRatedTablePage - 1))}
                  disabled={topRatedTablePage === 1}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setTopRatedTablePage(Math.min(Math.ceil(topRated.tutors.length / ITEMS_PER_PAGE), topRatedTablePage + 1))}
                  disabled={topRatedTablePage >= Math.ceil(topRated.tutors.length / ITEMS_PER_PAGE)}
                  className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(topRatedTablePage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium">{Math.min(topRatedTablePage * ITEMS_PER_PAGE, topRated.tutors.length)}</span> of <span className="font-medium">{topRated.tutors.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setTopRatedTablePage(Math.max(1, topRatedTablePage - 1))}
                      disabled={topRatedTablePage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    {Array.from({ length: Math.ceil(topRated.tutors.length / ITEMS_PER_PAGE) }).map((_, i) => {
                        const page = i + 1;
                        const totalPages = Math.ceil(topRated.tutors.length / ITEMS_PER_PAGE);
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= topRatedTablePage - 1 && page <= topRatedTablePage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setTopRatedTablePage(page)}
                              aria-current={page === topRatedTablePage ? 'page' : undefined}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                page === topRatedTablePage
                                  ? 'bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                  : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          (page === topRatedTablePage - 2 && page > 1) ||
                          (page === topRatedTablePage + 2 && page < totalPages)
                        ) {
                          return (
                            <span key={page} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                              ...
                            </span>
                          );
                        }
                        return null;
                    })}
                    <button
                      onClick={() => setTopRatedTablePage(Math.min(Math.ceil(topRated.tutors.length / ITEMS_PER_PAGE), topRatedTablePage + 1))}
                      disabled={topRatedTablePage >= Math.ceil(topRated.tutors.length / ITEMS_PER_PAGE)}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Most Active Tutors */}
      {mostActive && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
              <Activity className="w-6 h-6 text-blue-600" />
              Most Active Tutors
            </h2>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent shadow-sm"
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
              <option value={50}>Top 50</option>
              <option value={1000}>All</option>
            </select>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 mb-6">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={mostActive.tutors.map(tutor => ({
                  name: tutor.tutorName.length > 15 ? tutor.tutorName.substring(0, 15) + '...' : tutor.tutorName,
                  total: tutor.sessionCount,
                  completed: tutor.completedSessions
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  stroke="#6b7280"
                  style={{ fontSize: '11px' }}
                  tick={{ fill: '#6b7280' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#6b7280' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                />
                <Bar 
                  dataKey="total" 
                  fill="#3b82f6" 
                  name="Total Sessions"
                  radius={[8, 8, 0, 0]}
                  animationDuration={1000}
                />
                <Bar 
                  dataKey="completed" 
                  fill="#10b981" 
                  name="Completed"
                  radius={[8, 8, 0, 0]}
                  animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Tutor Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Total Sessions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mostActive.tutors
                  .slice((mostActiveTablePage - 1) * ITEMS_PER_PAGE, mostActiveTablePage * ITEMS_PER_PAGE)
                  .map((tutor, index) => (
                  <tr key={tutor.tutorId}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm border-r border-gray-200">{(mostActiveTablePage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium border-r border-gray-200">{tutor.tutorName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">{tutor.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold border-r border-gray-200">{tutor.sessionCount}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600">{tutor.completedSessions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination for Most Active */}
          {mostActive.tutors.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
              <div className="flex justify-between flex-1 sm:hidden">
                <button
                  onClick={() => setMostActiveTablePage(Math.max(1, mostActiveTablePage - 1))}
                  disabled={mostActiveTablePage === 1}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setMostActiveTablePage(Math.min(Math.ceil(mostActive.tutors.length / ITEMS_PER_PAGE), mostActiveTablePage + 1))}
                  disabled={mostActiveTablePage >= Math.ceil(mostActive.tutors.length / ITEMS_PER_PAGE)}
                  className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(mostActiveTablePage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium">{Math.min(mostActiveTablePage * ITEMS_PER_PAGE, mostActive.tutors.length)}</span> of <span className="font-medium">{mostActive.tutors.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setMostActiveTablePage(Math.max(1, mostActiveTablePage - 1))}
                      disabled={mostActiveTablePage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    {Array.from({ length: Math.ceil(mostActive.tutors.length / ITEMS_PER_PAGE) }).map((_, i) => {
                        const page = i + 1;
                        const totalPages = Math.ceil(mostActive.tutors.length / ITEMS_PER_PAGE);
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= mostActiveTablePage - 1 && page <= mostActiveTablePage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setMostActiveTablePage(page)}
                              aria-current={page === mostActiveTablePage ? 'page' : undefined}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                page === mostActiveTablePage
                                  ? 'bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                  : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          (page === mostActiveTablePage - 2 && page > 1) ||
                          (page === mostActiveTablePage + 2 && page < totalPages)
                        ) {
                          return (
                            <span key={page} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                              ...
                            </span>
                          );
                        }
                        return null;
                    })}
                    <button
                      onClick={() => setMostActiveTablePage(Math.min(Math.ceil(mostActive.tutors.length / ITEMS_PER_PAGE), mostActiveTablePage + 1))}
                      disabled={mostActiveTablePage >= Math.ceil(mostActive.tutors.length / ITEMS_PER_PAGE)}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TutorStatistics;
