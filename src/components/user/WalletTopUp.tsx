import React from 'react';

const WalletTopUp: React.FC = () => {
  // Placeholder UI, real implementation would have payment integration
  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8 animate-fade-in">
      <h2 className="text-2xl font-bold mb-4 text-blue-900">Top Up Wallet</h2>
      <div className="mb-6 text-gray-700">
        <p>Choose a method and amount to top up your wallet.</p>
      </div>
      <form className="space-y-4">
        <div>
          <label className="block text-gray-600 mb-1">Amount</label>
          <input type="number" min="10000" step="10000" className="form-input w-full" placeholder="Enter amount (VND)" />
        </div>
        <div>
          <label className="block text-gray-600 mb-1">Payment Method</label>
          <select className="form-input w-full">
            <option value="bank">Bank Transfer</option>
            <option value="momo">Momo</option>
            <option value="credit">Credit Card</option>
          </select>
        </div>
        <button type="submit" className="btn-primary w-full">Top Up</button>
      </form>
      <div className="mt-6 text-xs text-gray-500">* This is a demo. Payment integration coming soon.</div>
    </div>
  );
};

export default WalletTopUp;
