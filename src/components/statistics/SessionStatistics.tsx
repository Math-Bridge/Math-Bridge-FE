import React, { useState, useEffect } from 'react';
import {
  getSessionStatistics,
  getSessionOnlineVsOffline,
  getSessionTrends,
  SessionStatisticsDto,
  SessionOnlineVsOfflineDto,
  SessionTrendStatisticsDto,
} from '../../services/api';
import { LoadingSpinner } from '../common';
import { Calendar, Monitor, MapPin, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { sanitizeDateRange, todayString } from '../../utils/dateUtils';

const SessionStatistics: React.FC = () => {
  const [overview, setOverview] = useState<SessionStatisticsDto | null>(null);
  const [onlineVsOffline, setOnlineVsOffline] = useState<SessionOnlineVsOfflineDto | null>(null);
  const [trends, setTrends] = useState<SessionTrendStatisticsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [dateValidationMessage, setDateValidationMessage] = useState<string | null>(null);
  const [trendsPage, setTrendsPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const todayIso = todayString();

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const { range, error: validationMessage } = sanitizeDateRange(dateRange, field, value, {
      maxDate: todayIso,
    });
    setDateValidationMessage(validationMessage);

    if (
      range.startDate !== dateRange.startDate ||
      range.endDate !== dateRange.endDate
    ) {
      setDateRange(range);
      setTrendsPage(1);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [dateRange]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, onlineVsOfflineRes, trendsRes] = await Promise.all([
        getSessionStatistics(),
        getSessionOnlineVsOffline(),
        getSessionTrends(dateRange.startDate, dateRange.endDate),
      ]);

      if (overviewRes.success && overviewRes.data) {
        setOverview(overviewRes.data);
      }
      if (onlineVsOfflineRes.success && onlineVsOfflineRes.data) {
        setOnlineVsOffline(onlineVsOfflineRes.data);
      }
      if (trendsRes.success && trendsRes.data) {
        setTrends(trendsRes.data);
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
        <div className="bg-white rounded-xl shadow-md border border-gray-200/50 p-6 backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
            <Calendar className="w-6 h-6 text-blue-600" />
            Session Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Calendar className="w-6 h-6" />
                </div>
                <TrendingUp className="w-8 h-8 opacity-80" />
              </div>
              <p className="text-blue-100 text-sm font-medium mb-1">Total Sessions</p>
              <p className="text-3xl font-bold">{overview.totalSessions}</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Calendar className="w-6 h-6" />
                </div>
                <Monitor className="w-8 h-8 opacity-80" />
              </div>
              <p className="text-green-100 text-sm font-medium mb-1">Completed</p>
              <p className="text-3xl font-bold">{overview.completedSessions}</p>
              <p className="text-green-100 text-xs mt-1">
                {overview.totalSessions > 0 
                  ? Math.round((overview.completedSessions / overview.totalSessions) * 100) 
                  : 0}% of total
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Calendar className="w-6 h-6" />
                </div>
                <Monitor className="w-8 h-8 opacity-80" />
              </div>
              <p className="text-red-100 text-sm font-medium mb-1">Cancelled</p>
              <p className="text-3xl font-bold">{overview.cancelledSessions}</p>
              <p className="text-red-100 text-xs mt-1">
                {overview.totalSessions > 0 
                  ? Math.round((overview.cancelledSessions / overview.totalSessions) * 100) 
                  : 0}% of total
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Online vs Offline */}
      {onlineVsOffline && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
            <Monitor className="w-6 h-6 text-blue-600" />
            Online vs Offline Comparison
          </h2>
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 mb-6">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Online', value: onlineVsOffline.onlineSessions },
                    { name: 'Offline', value: onlineVsOffline.offlineSessions },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  animationDuration={1000}
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#10b981" />
                </Pie>
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
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold">Online</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">{onlineVsOffline.onlineSessions}</span>
              </div>
              <div className="text-sm text-gray-600">Percentage: {onlineVsOffline.onlinePercentage}%</div>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <span className="font-semibold">Offline</span>
                </div>
                <span className="text-2xl font-bold text-green-600">{onlineVsOffline.offlineSessions}</span>
              </div>
              <div className="text-sm text-gray-600">Percentage: {onlineVsOffline.offlinePercentage}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Trends */}
      {trends && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              Session Trends
            </h2>
            <div className="flex gap-3">
              <input
                type="date"
                value={dateRange.startDate}
                max={dateRange.endDate < todayIso ? dateRange.endDate : todayIso}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
              <span className="self-center text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.endDate}
                min={dateRange.startDate}
                max={todayIso}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
            </div>
          </div>
          {dateValidationMessage && (
            <p className="text-xs text-red-600 mt-1 mb-4" role="alert">
              {dateValidationMessage}
            </p>
          )}
          <div className="bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-lg p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-green-700 mb-1 font-medium">Total Sessions in Period</div>
                <div className="text-3xl font-bold text-green-900">{trends.totalSessionsInPeriod.toLocaleString()}</div>
              </div>
              <div className="p-4 bg-green-200 rounded-full">
                <Calendar className="w-8 h-8 text-green-700" />
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 mb-6">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart 
                data={trends.trends.map(t => ({
                  date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  sessions: t.sessionCount
                }))}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
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
                <Line 
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 5 }}
                  activeDot={{ r: 8 }}
                  name="Sessions"
                  animationDuration={1000}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session Count</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trends.trends
                  .slice((trendsPage - 1) * ITEMS_PER_PAGE, trendsPage * ITEMS_PER_PAGE)
                  .map((trend, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm border-r border-gray-200">
                      {new Date(trend.date).toLocaleDateString('en-US')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{trend.sessionCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination for Trends */}
          {trends.trends.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
              <div className="flex justify-between flex-1 sm:hidden">
                <button
                  onClick={() => setTrendsPage(Math.max(1, trendsPage - 1))}
                  disabled={trendsPage === 1}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setTrendsPage(Math.min(Math.ceil(trends.trends.length / ITEMS_PER_PAGE), trendsPage + 1))}
                  disabled={trendsPage >= Math.ceil(trends.trends.length / ITEMS_PER_PAGE)}
                  className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(trendsPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium">{Math.min(trendsPage * ITEMS_PER_PAGE, trends.trends.length)}</span> of <span className="font-medium">{trends.trends.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setTrendsPage(Math.max(1, trendsPage - 1))}
                      disabled={trendsPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    {Array.from({ length: Math.ceil(trends.trends.length / ITEMS_PER_PAGE) }).map((_, i) => {
                        const page = i + 1;
                        const totalPages = Math.ceil(trends.trends.length / ITEMS_PER_PAGE);
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= trendsPage - 1 && page <= trendsPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setTrendsPage(page)}
                              aria-current={page === trendsPage ? 'page' : undefined}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                page === trendsPage
                                  ? 'bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                  : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          (page === trendsPage - 2 && page > 1) ||
                          (page === trendsPage + 2 && page < totalPages)
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
                      onClick={() => setTrendsPage(Math.min(Math.ceil(trends.trends.length / ITEMS_PER_PAGE), trendsPage + 1))}
                      disabled={trendsPage >= Math.ceil(trends.trends.length / ITEMS_PER_PAGE)}
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

export default SessionStatistics;

