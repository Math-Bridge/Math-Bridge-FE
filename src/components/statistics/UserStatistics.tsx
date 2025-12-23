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
import { Users, MapPin, Wallet, TrendingUp, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [registrationTrendsPage, setRegistrationTrendsPage] = useState(1);
  const [locationDistributionPage, setLocationDistributionPage] = useState(1);
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
      setRegistrationTrendsPage(1);
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
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
            <Users className="w-6 h-6 text-blue-600" />
            User Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Users className="w-6 h-6" />
                </div>
                <TrendingUp className="w-8 h-8 opacity-80" />
              </div>
              <p className="text-blue-100 text-sm font-medium mb-1">Total Users</p>
              <p className="text-3xl font-bold">{overview.totalUsers.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Users className="w-6 h-6" />
                </div>
                <TrendingUp className="w-8 h-8 opacity-80" />
              </div>
              <p className="text-green-100 text-sm font-medium mb-1">Parents</p>
              <p className="text-3xl font-bold">{overview.totalParents.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Users className="w-6 h-6" />
                </div>
                <TrendingUp className="w-8 h-8 opacity-80" />
              </div>
              <p className="text-purple-100 text-sm font-medium mb-1">Tutors</p>
              <p className="text-3xl font-bold">{overview.totalTutors.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Users className="w-6 h-6" />
                </div>
                <TrendingUp className="w-8 h-8 opacity-80" />
              </div>
              <p className="text-orange-100 text-sm font-medium mb-1">Active (24h)</p>
              <p className="text-3xl font-bold">{overview.activeUsersLast24Hours.toLocaleString()}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="text-sm text-gray-600 mb-2 font-medium">Active (Last Week)</div>
              <div className="text-2xl font-bold text-gray-900">{overview.activeUsersLastWeek.toLocaleString()}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="text-sm text-gray-600 mb-2 font-medium">Active (Last Month)</div>
              <div className="text-2xl font-bold text-gray-900">{overview.activeUsersLastMonth.toLocaleString()}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="text-sm text-gray-600 mb-2 font-medium">Admin & Staff</div>
              <div className="text-2xl font-bold text-gray-900">{(overview.totalAdmin + overview.totalStaff).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Registration Trends */}
      {registrationTrends && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              Registration Trends
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
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-blue-700 mb-1 font-medium">Total New Registrations in Period</div>
                <div className="text-3xl font-bold text-blue-900">{registrationTrends.totalNewUsersInPeriod.toLocaleString()}</div>
              </div>
              <div className="p-4 bg-blue-200 rounded-full">
                <Users className="w-8 h-8 text-blue-700" />
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 mb-6">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart 
                data={registrationTrends.trends.map(t => ({
                  date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  users: t.newUsers
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
                  dataKey="users" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 5 }}
                  activeDot={{ r: 8 }}
                  name="New Users"
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">New Users</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {registrationTrends.trends
                  .slice((registrationTrendsPage - 1) * ITEMS_PER_PAGE, registrationTrendsPage * ITEMS_PER_PAGE)
                  .map((trend, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm border-r border-gray-200">
                      {new Date(trend.date).toLocaleDateString('en-US')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{trend.newUsers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination for Registration Trends */}
          {registrationTrends.trends.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
              <div className="flex justify-between flex-1 sm:hidden">
                <button
                  onClick={() => setRegistrationTrendsPage(Math.max(1, registrationTrendsPage - 1))}
                  disabled={registrationTrendsPage === 1}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setRegistrationTrendsPage(Math.min(Math.ceil(registrationTrends.trends.length / ITEMS_PER_PAGE), registrationTrendsPage + 1))}
                  disabled={registrationTrendsPage >= Math.ceil(registrationTrends.trends.length / ITEMS_PER_PAGE)}
                  className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(registrationTrendsPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium">{Math.min(registrationTrendsPage * ITEMS_PER_PAGE, registrationTrends.trends.length)}</span> of <span className="font-medium">{registrationTrends.trends.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setRegistrationTrendsPage(Math.max(1, registrationTrendsPage - 1))}
                      disabled={registrationTrendsPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    {Array.from({ length: Math.ceil(registrationTrends.trends.length / ITEMS_PER_PAGE) }).map((_, i) => {
                        const page = i + 1;
                        const totalPages = Math.ceil(registrationTrends.trends.length / ITEMS_PER_PAGE);
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= registrationTrendsPage - 1 && page <= registrationTrendsPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setRegistrationTrendsPage(page)}
                              aria-current={page === registrationTrendsPage ? 'page' : undefined}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                page === registrationTrendsPage
                                  ? 'bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                  : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          (page === registrationTrendsPage - 2 && page > 1) ||
                          (page === registrationTrendsPage + 2 && page < totalPages)
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
                      onClick={() => setRegistrationTrendsPage(Math.min(Math.ceil(registrationTrends.trends.length / ITEMS_PER_PAGE), registrationTrendsPage + 1))}
                      disabled={registrationTrendsPage >= Math.ceil(registrationTrends.trends.length / ITEMS_PER_PAGE)}
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

      {/* Location Distribution */}
      {locationDistribution && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
            <MapPin className="w-6 h-6 text-blue-600" />
            Location Distribution ({locationDistribution.totalCities} cities)
          </h2>
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 mb-6">
            <ResponsiveContainer width="100%" height={450}>
              <BarChart 
                data={locationDistribution.cityDistribution.slice(0, 10).map(city => ({
                  city: city.city,
                  users: city.userCount
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="city" 
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
                  dataKey="users" 
                  fill="#3b82f6" 
                  name="User Count"
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">City</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Count</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {locationDistribution.cityDistribution
                  .slice((locationDistributionPage - 1) * ITEMS_PER_PAGE, locationDistributionPage * ITEMS_PER_PAGE)
                  .map((city, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium border-r border-gray-200">{city.city}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{city.userCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination for Location Distribution */}
          {locationDistribution.cityDistribution.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
              <div className="flex justify-between flex-1 sm:hidden">
                <button
                  onClick={() => setLocationDistributionPage(Math.max(1, locationDistributionPage - 1))}
                  disabled={locationDistributionPage === 1}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setLocationDistributionPage(Math.min(Math.ceil(locationDistribution.cityDistribution.length / ITEMS_PER_PAGE), locationDistributionPage + 1))}
                  disabled={locationDistributionPage >= Math.ceil(locationDistribution.cityDistribution.length / ITEMS_PER_PAGE)}
                  className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(locationDistributionPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium">{Math.min(locationDistributionPage * ITEMS_PER_PAGE, locationDistribution.cityDistribution.length)}</span> of <span className="font-medium">{locationDistribution.cityDistribution.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setLocationDistributionPage(Math.max(1, locationDistributionPage - 1))}
                      disabled={locationDistributionPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    {Array.from({ length: Math.ceil(locationDistribution.cityDistribution.length / ITEMS_PER_PAGE) }).map((_, i) => {
                        const page = i + 1;
                        const totalPages = Math.ceil(locationDistribution.cityDistribution.length / ITEMS_PER_PAGE);
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= locationDistributionPage - 1 && page <= locationDistributionPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setLocationDistributionPage(page)}
                              aria-current={page === locationDistributionPage ? 'page' : undefined}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                page === locationDistributionPage
                                  ? 'bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                  : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          (page === locationDistributionPage - 2 && page > 1) ||
                          (page === locationDistributionPage + 2 && page < totalPages)
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
                      onClick={() => setLocationDistributionPage(Math.min(Math.ceil(locationDistribution.cityDistribution.length / ITEMS_PER_PAGE), locationDistributionPage + 1))}
                      disabled={locationDistributionPage >= Math.ceil(locationDistribution.cityDistribution.length / ITEMS_PER_PAGE)}
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

      {/* Wallet Statistics */}
      {walletStats && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
            <Wallet className="w-6 h-6 text-blue-600" />
            Wallet Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Wallet className="w-6 h-6" />
                </div>
                <TrendingUp className="w-8 h-8 opacity-80" />
              </div>
              <p className="text-blue-100 text-sm font-medium mb-1">Total Balance</p>
              <p className="text-2xl font-bold">{Math.round(walletStats.totalWalletBalance / 1000000)}M VND</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Wallet className="w-6 h-6" />
                </div>
                <TrendingUp className="w-8 h-8 opacity-80" />
              </div>
              <p className="text-green-100 text-sm font-medium mb-1">Average Balance</p>
              <p className="text-2xl font-bold">{Math.round(walletStats.averageWalletBalance / 1000)}K VND</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Wallet className="w-6 h-6" />
                </div>
                <TrendingUp className="w-8 h-8 opacity-80" />
              </div>
              <p className="text-purple-100 text-sm font-medium mb-1">Median Balance</p>
              <p className="text-2xl font-bold">{Math.round(walletStats.medianWalletBalance / 1000)}K VND</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Wallet className="w-6 h-6" />
                </div>
                <TrendingUp className="w-8 h-8 opacity-80" />
              </div>
              <p className="text-orange-100 text-sm font-medium mb-1">Users with Balance</p>
              <p className="text-3xl font-bold">{walletStats.usersWithPositiveBalance.toLocaleString()}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="text-sm text-gray-600 mb-2 font-medium">Min Balance</div>
              <div className="text-xl font-bold text-gray-900">{walletStats.minWalletBalance.toLocaleString('en-US')} VND</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="text-sm text-gray-600 mb-2 font-medium">Max Balance</div>
              <div className="text-xl font-bold text-gray-900">{walletStats.maxWalletBalance.toLocaleString('en-US')} VND</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="text-sm text-gray-600 mb-2 font-medium">Users with Zero Balance</div>
              <div className="text-xl font-bold text-gray-900">{walletStats.usersWithZeroBalance.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserStatistics;

