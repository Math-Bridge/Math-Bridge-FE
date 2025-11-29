import React, { useState, useEffect } from 'react';
import {
  getRevenueStatistics,
  getRevenueTrends,
  RevenueStatisticsDto,
  RevenueTrendStatisticsDto,
} from '../../services/api';
import { LoadingSpinner } from '../common';
import { TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { sanitizeDateRange, todayString } from '../../utils/dateUtils';

const FinancialStatistics: React.FC = () => {
  const [overview, setOverview] = useState<RevenueStatisticsDto | null>(null);
  const [trends, setTrends] = useState<RevenueTrendStatisticsDto | null>(null);
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
      const [overviewRes, trendsRes] = await Promise.all([
        getRevenueStatistics(),
        getRevenueTrends(dateRange.startDate, dateRange.endDate),
      ]);

      if (overviewRes.success && overviewRes.data) {
        setOverview(overviewRes.data);
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
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
            Revenue Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <TrendingUp className="w-8 h-8 opacity-80" />
              </div>
              <p className="text-green-100 text-sm font-medium mb-1">Total Revenue</p>
              <p className="text-3xl font-bold">{Math.round(overview.totalRevenue / 1000000)}M VND</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <TrendingUp className="w-8 h-8 opacity-80" />
              </div>
              <p className="text-blue-100 text-sm font-medium mb-1">Average Transaction</p>
              <p className="text-2xl font-bold">{Math.round(overview.averageTransactionAmount / 1000)}K VND</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <CheckCircle className="w-8 h-8 opacity-80" />
              </div>
              <p className="text-purple-100 text-sm font-medium mb-1">Success Rate</p>
              <p className="text-3xl font-bold">{overview.successRate}%</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="text-sm text-gray-600 mb-2 font-medium">Total Transactions</div>
              <div className="text-2xl font-bold text-gray-900">{overview.totalTransactions.toLocaleString()}</div>
            </div>
            <div className="bg-white border-l-4 border-green-500 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2 font-medium">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Successful Transactions
              </div>
              <div className="text-2xl font-bold text-green-600">{overview.successfulTransactions.toLocaleString()}</div>
            </div>
            <div className="bg-white border-l-4 border-red-500 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2 font-medium">
                <XCircle className="w-5 h-5 text-red-600" />
                Failed Transactions
              </div>
              <div className="text-2xl font-bold text-red-600">{overview.failedTransactions.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Trends */}
      {trends && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
              <TrendingUp className="w-6 h-6 text-green-600" />
              Revenue Trends
            </h2>
            <div className="flex gap-3">
              <input
                type="date"
                value={dateRange.startDate}
                max={dateRange.endDate < todayIso ? dateRange.endDate : todayIso}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
              />
              <span className="self-center text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.endDate}
                min={dateRange.startDate}
                max={todayIso}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
              />
            </div>
          </div>
          {dateValidationMessage && (
            <p className="text-xs text-red-600 mt-1 mb-4" role="alert">
              {dateValidationMessage}
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-green-700 mb-1 font-medium">Total Revenue in Period</div>
                  <div className="text-3xl font-bold text-green-900">{Math.round(trends.totalRevenueInPeriod / 1000000)}M VND</div>
                </div>
                <div className="p-4 bg-green-200 rounded-full">
                  <TrendingUp className="w-8 h-8 text-green-700" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-blue-700 mb-1 font-medium">Total Transactions in Period</div>
                  <div className="text-3xl font-bold text-blue-900">{trends.totalTransactionsInPeriod.toLocaleString()}</div>
                </div>
                <div className="p-4 bg-blue-200 rounded-full">
                  <TrendingUp className="w-8 h-8 text-blue-700" />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 mb-6">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart 
                data={trends.trends.map(t => ({
                  date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  revenue: t.revenue,
                  transactions: t.transactionCount
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
                  yAxisId="left" 
                  stroke="#10b981"
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#10b981' }}
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
                  formatter={(value: any, name: string) => {
                    if (name === 'Revenue (VND)') {
                      return [`${Math.round(value / 1000)}K VND`, name];
                    }
                    return [value, name];
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 5 }}
                  activeDot={{ r: 8 }}
                  name="Revenue (VND)"
                  animationDuration={1000}
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="transactions" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 5 }}
                  activeDot={{ r: 8 }}
                  name="Transactions"
                  animationDuration={1000}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction Count</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trends.trends.map((trend, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {new Date(trend.date).toLocaleDateString('en-US')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      {trend.revenue.toLocaleString('en-US')} VND
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{trend.transactionCount}</td>
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

export default FinancialStatistics;
