import React, { useState, useEffect } from 'react';
import {
  getRevenueTrends,
  getWithdrawalStatistics,
  RevenueTrendStatisticsDto,
  WithdrawalStatisticsDto,
} from '../../services/api';
import { LoadingSpinner } from '../common';
import { TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [trends, setTrends] = useState<RevenueTrendStatisticsDto | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalStatisticsDto | null>(null);
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

  const normalizeRevenueTrends = (data: any): RevenueTrendStatisticsDto => {
    const trendsArray = data.trends ?? data.Trends ?? [];
    return {
      trends: trendsArray.map((t: any) => ({
        date: t.date ?? t.Date ?? '',
        revenue: t.revenue ?? t.Revenue ?? 0,
        transactionCount: t.transactionCount ?? t.TransactionCount ?? 0,
      })),
      totalRevenueInPeriod: data.totalRevenueInPeriod ?? data.TotalRevenueInPeriod ?? 0,
      totalTransactionsInPeriod: data.totalTransactionsInPeriod ?? data.TotalTransactionsInPeriod ?? 0,
    };
  };

  const normalizeWithdrawalStatistics = (data: any): WithdrawalStatisticsDto => {
    const transactionsArray = data.transactions ?? data.Transactions ?? [];
    return {
      totalWithdrawalAmount: data.totalWithdrawalAmount ?? data.TotalWithdrawalAmount ?? 0,
      totalWithdrawalCount: data.totalWithdrawalCount ?? data.TotalWithdrawalCount ?? 0,
      pendingWithdrawalCount: data.pendingWithdrawalCount ?? data.PendingWithdrawalCount ?? 0,
      completedWithdrawalCount: data.completedWithdrawalCount ?? data.CompletedWithdrawalCount ?? 0,
      rejectedWithdrawalCount: data.rejectedWithdrawalCount ?? data.RejectedWithdrawalCount ?? 0,
      transactions: transactionsArray.map((t: any) => ({
        transactionId: t.transactionId ?? t.TransactionId ?? '',
        parentId: t.parentId ?? t.ParentId ?? '',
        parentName: t.parentName ?? t.ParentName ?? '',
        amount: t.amount ?? t.Amount ?? 0,
        status: t.status ?? t.Status ?? '',
        transactionDate: t.transactionDate ?? t.TransactionDate ?? '',
        description: t.description ?? t.Description ?? '',
      })),
    };
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [trendsRes, withdrawalsRes] = await Promise.all([
        getRevenueTrends(dateRange.startDate, dateRange.endDate),
        getWithdrawalStatistics(),
      ]);

      if (trendsRes.success && trendsRes.data) {
        setTrends(normalizeRevenueTrends(trendsRes.data));
      }
      if (withdrawalsRes.success && withdrawalsRes.data) {
        setWithdrawals(normalizeWithdrawalStatistics(withdrawalsRes.data));
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-green-700 mb-1 font-medium">Gross Revenue in Period</div>
                  <div className="text-3xl font-bold text-green-900">{Math.round(trends.totalRevenueInPeriod / 1000000)}M VND</div>
                  <div className="text-xs text-green-600 mt-1">
                    {new Date(dateRange.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(dateRange.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div className="p-4 bg-green-200 rounded-full">
                  <TrendingUp className="w-8 h-8 text-green-700" />
                </div>
              </div>
            </div>
            {(() => {
              // Calculate completed withdrawals in period
              const startDate = new Date(dateRange.startDate);
              const endDate = new Date(dateRange.endDate);
              endDate.setHours(23, 59, 59, 999); // Include entire end date
              
              const completedWithdrawalsInPeriod = withdrawals?.transactions
                .filter(t => {
                  const txDate = new Date(t.transactionDate);
                  return txDate >= startDate && 
                         txDate <= endDate && 
                         t.status.toLowerCase() === 'completed';
                })
                .reduce((sum, t) => sum + t.amount, 0) || 0;
              
              const netRevenue = trends.totalRevenueInPeriod - completedWithdrawalsInPeriod;
              
              return (
                <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 rounded-lg p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-indigo-700 mb-1 font-medium">Net Revenue in Period</div>
                      <div className="text-3xl font-bold text-indigo-900">{Math.round(netRevenue / 1000000)}M VND</div>
                      <div className="text-xs text-indigo-600 mt-1">
                        After withdrawals: -{Math.round(completedWithdrawalsInPeriod / 1000000)}M VND
                      </div>
                    </div>
                    <div className="p-4 bg-indigo-200 rounded-full">
                      <TrendingUp className="w-8 h-8 text-indigo-700" />
                    </div>
                  </div>
                </div>
              );
            })()}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-blue-700 mb-1 font-medium">Total Transactions in Period</div>
                  {(() => {
                    const startDate = new Date(dateRange.startDate);
                    const endDate = new Date(dateRange.endDate);
                    endDate.setHours(23, 59, 59, 999);
                    
                    const withdrawalsInPeriod = withdrawals?.transactions
                      .filter(w => {
                        const wDate = new Date(w.transactionDate);
                        return wDate >= startDate && wDate <= endDate;
                      }).length || 0;
                    
                    const totalTransactions = trends.totalTransactionsInPeriod + withdrawalsInPeriod;
                    
                    return (
                      <>
                        <div className="text-3xl font-bold text-blue-900">{totalTransactions.toLocaleString()}</div>
                        <div className="text-xs text-blue-600 mt-1">
                          {new Date(dateRange.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(dateRange.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </>
                    );
                  })()}
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
                data={trends.trends.map(t => {
                  // Calculate net revenue for this date
                  const trendDate = new Date(t.date);
                  const startOfDay = new Date(trendDate);
                  startOfDay.setHours(0, 0, 0, 0);
                  const endOfDay = new Date(trendDate);
                  endOfDay.setHours(23, 59, 59, 999);
                  
                  const completedWithdrawalsForDate = withdrawals?.transactions
                    .filter(w => {
                      const wDate = new Date(w.transactionDate);
                      return wDate >= startOfDay && 
                             wDate <= endOfDay && 
                             w.status.toLowerCase() === 'completed';
                    })
                    .reduce((sum, w) => sum + w.amount, 0) || 0;
                  
                  const netRevenue = t.revenue - completedWithdrawalsForDate;
                  
                  return {
                    date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    revenue: t.revenue,
                    netRevenue: netRevenue,
                    transactions: t.transactionCount
                  };
                })}
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
                    if (name === 'Gross Revenue (VND)' || name === 'Net Revenue (VND)') {
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
                  name="Gross Revenue (VND)"
                  animationDuration={1000}
                />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="netRevenue" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ fill: '#6366f1', r: 5 }}
                  activeDot={{ r: 8 }}
                  name="Net Revenue (VND)"
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Gross Revenue</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Withdrawals</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200">Net Revenue</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction Count</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trends.trends
                  .slice((trendsPage - 1) * ITEMS_PER_PAGE, trendsPage * ITEMS_PER_PAGE)
                  .map((trend, index) => {
                    // Calculate net revenue for this date
                    const trendDate = new Date(trend.date);
                    const startOfDay = new Date(trendDate);
                    startOfDay.setHours(0, 0, 0, 0);
                    const endOfDay = new Date(trendDate);
                    endOfDay.setHours(23, 59, 59, 999);
                    
                    const completedWithdrawalsForDate = withdrawals?.transactions
                      .filter(w => {
                        const wDate = new Date(w.transactionDate);
                        return wDate >= startOfDay && 
                               wDate <= endOfDay && 
                               w.status.toLowerCase() === 'completed';
                      })
                      .reduce((sum, w) => sum + w.amount, 0) || 0;
                    
                    const withdrawalsCountForDate = withdrawals?.transactions
                      .filter(w => {
                        const wDate = new Date(w.transactionDate);
                        return wDate >= startOfDay && wDate <= endOfDay;
                      }).length || 0;
                    
                    const netRevenue = trend.revenue - completedWithdrawalsForDate;
                    const totalTransactionCount = trend.transactionCount + withdrawalsCountForDate;
                    
                    return (
                      <tr key={index}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm border-r border-gray-200">
                          {new Date(trend.date).toLocaleDateString('en-US')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium border-r border-gray-200 text-green-700">
                          {trend.revenue.toLocaleString('en-US')} VND
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium border-r border-gray-200 text-purple-700">
                          {completedWithdrawalsForDate.toLocaleString('en-US')} VND
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium border-r border-gray-200 text-indigo-700">
                          {netRevenue.toLocaleString('en-US')} VND
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{totalTransactionCount.toLocaleString()}</td>
                      </tr>
                    );
                  })}
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

export default FinancialStatistics;
