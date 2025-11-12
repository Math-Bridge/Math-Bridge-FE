import React, { useState, useEffect } from 'react';
import {
  getUserStatistics,
  getUserRegistrationTrends,
  getUserLocationDistribution,
  getWalletStatistics,
  UserStatisticsDto,
  UserRegistrationTrendStatisticsDto,
  UserLocationStatisticsDto,
  WalletStatisticsDto,
} from '../../services/api';
import { LoadingSpinner } from '../common';
import { Users, MapPin, Wallet, TrendingUp, Calendar } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { sanitizeDateRange, todayString } from '../../utils/dateUtils';

const UserStatistics: React.FC = () => {
  const [overview, setOverview] = useState<UserStatisticsDto | null>(null);
  const [registrationTrends, setRegistrationTrends] = useState<UserRegistrationTrendStatisticsDto | null>(null);
  const [locationDistribution, setLocationDistribution] = useState<UserLocationStatisticsDto | null>(null);
  const [walletStats, setWalletStats] = useState<WalletStatisticsDto | null>(null);
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
      const [overviewRes, trendsRes, locationRes, walletRes] = await Promise.all([
        getUserStatistics(),
        getUserRegistrationTrends(dateRange.startDate, dateRange.endDate),
        getUserLocationDistribution(),
        getWalletStatistics(),
      ]);

      if (overviewRes.success && overviewRes.data) {
        setOverview(overviewRes.data);
      }
      if (trendsRes.success && trendsRes.data) {
        setRegistrationTrends(trendsRes.data);
      }
      if (locationRes.success && locationRes.data) {
        setLocationDistribution(locationRes.data);
      }
      if (walletRes.success && walletRes.data) {
        setWalletStats(walletRes.data);
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
            <Users className="w-5 h-5" />
            User Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Total Users</div>
              <div className="text-2xl font-bold text-blue-600">{overview.totalUsers}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Parents</div>
              <div className="text-2xl font-bold text-green-600">{overview.totalParents}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Tutors</div>
              <div className="text-2xl font-bold text-purple-600">{overview.totalTutors}</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Active (24h)</div>
              <div className="text-2xl font-bold text-orange-600">{overview.activeUsersLast24Hours}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Active (Last Week)</div>
              <div className="text-xl font-semibold">{overview.activeUsersLastWeek}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Active (Last Month)</div>
              <div className="text-xl font-semibold">{overview.activeUsersLastMonth}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Admin & Staff</div>
              <div className="text-xl font-semibold">{overview.totalAdmin + overview.totalStaff}</div>
            </div>
          </div>
        </div>
      )}

      {/* Registration Trends */}
      {registrationTrends && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Registration Trends
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
            <div className="text-sm text-gray-600 mb-1">Total New Registrations in Period</div>
            <div className="text-2xl font-bold">{registrationTrends.totalNewUsersInPeriod}</div>
          </div>
          <div className="bg-white p-4 rounded-lg mb-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={registrationTrends.trends.map(t => ({
                date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                users: t.newUsers
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} name="New Users" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">New Users</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {registrationTrends.trends.map((trend, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {new Date(trend.date).toLocaleDateString('en-US')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{trend.newUsers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Location Distribution */}
      {locationDistribution && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Location Distribution ({locationDistribution.totalCities} cities)
          </h2>
          <div className="bg-white p-4 rounded-lg mb-4">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={locationDistribution.cityDistribution.slice(0, 10).map(city => ({
                city: city.city,
                users: city.userCount
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="city" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="users" fill="#3b82f6" name="User Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Count</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {locationDistribution.cityDistribution.map((city, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{city.city}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{city.userCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Wallet Statistics */}
      {walletStats && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Wallet Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Total Balance</div>
              <div className="text-xl font-bold text-blue-600">
                {walletStats.totalWalletBalance.toLocaleString('en-US')} VND
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Average Balance</div>
              <div className="text-xl font-bold text-green-600">
                {walletStats.averageWalletBalance.toLocaleString('en-US')} VND
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Median Balance</div>
              <div className="text-xl font-bold text-purple-600">
                {walletStats.medianWalletBalance.toLocaleString('en-US')} VND
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Users with Balance</div>
              <div className="text-xl font-bold text-orange-600">{walletStats.usersWithPositiveBalance}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Min Balance</div>
              <div className="text-lg font-semibold">{walletStats.minWalletBalance.toLocaleString('en-US')} VND</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Max Balance</div>
              <div className="text-lg font-semibold">{walletStats.maxWalletBalance.toLocaleString('en-US')} VND</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Users with Zero Balance</div>
              <div className="text-lg font-semibold">{walletStats.usersWithZeroBalance}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserStatistics;

