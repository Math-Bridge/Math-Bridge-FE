import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CreditCard,
  QrCode,
  CheckCircle,
  Clock,
  Copy,
  RefreshCw,
  Wallet,
  Sparkles,
  Shield,
  Zap
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

  const [amount, setAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentResponse, setPaymentResponse] = useState<SePayPaymentResponse | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // Quick amount options (locked input - only these can be selected)
  const quickAmounts = [500000, 1000000,1500000, 2000000, 3000000, 5000000];

  // Fetch wallet balance every 5sss
  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (!user?.id) return;
      try {
        const res = await apiService.getUserWallet(user.id);
        if (res.success && res.data) {
          setWalletBalance(res.data.walletBalance || 0);
        }
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
      }
    };

    fetchWalletBalance();
    const interval = setInterval(fetchWalletBalance, 5000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Poll payment status
  useEffect(() => {
    if (paymentResponse && isPolling) {
      const interval = setInterval(async () => {
        try {
          const response = await checkSePayPaymentStatus(paymentResponse.walletTransactionId);
          if (response.success && response.data) {
            setPaymentStatus(response.data);
            if (response.data.status === 'Paid') {
              setIsPolling(false);
              showSuccess('Payment successful! Your wallet has been updated.');
              setTimeout(() => navigate('/wallet'), 2000);
            }
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [paymentResponse, isPolling, navigate, showSuccess]);

  const handleAmountSelect = (selectedAmount: number) => {
    setAmount(selectedAmount);
  };

  const handleCreatePayment = async () => {
    if (!amount || amount < 10000) {
      showError('Please select a valid amount');
      return;
    }

    try {
      setLoading(true);
      const request: SePayPaymentRequest = {
        amount,
        description: 'Top up wallet via SePay',
      };

      const result = await createSePayPayment(request);
      if (result.success && result.data) {
        setPaymentResponse(result.data);
        setIsPolling(true);
        showSuccess('Payment QR generated successfully!');
      } else {
        const msg = result.error || 'Failed to create payment';
        showError(`Payment failed: ${msg}`);
      }
    } catch (error: any) {
      showError(error?.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    showSuccess('Copied to clipboard!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Payment Success Screen
  if (paymentResponse) {
    return (
      <div className="w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-[95%] mx-auto px-2 sm:px-3 lg:px-4 py-12 sm:py-16">
          <button
            onClick={() => {
              setPaymentResponse(null);
              setPaymentStatus(null);
              setIsPolling(false);
              setAmount(null);
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 font-medium transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Create New Payment
          </button>

          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold flex items-center gap-3">
                    <QrCode className="w-10 h-10" />
                    Pay with SePay
                  </h1>
                  <p className="mt-2 text-blue-100">Scan QR or transfer manually</p>
                </div>
                <Sparkles className="w-12 h-12 text-white/30" />
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* Status + Balance */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Payment Status */}
                <div className={`p-6 rounded-2xl border-2 ${
                  paymentStatus?.status === 'Paid'
                    ? 'bg-emerald-50 border-emerald-300'
                    : 'bg-amber-50 border-amber-300'
                }`}>
                  <div className="flex items-center gap-3">
                    {paymentStatus?.status === 'Paid' ? (
                      <CheckCircle className="w-10 h-10 text-emerald-600" />
                    ) : (
                      <Clock className="w-10 h-10 text-amber-600 animate-pulse" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-600">Payment Status</p>
                      <p className={`text-2xl font-bold ${
                        paymentStatus?.status === 'Paid' ? 'text-emerald-700' : 'text-amber-700'
                      }`}>
                        {paymentStatus?.status === 'Paid' ? 'Paid' : 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Current Balance */}
                <div className="p-6 bg-gradient-to-br from-primary/10 to-primary-dark/10 rounded-2xl border-2 border-primary/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-primary-dark flex items-center gap-2">
                        <Wallet className="w-5 h-5" />
                        Current Balance
                      </p>
                      <p className="text-3xl font-bold text-primary-dark mt-2">
                        {formatCurrency(walletBalance)}
                      </p>
                    </div>
                    <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                  </div>
                  <p className="text-xs text-primary mt-2">Auto-updated every 5s</p>
                </div>
              </div>

              {/* QR Code */}
              <div className="text-center">
                <div className="inline-block p-8 bg-white rounded-3xl shadow-xl border border-gray-100">
                  <img
                    src={paymentResponse.qrCodeUrl}
                    alt="SePay QR Code"
                    className="w-72 h-72"
                  />
                </div>
                <p className="mt-6 text-lg font-medium text-gray-700">
                  Scan with your banking app
                </p>
              </div>

              {/* Payment Details */}
              <div className="bg-gray-50/80 rounded-2xl p-6 space-y-5">
                <h3 className="font-bold text-gray-900 text-lg">Payment Information</h3>
                {[
                  { label: 'Amount', value: formatCurrency(paymentResponse.amount), bold: true },
                  { label: 'Transfer Content', value: paymentResponse.transferContent, copy: 'content' },
                  { label: 'Bank Account', value: paymentResponse.bankInfo, copy: 'bank' },
                  { label: 'Reference Code', value: paymentResponse.orderReference, copy: 'reference' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between group">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">{item.label}:</p>
                      <p className={`font-mono text-sm mt-1 ${item.bold ? 'text-xl font-bold text-gray-900' : 'text-gray-800'}`}>
                        {item.value}
                      </p>
                    </div>
                    {item.copy && (
                      <button
                        onClick={() => handleCopy(item.value, item.copy!)}
                        className="ml-4 p-3 rounded-xl bg-white border-2 border-gray-200 hover:border-primary hover:bg-primary/10 transition-all group-hover:shadow-md"
                      >
                        {copiedField === item.copy ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Copy className="w-5 h-5 text-gray-500 group-hover:text-primary" />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Instructions */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
                <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <Shield className="w-6 h-6" />
                  Payment Instructions
                </h3>
                <ol className="space-y-2 text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-600">1.</span>
                    Open your banking app and scan the QR code above
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-600">2.</span>
                    Or transfer manually using exact Transfer Content
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-600">3.</span>
                    Amount must be exactly: <strong>{formatCurrency(paymentResponse.amount)}</strong>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-5 h-5 text-yellow-500 mt-0.5" />
                    System auto-detects payment within 30 seconds
                  </li>
                </ol>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => navigate('/wallet')}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-3"
                >
                  <Wallet className="w-6 h-6" />
                  Back to Wallet
                </button>
                <button
                  onClick={() => {
                    setPaymentResponse(null);
                    setPaymentStatus(null);
                    setIsPolling(false);
                    setAmount(null);
                    // Fetch latest wallet balance
                    if (user?.id) {
                      apiService.getUserWallet(user.id).then(res => {
                        if (res.success && res.data) {
                          setWalletBalance(res.data.walletBalance || 0);
                        }
                      }).catch(err => console.error('Error fetching wallet balance:', err));
                    }
                  }}
                  className="px-6 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  New Payment
                </button>
              </div>

              {isPolling && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Checking payment status every 5 seconds...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Top Up Selection Screen
  return (
    <div className="w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/wallet')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 font-medium transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Wallet
        </button>

        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-10 text-white text-center">
            <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-4">
              <Wallet className="w-12 h-12" />
              Top Up Your Wallet
            </h1>
            <p className="text-xl text-blue-100">Choose an amount to add instantly</p>
          </div>

          <div className="p-10">
            {/* Current Balance */}
            <div className="mb-10 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-700 font-semibold flex items-center gap-2">
                    <Wallet className="w-6 h-6" />
                    Current Balance
                  </p>
                  <p className="text-4xl font-bold text-emerald-900 mt-2">
                    {formatCurrency(walletBalance)}
                  </p>
                </div>
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
              </div>
            </div>

            {/* Amount Selection */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Select Amount
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {quickAmounts.map((value) => (
                  <button
                    key={value}
                    onClick={() => handleAmountSelect(value)}
                    className={`relative p-8 rounded-2xl border-4 font-bold text-xl transition-all transform hover:scale-105 ${
                      amount === value
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xl'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-xl'
                    }`}
                  >
                    <div className="text-center">
                      <p className="text-3xl">{formatCurrency(value)}</p>
                      {amount === value && (
                        <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mt-3" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Amount */}
            {amount && (
              <div className="mb-10 p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200 text-center">
                <p className="text-lg text-blue-700 font-medium">You selected</p>
                <p className="text-5xl font-bold text-blue-900 mt-3">
                  {formatCurrency(amount)}
                </p>
              </div>
            )}

            {/* Payment Info */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-200 mb-10">
              <div className="flex items-center justify-center gap-4 text-indigo-800">
                <QrCode className="w-10 h-10" />
                <div>
                  <h3 className="font-bold text-xl">Pay with SePay QR</h3>
                  <p className="text-sm mt-1">Instant • Secure • No fees</p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleCreatePayment}
              disabled={loading || !amount}
              className="w-full py-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xl rounded-2xl hover:shadow-2xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-7 h-7 animate-spin" />
                  <span>Creating Payment...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-7 h-7" />
                  <span>Continue to Payment</span>
                </>
              )}
            </button>

            <p className="text-center text-sm text-gray-500 mt-6">
              Minimum: 10,000 VND • Maximum: 50,000,000 VND
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopUpComponent;