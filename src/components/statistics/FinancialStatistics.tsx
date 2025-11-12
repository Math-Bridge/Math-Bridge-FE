import React, { useState, useEffect } from 'react';
import {
  getRevenueStatistics,
  getRevenueTrends,
  RevenueStatisticsDto,
  RevenueTrendStatisticsDto,
} from '../../services/api';
import { LoadingSpinner } from '../common';
import { DollarSign, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
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
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Revenue Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
              <div className="text-2xl font-bold text-green-600">
                {overview.totalRevenue.toLocaleString('en-US')} VND
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Average Transaction</div>
              <div className="text-2xl font-bold text-blue-600">
                {overview.averageTransactionAmount.toLocaleString('en-US')} VND
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Success Rate</div>
              <div className="text-2xl font-bold text-purple-600">{overview.successRate}%</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Total Transactions</div>
              <div className="text-xl font-semibold">{overview.totalTransactions}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Successful Transactions
              </div>
              <div className="text-xl font-semibold text-green-600">{overview.successfulTransactions}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <XCircle className="w-4 h-4 text-red-600" />
                Failed Transactions
              </div>
              <div className="text-xl font-semibold text-red-600">{overview.failedTransactions}</div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Trends */}
      {trends && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Revenue Trends
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Total Revenue in Period</div>
              <div className="text-2xl font-bold">{trends.totalRevenueInPeriod.toLocaleString('en-US')} VND</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Total Transactions in Period</div>
              <div className="text-2xl font-bold">{trends.totalTransactionsInPeriod}</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg mb-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends.trends.map(t => ({
                date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                revenue: t.revenue,
                transactions: t.transactionCount
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue (VND)" />
                <Line yAxisId="right" type="monotone" dataKey="transactions" stroke="#3b82f6" strokeWidth={2} name="Transactions" />
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
