import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CreditCard,
  QrCode,
  CheckCircle,
  Clock,
  AlertCircle,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  createSePayPayment,
  checkSePayPaymentStatus,
  SePayPaymentRequest,
  SePayPaymentResponse,
  PaymentStatus,
  apiService,
} from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../hooks/useAuth';

const TopUpComponent: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();
  
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentResponse, setPaymentResponse] = useState<SePayPaymentResponse | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // Quick amount options
  const quickAmounts = [50000, 100000, 200000, 500000, 1000000, 2000000];

  // Check wallet balance every 5 seconds
  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (!user?.id) return;
      
      try {
        const res = await apiService.getUserWallet(user.id);
        if (res.success && res.data) {
          const balance = res.data.walletBalance || 0;
          setWalletBalance(balance);
        }
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
      }
    };

    // Fetch initial balance
    fetchWalletBalance();

    // Check balance every 5 seconds
    const balanceInterval = setInterval(fetchWalletBalance, 5000);

    return () => clearInterval(balanceInterval);
  }, [user?.id]);

  // Poll payment status if payment is pending
  useEffect(() => {
    if (paymentResponse && isPolling) {
      const interval = setInterval(async () => {
        try {
          const response = await checkSePayPaymentStatus(paymentResponse.walletTransactionId);
          if (response.success && response.data) {
            setPaymentStatus(response.data);
            if (response.data.status === 'Paid') {
              setIsPolling(false);
              showSuccess('Payment successful! Amount has been updated to your wallet.');
              // Refresh wallet balance immediately
              if (user?.id) {
                try {
                  const res = await apiService.getUserWallet(user.id);
                  if (res.success && res.data) {
                    setWalletBalance(res.data.walletBalance || 0);
                  }
                } catch (error) {
                  console.error('Error fetching wallet balance:', error);
                }
              }
              // Redirect to wallet page after 2 seconds
              setTimeout(() => {
                navigate('/wallet');
              }, 2000);
            }
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
        }
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [paymentResponse, isPolling, navigate, showSuccess, user?.id]);

  const handleAmountSelect = (selectedAmount: number) => {
    setAmount(selectedAmount.toString());
  };

  const handleCreatePayment = async () => {
    const amountNum = parseFloat(amount);
    
    if (!amount || amountNum <= 0) {
      showError('Please enter a valid amount');
      return;
    }

    if (amountNum < 10000) {
      showError('Minimum amount is 10,000 VND');
      return;
    }

    if (amountNum > 50000000) {
      showError('Maximum amount is 50,000,000 VND');
      return;
    }

    try {
      setLoading(true);
      const request: SePayPaymentRequest = {
        amount: amountNum,
        description: 'Top up wallet',
      };

      const result = await createSePayPayment(request);
      
      if (result.success && result.data) {
        setPaymentResponse(result.data);
        setIsPolling(true);
        showSuccess('Payment request created successfully');
      } else {
        // Extract detailed error message
        let errorMsg = result.error || 'Failed to create payment request';
        
        // If there are error details, include them
        if ((result as any).errorDetails) {
          const details = (result as any).errorDetails;
          if (typeof details === 'string') {
            errorMsg = details;
          } else if (Array.isArray(details)) {
            errorMsg = details.join(', ');
          } else if (typeof details === 'object') {
            // Try to extract message from object
            errorMsg = details.message || details.error || JSON.stringify(details);
          }
        }
        
        console.error('Payment creation failed:', {
          error: errorMsg,
          fullResult: result,
          errorDetails: (result as any).errorDetails
        });
        
        // Provide user-friendly error message
        let userMessage = errorMsg;
        if (errorMsg.includes('An error occurred while creating payment request')) {
          userMessage = 'Failed to create payment request. Please check:\n' +
            '1. Valid amount (10,000 - 50,000,000 VND)\n' +
            '2. Stable network connection\n' +
            '3. Try again in a few minutes\n\n' +
            'If the problem persists, please contact support with the following information:\n' +
            `- Amount: ${formatCurrency(amountNum)}`;
        }
        
        showError(userMessage);
      }
    } catch (error: any) {
      console.error('Error creating payment:', error);
      showError(error?.message || 'An error occurred while creating payment request');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    showSuccess('Copied!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCheckStatus = async () => {
    if (!paymentResponse) return;
    
    try {
      const response = await checkSePayPaymentStatus(paymentResponse.walletTransactionId);
      if (response.success && response.data) {
        setPaymentStatus(response.data);
        if (response.data.status === 'Paid') {
          showSuccess('Payment has been confirmed!');
          setTimeout(() => {
            navigate('/wallet');
          }, 2000);
        } else {
          showError('Payment not confirmed yet. Please try again later.');
        }
      } else {
        showError(response.error || 'Unable to check payment status');
      }
    } catch (error) {
      showError('Unable to check payment status');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  if (paymentResponse) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => {
              setPaymentResponse(null);
              setPaymentStatus(null);
              setIsPolling(false);
            }}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Pay via SePay</h1>
              <p className="text-gray-600">Scan QR code or transfer using the information below</p>
            </div>

            {/* Payment Status */}
            {paymentStatus && (
              <div className={`mb-6 p-4 rounded-lg ${
                paymentStatus.status === 'Paid'
                  ? 'bg-green-50 border border-green-200'
                  : paymentStatus.status === 'Pending'
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {paymentStatus.status === 'Paid' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-600" />
                  )}
                  <span className={`font-semibold ${
                    paymentStatus.status === 'Paid' ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {paymentStatus.status === 'Paid' ? 'Paid' : 'Pending Payment'}
                  </span>
                </div>
              </div>
            )}

            {/* Current Wallet Balance */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Current Wallet Balance</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {formatCurrency(walletBalance)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-blue-600">Auto-updating every 5s</p>
                  <RefreshCw className="w-4 h-4 text-blue-600 mt-1 animate-spin" />
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="mb-6 text-center">
              <div className="inline-block p-4 bg-gray-50 rounded-lg">
                <img
                  src={paymentResponse.qrCodeUrl}
                  alt="QR Code"
                  className="w-64 h-64 mx-auto"
                />
              </div>
              <p className="text-sm text-gray-600 mt-4">
                Scan QR code with your banking app
              </p>
            </div>

            {/* Payment Details */}
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Amount:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(paymentResponse.amount)}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-sm font-medium text-gray-600 mb-2 block">
                  Transfer Content:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={paymentResponse.transferContent}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white font-mono text-sm"
                  />
                  <button
                    onClick={() => handleCopy(paymentResponse.transferContent, 'content')}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    {copiedField === 'content' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-sm font-medium text-gray-600 mb-2 block">
                  Bank Account Information:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={paymentResponse.bankInfo}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white font-mono text-sm"
                  />
                  <button
                    onClick={() => handleCopy(paymentResponse.bankInfo, 'bank')}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    {copiedField === 'bank' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-sm font-medium text-gray-600 mb-2 block">
                  Reference Code:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={paymentResponse.orderReference}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white font-mono text-sm"
                  />
                  <button
                    onClick={() => handleCopy(paymentResponse.orderReference, 'reference')}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    {copiedField === 'reference' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Payment Instructions:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>Scan QR code with your banking app</li>
                <li>Or transfer with exact content as shown above</li>
                <li>Amount: {formatCurrency(paymentResponse.amount)}</li>
                <li>System will automatically update after receiving payment</li>
              </ol>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={handleCheckStatus}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Check Status</span>
              </button>
              <button
                onClick={() => navigate('/wallet')}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Wallet
              </button>
            </div>

            {isPolling && (
              <div className="mt-4 text-center">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Auto-checking payment status...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/wallet')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Top Up Wallet</h1>
            <p className="text-gray-600">Select the amount you want to add to your wallet</p>
          </div>

          {/* Quick Amount Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quick Amount Selection:
            </label>
            <div className="grid grid-cols-3 gap-3">
              {quickAmounts.map((quickAmount) => (
                <button
                  key={quickAmount}
                  onClick={() => handleAmountSelect(quickAmount)}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    amount === quickAmount.toString()
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {formatCurrency(quickAmount)}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or enter custom amount:
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (VND)"
                min="10000"
                max="50000000"
                step="1000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                VND
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimum: 10,000 VND - Maximum: 50,000,000 VND
            </p>
            {amount && parseFloat(amount) > 0 && (
              <p className="text-sm font-semibold text-gray-900 mt-2">
                = {formatCurrency(parseFloat(amount))}
              </p>
            )}
          </div>

          {/* Payment Method Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <QrCode className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Pay via SePay</h3>
            </div>
            <p className="text-sm text-blue-800">
              You will receive a QR code to scan and pay with your banking app
            </p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleCreatePayment}
            disabled={loading || !amount || parseFloat(amount) < 10000}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span>Continue to Payment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopUpComponent;

