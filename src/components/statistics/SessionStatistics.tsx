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
import { Calendar, Monitor, MapPin, TrendingUp } from 'lucide-react';
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
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Session Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Total Sessions</div>
              <div className="text-2xl font-bold text-blue-600">{overview.totalSessions}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Completed</div>
              <div className="text-2xl font-bold text-green-600">{overview.completedSessions}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Completion Rate</div>
              <div className="text-2xl font-bold text-purple-600">{overview.completionRate}%</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Upcoming</div>
              <div className="text-2xl font-bold text-orange-600">{overview.upcomingSessions}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Cancelled</div>
              <div className="text-2xl font-bold text-red-600">{overview.cancelledSessions}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Rescheduled</div>
              <div className="text-2xl font-bold text-yellow-600">{overview.rescheduledSessions}</div>
            </div>
          </div>
        </div>
      )}

      {/* Online vs Offline */}
      {onlineVsOffline && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Online vs Offline Comparison
          </h2>
          <div className="bg-white p-4 rounded-lg mb-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Online', value: onlineVsOffline.onlineSessions },
                    { name: 'Offline', value: onlineVsOffline.offlineSessions },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#10b981" />
                </Pie>
                <Tooltip />
                <Legend />
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
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Session Trends
            </h2>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.startDate}
                max={dateRange.endDate < todayIso ? dateRange.endDate : todayIso}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              />
              <input
                type="date"
                value={dateRange.endDate}
                min={dateRange.startDate}
                max={todayIso}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
          {dateValidationMessage && (
            <p className="text-xs text-red-600 mt-1 mb-4" role="alert">
              {dateValidationMessage}
            </p>
          )}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="text-sm text-gray-600 mb-1">Total Sessions in Period</div>
            <div className="text-2xl font-bold">{trends.totalSessionsInPeriod}</div>
          </div>
          <div className="bg-white p-4 rounded-lg mb-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends.trends.map(t => ({
                date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                sessions: t.sessionCount
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sessions" stroke="#10b981" strokeWidth={2} name="Sessions" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session Count</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trends.trends.map((trend, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {new Date(trend.date).toLocaleDateString('en-US')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{trend.sessionCount}</td>
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

export default SessionStatistics;

