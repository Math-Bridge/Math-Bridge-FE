import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';

interface WalletTransaction {
  id: number;
  type: string;
  amount: number;
  date: string;
  description?: string;
}

const WalletHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWallet = async () => {
      setLoading(true);
      setError(null);
      const user = localStorage.getItem('user');
      let userId = '';
      try {
        userId = user ? JSON.parse(user).id : '';
      } catch {
        userId = '';
      }
      if (!userId) {
        setError('User not found');
        setLoading(false);
        return;
      }
      const res = await apiService.getUserWallet(userId);
      if (res.success && res.data) {
        setTransactions(res.data.transactions);
      } else {
        setError(res.error || 'Failed to load wallet history');
      }
      setLoading(false);
    };
    fetchWallet();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8 animate-fade-in">
      <h2 className="text-2xl font-bold mb-4 text-blue-900">Wallet Transaction History</h2>
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-600">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-blue-50">
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} className="border-b last:border-none">
                  <td className="px-4 py-2">{tx.date}</td>
                  <td className="px-4 py-2">{tx.type}</td>
                  <td className="px-4 py-2">{tx.description || '-'}</td>
                  <td className={`px-4 py-2 text-right ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} VND
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WalletHistory;
